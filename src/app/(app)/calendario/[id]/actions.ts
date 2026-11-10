"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CENTRAL_BANKS } from "@/data/central-banks";
import type { BankStance, Currency } from "@/lib/data/types";
import { analyzeSpeech, CONFIRM_ABOVE_USD, estimateCostUsd, fetchSource, MAX_CHARS, MODEL, type Source } from "@/lib/speech/analyze";
import type { StoredAnalysis } from "@/lib/speech/schema";
import { isSafeUrl } from "@/lib/speech/text";
import { createClient } from "@/lib/supabase/server";

export type AnalyzeState = { error?: string; ok?: number; confirm?: { chars: number; usd: number } } | undefined;

const input = z.object({
  id: z.uuid(),
  url: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || isSafeUrl(v), "O link tem de começar por https:// e ser de um site público."),
  texto: z
    .string()
    .trim()
    .max(MAX_CHARS, `O texto é demasiado longo (máx. ${MAX_CHARS.toLocaleString("pt-PT")} caracteres).`)
    .transform((v) => (v === "" ? null : v)),
});

export async function analyzeEvent(_: AnalyzeState, form: FormData): Promise<AnalyzeState> {
  const parsed = input.safeParse({ id: form.get("id"), url: form.get("url") ?? "", texto: form.get("texto") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, url, texto } = parsed.data;
  if (!url && !texto) return { error: "Cola o texto do discurso ou indica o link." };
  if (texto && texto.length < 300) return { error: "O texto é demasiado curto para uma análise útil (mín. 300 caracteres)." };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Falta configurar a chave da Anthropic (ANTHROPIC_API_KEY)." };

  const supabase = await createClient();
  const { data: ev, error } = await supabase.from("eventos").select("id, data_hora, moeda, nome").eq("id", id).single();
  if (error || !ev) return { error: "Evento não encontrado." };

  const bank = CENTRAL_BANKS.find((b) => b.code === (ev.moeda as Currency))!;
  // A leitura editada na app (se existir) prevalece sobre a inicial.
  const { data: own } = await supabase.from("leituras_bancos").select("postura, justificacao").eq("moeda", ev.moeda).maybeSingle();
  const stance = (own?.postura as BankStance | undefined) ?? bank.stance;
  const reasoning = own?.justificacao ?? bank.reasoning;
  const { data: prev } = await supabase
    .from("eventos")
    .select("data_hora, nome, analise")
    .eq("moeda", ev.moeda)
    .neq("id", id)
    .not("analise", "is", null)
    .order("data_hora", { ascending: false })
    .limit(3);

  let source: Source;
  try {
    source = texto ? { kind: "text", text: texto } : await fetchSource(url!);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível ler o link." };
  }

  // Textos longos: mostra o custo estimado e pede confirmação antes de gastar créditos.
  if (source.kind === "text" && form.get("confirmar") !== "1") {
    const usd = estimateCostUsd(source.text.length);
    if (usd > CONFIRM_ABOVE_USD) return { confirm: { chars: source.text.length, usd } };
  }

  let analysis: StoredAnalysis;
  try {
    analysis = await analyzeSpeech(source, {
      currency: ev.moeda,
      bank: bank.bank,
      eventName: ev.nome,
      eventDate: ev.data_hora.slice(0, 10),
      currentStance: stance,
      currentReasoning: reasoning,
      previous: (prev ?? []).map((p) => {
        const a = p.analise as StoredAnalysis;
        return { date: String(p.data_hora).slice(0, 10), name: p.nome, tom: a.tom, resumo: a.resumo };
      }),
    });
  } catch (e) {
    console.error("Análise falhou:", e);
    const msg = e instanceof Error ? e.message : "";
    if (/401|authentication|api[-_ ]key/i.test(msg)) return { error: "A chave da Anthropic não é válida." };
    if (/429|rate/i.test(msg)) return { error: "Limite de pedidos da Anthropic atingido. Tenta dentro de 1 minuto." };
    if (/credit|billing|balance/i.test(msg)) return { error: "Sem crédito na conta da Anthropic." };
    return { error: msg && msg.length < 200 ? msg : "A análise falhou. Tenta novamente." };
  }

  const { error: saveError } = await supabase
    .from("eventos")
    .update({
      texto: source.kind === "text" ? source.text : null,
      fonte_url: url,
      analise: analysis,
      analisado_em: new Date().toISOString(),
      analise_modelo: MODEL,
    })
    .eq("id", id);
  if (saveError) return { error: "A análise foi feita mas não foi possível guardá-la." };

  revalidatePath(`/calendario/${id}`);
  revalidatePath("/calendario");
  return { ok: Date.now() };
}
