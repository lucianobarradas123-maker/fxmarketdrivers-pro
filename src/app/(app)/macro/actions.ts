"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { STANCES } from "@/lib/speech/schema";
import { createClient } from "@/lib/supabase/server";

export type ReadingState = { error?: string; ok?: number } | undefined;

const schema = z.object({
  moeda: z.enum(["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"]),
  postura: z.enum(STANCES, "Escolhe a postura."),
  justificacao: z.string().trim().min(2, "Escreve uma justificação curta.").max(500, "Máximo 500 caracteres."),
});

/** Guarda (ou atualiza) a leitura do banco central de uma moeda. */
export async function saveReading(_: ReadingState, form: FormData): Promise<ReadingState> {
  const parsed = schema.safeParse({ moeda: form.get("moeda"), postura: form.get("postura"), justificacao: form.get("justificacao") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leituras_bancos")
    .upsert({ ...parsed.data, atualizado_em: new Date().toISOString() }, { onConflict: "user_id,moeda" });
  if (error) return { error: "Não foi possível guardar a leitura." };
  revalidatePath("/", "layout"); // painel, Macro e pré-operação usam a leitura
  return { ok: Date.now() };
}
