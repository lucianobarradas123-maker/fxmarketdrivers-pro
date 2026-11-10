import "server-only";
/** Leitura do diário e das definições da conta (tabelas protegidas por RLS). */
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, EntryContext } from "@/lib/journal";

export interface Settings {
  saldo: number;
  risco_pct: number;
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("definicoes_conta").select("saldo, risco_pct").maybeSingle();
  return data ? { saldo: Number(data.saldo), risco_pct: Number(data.risco_pct) } : null;
}

export interface Trade {
  id: string;
  estado: "aberta" | "fechada";
  par: string;
  direcao: "compra" | "venda";
  estrategia: string;
  emocao: string;
  motivo: string | null;
  aberta_em: string;
  preco_entrada: number;
  stop_pips: number;
  alvo_pips: number | null;
  lotes: number;
  valor_pip_eur: number;
  risco_eur: number;
  contexto: EntryContext;
  checklist: ChecklistItem[];
  captura_path: string | null;
  fechada_em: string | null;
  preco_saida: number | null;
  resultado_pips: number | null;
  resultado_r: number | null;
  resultado_eur: number | null;
  seguiu_plano: boolean | null;
  licoes: string | null;
}

const NUM = ["preco_entrada", "stop_pips", "alvo_pips", "lotes", "valor_pip_eur", "risco_eur", "preco_saida", "resultado_pips", "resultado_r", "resultado_eur"] as const;

export async function getTrades(limit = 500): Promise<{ now: number; trades: Trade[] }> {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from("operacoes").select("*").order("aberta_em", { ascending: false }).limit(limit);
  if (error) throw new Error("Não foi possível ler o diário.");
  const trades = (data ?? []).map((row) => {
    const t = { ...row } as Record<string, unknown>;
    for (const k of NUM) if (t[k] !== null && t[k] !== undefined) t[k] = Number(t[k]); // numeric chega como texto
    return t as unknown as Trade;
  });
  return { now: Date.now(), trades };
}

/** Link temporário (10 min) para ver uma captura privada. */
export async function captureUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("capturas").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
