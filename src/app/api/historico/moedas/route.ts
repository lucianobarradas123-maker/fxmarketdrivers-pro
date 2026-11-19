/** Histórico das moedas: força pelo preço (~12 meses) e força macro registada (desde o início do registo). Exige sessão. */
import { NextResponse } from "next/server";
import { getMacroHistory, getPriceStrength } from "@/lib/history-data";
import { RATE_LIMITED } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Sessão expirada. Entra novamente." }, { status: 401 });
  const [price, macro] = await Promise.all([getPriceStrength(), getMacroHistory(supabase).catch(() => null)]);
  const limited = "error" in price && price.error === RATE_LIMITED;
  return NextResponse.json(
    {
      price: "error" in price ? null : price.days,
      priceError: "error" in price ? (limited ? "Limite de pedidos de preços por minuto atingido. A tentar de novo dentro de 1 minuto…" : price.error) : null,
      retryAfter: limited ? 60 : null,
      macro: macro ?? [],
      source: "Preço: Twelve Data, 7 pares contra o USD (diários). Macro: registo diário da pontuação da app.",
    },
    { status: 200 },
  );
}
