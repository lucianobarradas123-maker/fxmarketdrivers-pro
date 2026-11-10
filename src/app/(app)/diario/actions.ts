"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeResult, EMOTIONS, STRATEGIES } from "@/lib/journal";
import { isPair } from "@/lib/pairs";
import { createClient } from "@/lib/supabase/server";

export type JournalState = { error?: string; ok?: number; id?: string } | undefined;

const num = (label: string) =>
  z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number({ error: `${label}: valor inválido.` }).positive(`${label}: tem de ser positivo.`));
const optNum = (label: string) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number({ error: `${label}: valor inválido.` }).positive().nullable());

function refresh() {
  revalidatePath("/diario");
  revalidatePath("/");
}

// ——— Definições da conta ———
const settingsSchema = z.object({
  saldo: num("Saldo").refine((v) => v < 1e8, "Saldo demasiado alto."),
  risco_pct: num("Risco").refine((v) => v <= 10, "Risco máximo: 10%."),
});

export async function saveSettings(_: JournalState, form: FormData): Promise<JournalState> {
  const parsed = settingsSchema.safeParse({ saldo: form.get("saldo"), risco_pct: form.get("risco_pct") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("definicoes_conta").upsert(parsed.data, { onConflict: "user_id" });
  if (error) return { error: "Não foi possível guardar as definições." };
  refresh();
  revalidatePath("/pre-operacao");
  return { ok: Date.now() };
}

// ——— Abrir operação (a partir da pré-operação) ———
const MAX_JSON = 20_000;
const jsonField = z
  .string()
  .max(MAX_JSON)
  .transform((s, ctx) => {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Contexto inválido." });
      return z.NEVER;
    }
  });

const openSchema = z.object({
  par: z.string().refine(isPair, "Par inválido."),
  direcao: z.enum(["compra", "venda"]),
  estrategia: z.enum(STRATEGIES, "Escolhe a estratégia."),
  emocao: z.enum(EMOTIONS, "Escolhe como te sentes."),
  motivo: z.string().trim().max(2000).transform((v) => (v === "" ? null : v)),
  preco_entrada: num("Preço de entrada"),
  stop_pips: num("Stop"),
  alvo_pips: optNum("Alvo"),
  lotes: num("Lotes").refine((v) => v <= 100, "Lotes: valor demasiado alto."),
  valor_pip_eur: num("Valor do pip"),
  saldo_na_entrada: optNum("Saldo"),
  contexto: jsonField.pipe(z.record(z.string(), z.unknown())),
  checklist: jsonField.pipe(z.array(z.object({ label: z.string().max(200), status: z.enum(["ok", "alerta", "falha", "pendente", "info"]) })).max(20)),
});

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_IMAGE = 5 * 1024 * 1024;

export async function openTrade(_: JournalState, form: FormData): Promise<JournalState> {
  const parsed = openSchema.safeParse(Object.fromEntries(["par", "direcao", "estrategia", "emocao", "motivo", "preco_entrada", "stop_pips", "alvo_pips", "lotes", "valor_pip_eur", "saldo_na_entrada", "contexto", "checklist"].map((k) => [k, form.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const file = form.get("captura");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (image && (!IMAGE_TYPES[image.type] || image.size > MAX_IMAGE)) return { error: "Captura: só PNG, JPG ou WEBP até 5 MB." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;
  if (!uid) return { error: "Sessão expirada. Entra novamente." };

  // O risco é recalculado no servidor (não confia no valor vindo do browser).
  const risco_eur = Math.round(d.lotes * d.stop_pips * d.valor_pip_eur * 100) / 100;
  const { data: row, error } = await supabase
    .from("operacoes")
    .insert({ ...d, risco_eur })
    .select("id")
    .single();
  if (error || !row) return { error: "Não foi possível registar a operação." };

  if (image) {
    const path = `${uid}/${row.id}.${IMAGE_TYPES[image.type]}`;
    const { error: upErr } = await supabase.storage.from("capturas").upload(path, image, { contentType: image.type, upsert: true });
    if (!upErr) await supabase.from("operacoes").update({ captura_path: path }).eq("id", row.id);
    else console.error("Falha ao guardar captura:", upErr.message);
  }
  refresh();
  return { ok: Date.now(), id: row.id };
}

// ——— Fechar operação ———
const closeSchema = z.object({
  id: z.uuid(),
  preco_saida: num("Preço de saída"),
  resultado_eur: z.preprocess((v) => (v === "" || v === null ? null : Number(String(v).replace(",", "."))), z.number({ error: "Resultado em €: valor inválido." }).nullable()),
  seguiu_plano: z.enum(["sim", "nao"], "Indica se seguiste o plano."),
  licoes: z.string().trim().max(2000).transform((v) => (v === "" ? null : v)),
});

export async function closeTrade(_: JournalState, form: FormData): Promise<JournalState> {
  const parsed = closeSchema.safeParse({
    id: form.get("id"),
    preco_saida: form.get("preco_saida"),
    resultado_eur: form.get("resultado_eur") ?? "",
    seguiu_plano: form.get("seguiu_plano"),
    licoes: form.get("licoes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const supabase = await createClient();
  const { data: op } = await supabase
    .from("operacoes")
    .select("par, direcao, preco_entrada, stop_pips, lotes, valor_pip_eur, estado")
    .eq("id", d.id)
    .single();
  if (!op || op.estado !== "aberta") return { error: "Operação não encontrada ou já fechada." };
  const r = computeResult({
    pair: op.par,
    side: op.direcao,
    entry: Number(op.preco_entrada),
    exit: d.preco_saida,
    stopPips: Number(op.stop_pips),
    lots: Number(op.lotes),
    pipValue: Number(op.valor_pip_eur),
  });
  const { error } = await supabase
    .from("operacoes")
    .update({
      estado: "fechada",
      fechada_em: new Date().toISOString(),
      preco_saida: d.preco_saida,
      resultado_pips: r.pips,
      resultado_r: r.r,
      // Se indicares o resultado real do MetaTrader (com comissões/swap), prevalece sobre o calculado.
      resultado_eur: d.resultado_eur ?? r.eur,
      seguiu_plano: d.seguiu_plano === "sim",
      licoes: d.licoes,
    })
    .eq("id", d.id);
  if (error) return { error: "Não foi possível fechar a operação." };
  refresh();
  return { ok: Date.now() };
}

export async function deleteTrade(form: FormData) {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: op } = await supabase.from("operacoes").select("captura_path").eq("id", id.data).single();
  if (op?.captura_path) await supabase.storage.from("capturas").remove([op.captura_path]);
  await supabase.from("operacoes").delete().eq("id", id.data);
  refresh();
}
