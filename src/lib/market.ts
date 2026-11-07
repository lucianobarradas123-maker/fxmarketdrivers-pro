import "server-only";
/**
 * Preços diários da Twelve Data (D: fonte de preços = Twelve Data, plano gratuito).
 * Origem: agregação de fornecedores de FX; NÃO são os preços da IC Markets (diferenças pequenas).
 * Frequência: barras diárias; guardadas em cache durante algumas horas para respeitar o limite gratuito.
 */
import { cacheLife, cacheTag } from "next/cache";
import { currenciesOf } from "@/lib/pairs";
import { completedWeekdayBars, type Bar } from "@/lib/risk";

const BASE = "https://api.twelvedata.com";

function apiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error("Falta a chave da Twelve Data (TWELVE_DATA_API_KEY).");
  return key;
}

async function td<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `apikey ${apiKey()}` } });
  const body = (await res.json()) as T & { status?: string; code?: number; message?: string };
  if (!res.ok || body.status === "error") {
    if (body.code === 429) throw new Error("Limite de pedidos da Twelve Data atingido. Tenta dentro de 1 minuto.");
    throw new Error(`Twelve Data: ${body.message ?? res.status}`);
  }
  return body;
}

interface SeriesResponse {
  values: { datetime: string; open: string; high: string; low: string; close: string }[];
}

/** Últimas N barras diárias, da mais antiga para a mais recente. */
export async function dailyBars(pair: string, count = 100): Promise<{ bars: Bar[]; fetchedAt: string }> {
  "use cache";
  cacheLife("hours");
  cacheTag(`precos-${pair}`);
  const data = await td<SeriesResponse>(`/time_series?symbol=${encodeURIComponent(pair)}&interval=1day&outputsize=${count}`);
  const now = new Date();
  const all = data.values
    .map((v) => ({ date: v.datetime, open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
    .filter((b) => [b.open, b.high, b.low, b.close].every(Number.isFinite) && b.low <= b.high)
    .reverse();
  const bars = completedWeekdayBars(all, now.toISOString().slice(0, 10));
  if (bars.length < 35) throw new Error(`Histórico insuficiente para ${pair}`);
  return { bars, fetchedAt: now.toISOString() };
}

/** Taxa EUR/<moeda cotada> para converter o valor do pip para EUR. null se a cotada for EUR. */
export async function eurRateFor(pair: string): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  const quote = currenciesOf(pair)[1];
  if (quote === "EUR") return null;
  const data = await td<{ price: string }>(`/price?symbol=EUR/${quote}`);
  const price = Number(data.price);
  if (!(price > 0)) throw new Error(`Taxa EUR/${quote} inválida`);
  return price;
}
