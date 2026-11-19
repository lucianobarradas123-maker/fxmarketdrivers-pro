/** Histórico do sentimento de risco (~2 anos). Exige sessão. */
import { NextResponse } from "next/server";
import { getRiskHistory } from "@/lib/history-data";
import { RATE_LIMITED } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Sessão expirada. Entra novamente." }, { status: 401 });
  const r = await getRiskHistory();
  if ("error" in r) {
    const limited = r.error === RATE_LIMITED;
    return NextResponse.json(
      { error: limited ? "Limite de pedidos de preços por minuto atingido. A tentar de novo dentro de 1 minuto…" : `Histórico indisponível: ${r.error}`, retryAfter: limited ? 60 : null },
      { status: limited ? 429 : 502 },
    );
  }
  return NextResponse.json({ ...r, source: "CBOE (VIX) e Twelve Data (SPY, AUD/JPY, ouro), diários; mesma fórmula do indicador atual" });
}
