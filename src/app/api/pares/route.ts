/** Dados do ecrã Pares: velas H4/H1/D1 com EMA 8/21, ATR, tendência, suportes/resistências e contexto. */
import { NextResponse, type NextRequest } from "next/server";
import { getUpcoming } from "@/lib/events";
import { atrPrice, ema, supportResistance, trendEma } from "@/lib/indicators";
import { getMacro } from "@/lib/macro/build";
import { getReadings } from "@/lib/macro/readings";
import { alignment, biasFrom } from "@/lib/macro/score";
import { dailyBars, intradayBars, RATE_LIMITED } from "@/lib/market";
import { currenciesOf, isPair } from "@/lib/pairs";
import { pipSize, type Bar } from "@/lib/risk";
import { getRiskSentimentSafe } from "@/lib/sentiment-data";
import { createClient } from "@/lib/supabase/server";

const SHOW = { H4: 180, H1: 240, D1: 120 } as const;

function toSeconds(date: string): number {
  // "2026-11-11 20:00:00" ou "2026-11-11" (UTC)
  return Math.floor(Date.parse(date.length === 10 ? `${date}T00:00:00Z` : `${date.replace(" ", "T")}Z`) / 1000);
}

function frame(bars: Bar[], pair: string, show: number) {
  const closes = bars.map((b) => b.close);
  const e8 = ema(closes, 8);
  const e21 = ema(closes, 21);
  const from = Math.max(0, bars.length - show);
  const slice = bars.slice(from);
  return {
    candles: slice.map((b) => ({ time: toSeconds(b.date), open: b.open, high: b.high, low: b.low, close: b.close })),
    ema8: slice.map((b, i) => ({ time: toSeconds(b.date), value: e8[from + i] })).filter((p) => p.value !== null),
    ema21: slice.map((b, i) => ({ time: toSeconds(b.date), value: e21[from + i] })).filter((p) => p.value !== null),
    trend: trendEma(bars),
    atrPips: Math.round(atrPrice(bars) / pipSize(pair)),
    lastTime: bars.at(-1)!.date,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Sessão expirada. Entra novamente." }, { status: 401 });

  const pair = request.nextUrl.searchParams.get("par") ?? "";
  if (!isPair(pair)) return NextResponse.json({ error: "Par inválido." }, { status: 400 });
  const [base, quote] = currenciesOf(pair);

  try {
    const [h4, h1, d1, risk, readings, upcoming] = await Promise.all([
      intradayBars(pair, "4h"),
      intradayBars(pair, "1h"),
      dailyBars(pair),
      getRiskSentimentSafe(),
      getReadings(),
      getUpcoming(2, "alto"),
    ]);
    for (const r of [h4, h1, d1]) {
      if ("error" in r) {
        const limited = r.error === RATE_LIMITED;
        return NextResponse.json(
          { error: limited ? "Limite de pedidos de preços por minuto atingido. A tentar de novo dentro de 1 minuto…" : `Preços indisponíveis: ${r.error}`, retryAfter: limited ? 60 : null },
          { status: limited ? 429 : 502 },
        );
      }
    }
    const H4 = (h4 as { bars: Bar[] }).bars;
    const H1 = (h1 as { bars: Bar[] }).bars;
    const D1 = (d1 as { bars: Bar[] }).bars;

    const price = H1.at(-1)!.close;
    // Suportes/resistências a partir do H4 (≈ 50 dias), tolerância de meio ATR do H4.
    const levels = supportResistance(H4, price, atrPrice(H4) * 0.5).map((l) => ({
      ...l,
      distancePips: Math.round((l.price - price) / pipSize(pair)),
    }));

    const macro = getMacro(risk, readings);
    const b = macro.find((c) => c.code === base)!;
    const q = macro.find((c) => c.code === quote)!;
    const divergence = Math.round((b.total - q.total) * 10) / 10;
    const bias = biasFrom(divergence);
    const frames = { H4: frame(H4, pair, SHOW.H4), H1: frame(H1, pair, SHOW.H1), D1: frame(D1, pair, SHOW.D1) };

    return NextResponse.json({
      pair,
      price,
      digits: pair.endsWith("/JPY") ? 3 : 5,
      frames,
      levels,
      macro: { bias, divergence, base: b.total, quote: q.total, alignmentH4: alignment(bias, frames.H4.trend) },
      risk: risk ? { index: risk.index, label: risk.label } : null,
      events: upcoming.events.filter((e) => e.moeda === base || e.moeda === quote).map((e) => ({ time: e.data_hora, currency: e.moeda, name: e.nome })),
      source: "Twelve Data (velas H1/H4 em UTC, atualização ~15 min; D1 diária). Não são os preços da tua corretora.",
    });
  } catch (e) {
    console.error("Erro no ecrã Pares:", e);
    return NextResponse.json({ error: "Não foi possível preparar os dados deste par." }, { status: 500 });
  }
}
