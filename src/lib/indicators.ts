/**
 * Indicadores técnicos para o ecrã Pares (funções puras, testadas em indicators.test.ts).
 * Preferências do utilizador (D63): EMA 8 e 21, ATR, suportes e resistências; H4 para direção, H1 para entrada.
 */
import type { Trend } from "@/lib/data/types";
import type { Bar } from "@/lib/risk";

/** Média móvel exponencial. Devolve null nas primeiras (period − 1) posições. */
export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i < period - 1) return out.push(null);
    if (prev === null) prev = values.slice(0, period).reduce((s, x) => s + x, 0) / period; // semente: média simples
    else prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

/** Tendência num período: preço > EMA8 > EMA21 → ascendente; o inverso → descendente; senão lateral. */
export function trendEma(bars: Bar[], fast = 8, slow = 21): Trend {
  if (bars.length < slow + 1) throw new Error("Velas insuficientes para a tendência");
  const closes = bars.map((b) => b.close);
  const f = ema(closes, fast).at(-1)!;
  const s = ema(closes, slow).at(-1)!;
  const p = closes.at(-1)!;
  if (p > f && f > s) return "ascendente";
  if (p < f && f < s) return "descendente";
  return "lateral";
}

/** ATR em preço (não em pips), média simples dos últimos N true ranges. */
export function atrPrice(bars: Bar[], period = 14): number {
  if (bars.length < period + 1) throw new Error("Velas insuficientes para o ATR");
  let sum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const b = bars[i];
    const prev = bars[i - 1].close;
    sum += Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));
  }
  return sum / period;
}

export interface Level {
  price: number;
  touches: number; // quantos pontos de viragem o confirmam
  kind: "suporte" | "resistência";
}

/**
 * Pontos de viragem (fractais): uma máxima mais alta que as N velas de cada lado, ou uma mínima mais baixa.
 */
export function swings(bars: Bar[], side = 2): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = side; i < bars.length - side; i++) {
    const win = bars.slice(i - side, i + side + 1);
    if (win.every((b, j) => j === side || b.high < bars[i].high)) highs.push(bars[i].high);
    if (win.every((b, j) => j === side || b.low > bars[i].low)) lows.push(bars[i].low);
  }
  return { highs, lows };
}

/**
 * Suportes e resistências: agrupa pontos de viragem próximos (dentro de `tolerance` em preço) num nível
 * e ordena por força (n.º de toques). Abaixo do preço → suporte; acima → resistência.
 */
export function supportResistance(bars: Bar[], price: number, tolerance: number, maxEachSide = 3): Level[] {
  const { highs, lows } = swings(bars);
  const points = [...highs, ...lows].sort((a, b) => a - b);
  const clusters: { sum: number; n: number }[] = [];
  for (const p of points) {
    const last = clusters.at(-1);
    if (last && p - last.sum / last.n <= tolerance) {
      last.sum += p;
      last.n += 1;
    } else clusters.push({ sum: p, n: 1 });
  }
  const levels = clusters.map((c) => ({ price: c.sum / c.n, touches: c.n }));
  const below = levels
    .filter((l) => l.price < price)
    .sort((a, b) => b.price - a.price) // mais próximos primeiro
    .slice(0, maxEachSide)
    .map((l) => ({ ...l, kind: "suporte" as const }));
  const above = levels
    .filter((l) => l.price > price)
    .sort((a, b) => a.price - b.price)
    .slice(0, maxEachSide)
    .map((l) => ({ ...l, kind: "resistência" as const }));
  return [...above.reverse(), ...below];
}
