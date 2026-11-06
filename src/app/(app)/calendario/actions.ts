"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { lisbonToUtc } from "@/lib/time";

export type ActionState = { error?: string; ok?: number } | undefined;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v));

const eventSchema = z.object({
  data_hora: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Indica a data e a hora."),
  moeda: z.enum(["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"], "Escolhe a moeda."),
  nome: z.string().trim().min(2, "Indica o evento.").max(120),
  impacto: z.enum(["alto", "médio", "baixo"], "Escolhe o impacto."),
  previsao: optionalText(30),
  anterior: optionalText(30),
});

function refresh() {
  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function addEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = eventSchema.safeParse({
    data_hora: form.get("data_hora"),
    moeda: form.get("moeda"),
    nome: form.get("nome"),
    impacto: form.get("impacto"),
    previsao: form.get("previsao") ?? "",
    anterior: form.get("anterior") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("eventos")
    .insert({ ...parsed.data, data_hora: lisbonToUtc(parsed.data.data_hora).toISOString() });
  if (error) return { error: "Não foi possível guardar o evento." };
  refresh();
  return { ok: Date.now() };
}

export async function setActual(_: ActionState, form: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(form.get("id"));
  const atual = optionalText(30).safeParse(form.get("atual") ?? "");
  if (!id.success || !atual.success) return { error: "Valor inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").update({ atual: atual.data }).eq("id", id.data);
  if (error) return { error: "Não foi possível guardar." };
  refresh();
  return { ok: Date.now() };
}

export async function deleteEvent(form: FormData) {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("eventos").delete().eq("id", id.data);
  refresh();
}
