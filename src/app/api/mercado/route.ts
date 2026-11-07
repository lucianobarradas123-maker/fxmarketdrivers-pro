/** Dados de mercado de um par para a pré-operação. Protegido pelo proxy (exige sessão). */
import { NextResponse, type NextRequest } from "next/server";
import { getUpcoming } from "@/lib/events";
import { getMacro } from "@/lib/macro/build";
import { alignment, biasFrom, volLevel } from "@/lib/macro/score";
import { dailyBars, eurRateFor } from "@/lib/market";
import { currenciesOf, isPair } from "@/lib/pairs";
import { atrAverage, atrPips, pipValueEur, trendOf } from "@/lib/risk";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Segunda barreira, além do proxy: exige sessão válida.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Sessão expirada. Entra novamente." }, { status: 401 });

  const pair = request.nextUrl.searchParams.get("par") ?? "";
  if (!isPair(pair)) return NextResponse.json({ error: "Par inválido." }, { status: 400 });
  const [base, quote] = currenciesOf(pair);

  try {
    const [{ bars, fetchedAt }, eurRate, upcoming] = await Promise.all([dailyBars(pair), eurRateFor(pair), getUpcoming(1, "alto")]);
    const macro = getMacro();
    const b = macro.find((c) => c.code === base)!;
    const q = macro.find((c) => c.code === quote)!;
    const divergence = Math.round((b.total - q.total) * 10) / 10;
    const bias = biasFrom(divergence);
    const trend = trendOf(bars);
    const atr = atrPips(bars, pair);
    const atrAvg = atrAverage(bars, pair);
    const last = bars[bars.length - 1];

    return NextResponse.json({
      pair,
      price: last.close,
      lastBar: last.date,
      pipValue: pipValueEur(pair, eurRate),
      eurRate,
      atr: Math.round(atr * 10) / 10,
      atrAvg: Math.round(atrAvg * 10) / 10,
      vol: volLevel(atr, atrAvg),
      trend,
      macro: { base: b.total, quote: q.total, divergence, bias, alignment: alignment(bias, trend) },
      events: upcoming.events
        .filter((e) => e.moeda === base || e.moeda === quote)
        .map((e) => ({ time: e.data_hora, currency: e.moeda, name: e.nome })),
      now: upcoming.now,
      source: { prices: "Twelve Data (barras diárias, atrasadas)", fetchedAt, macro: "OCDE + leitura manual" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao obter dados de mercado." }, { status: 502 });
  }
}
