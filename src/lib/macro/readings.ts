import "server-only";
/** Leituras dos bancos centrais editadas pelo utilizador (tabela leituras_bancos, protegida por RLS). */
import { createClient } from "@/lib/supabase/server";
import type { BankStance, Currency } from "@/lib/data/types";
import type { Readings } from "./build";

export async function getReadings(): Promise<Readings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leituras_bancos").select("moeda, postura, justificacao, atualizado_em");
  if (error) throw new Error("Não foi possível ler as leituras dos bancos centrais.");
  const out: Readings = {};
  for (const r of data ?? []) {
    out[r.moeda as Currency] = { stance: r.postura as BankStance, reasoning: r.justificacao, updatedAt: r.atualizado_em };
  }
  return out;
}
