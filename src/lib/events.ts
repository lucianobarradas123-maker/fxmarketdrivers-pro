import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Currency, Impact } from "@/lib/data/types";

export interface EventRow {
  id: string;
  data_hora: string;
  moeda: Currency;
  nome: string;
  impacto: Impact;
  previsao: string | null;
  anterior: string | null;
  atual: string | null;
  notas: string | null;
  analise: unknown | null;
}

const COLS = "id, data_hora, moeda, nome, impacto, previsao, anterior, atual, notas, analise";

/** Eventos de N dias atrás até M dias à frente (a base de dados só devolve os do utilizador com sessão). */
export async function getEvents(daysBack: number, daysAhead: number): Promise<{ now: number; events: EventRow[] }> {
  await connection(); // dados por pedido: a hora atual e a sessão mudam a cada visita
  const now = Date.now();
  const fromIso = new Date(now - daysBack * 864e5).toISOString();
  const toIso = new Date(now + daysAhead * 864e5).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select(COLS)
    .gte("data_hora", fromIso)
    .lt("data_hora", toIso)
    .order("data_hora", { ascending: true })
    .limit(300);
  if (error) throw new Error("Não foi possível ler o calendário.");
  return { now, events: (data ?? []) as EventRow[] };
}

/** Próximos eventos a partir de agora. */
export async function getUpcoming(days = 7, impact?: Impact): Promise<{ now: number; events: EventRow[] }> {
  await connection();
  const now = Date.now();
  const supabase = await createClient();
  let q = supabase
    .from("eventos")
    .select(COLS)
    .gte("data_hora", new Date(now).toISOString())
    .lt("data_hora", new Date(now + days * 864e5).toISOString())
    .order("data_hora", { ascending: true })
    .limit(50);
  if (impact) q = q.eq("impacto", impact);
  const { data, error } = await q;
  if (error) throw new Error("Não foi possível ler o calendário.");
  return { now, events: (data ?? []) as EventRow[] };
}
