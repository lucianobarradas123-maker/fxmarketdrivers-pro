import "server-only";
/**
 * Preços diários da Twelve Data (D: fonte de preços = Twelve Data, plano gratuito).
 * Origem: agregação de fornecedores de FX; NÃO são os preços da IC Markets (diferenças pequenas).
 * Frequência: barras diárias; guardadas em cache durante algumas horas para respeitar o limite gratuito.
 */
import { cacheLife, cacheTag } from "next/cache";
import { currenciesOf } from "@/lib/pairs";
import { parseEcbRates } from "@/lib/ecb";
import { completedWeekdayBars, marketHoursBars, type Bar } from "@/lib/risk";

const BASE = "https://api.twelvedata.com";
/** Mensagem usada quando o limite de pedidos por minuto é atingido (a interface volta a tentar sozinha). */
export const RATE_LIMITED = "Limite de pedidos por minuto da Twelve Data atingido.";

function apiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error("Falta a chave da Twelve Data (TWELVE_DATA_API_KEY).");
  return key;
}

async function td<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `apikey ${apiKey()}` } });
  const body = (await res.json()) as T & { status?: string; code?: number; message?: string };
  if (!res.ok || body.status === "error") {
    if (body.code === 429 || res.status === 429) throw new Error(RATE_LIMITED);
    throw new Error(`Twelve Data: ${body.message ?? res.status}`);
  }
  return body;
}

interface SeriesResponse {
  values: { datetime: string; open: string; high: string; low: string; close: string }[];
}

/** Últimas N barras diárias completas de dias úteis, da mais antiga para a mais recente (pares, ouro ou ETF). */
export async function dailyBars(pair: string, count = 100): Promise<{ bars: Bar[]; fetchedAt: string } | { error: string }> {
  "use cache";
  cacheTag(`precos-${pair}`);
  try {
    const r = await fetchDailyBars(pair, count);
    cacheLife("hours");
    return r;
  } catch (e) {
    cacheLife("seconds"); // falhas (ex.: limite por minuto) não ficam guardadas
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

/** Versão sem cache própria (para usar dentro de outras funções com cache). */
export async function fetchDailyBars(pair: string, count = 100): Promise<{ bars: Bar[]; fetchedAt: string }> {
  const data = await td<SeriesResponse>(`/time_series?symbol=${encodeURIComponent(pair)}&interval=1day&outputsize=${count}&timezone=UTC`);
  const now = new Date();
  const all = data.values
    .map((v) => ({ date: v.datetime, open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
    .filter((b) => [b.open, b.high, b.low, b.close].every(Number.isFinite) && b.low <= b.high)
    .reverse();
  const bars = completedWeekdayBars(all, now.toISOString().slice(0, 10));
  if (bars.length < 35) throw new Error(`Histórico insuficiente para ${pair}`);
  return { bars, fetchedAt: now.toISOString() };
}

/** Taxas de referência do BCE (todas as moedas num só pedido, sem chave). Em cache durante horas. */
async function ecbRates(): Promise<{ date: string; rates: Record<string, number> } | { error: string }> {
  "use cache";
  cacheTag("taxas-bce");
  try {
    const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml");
    if (!res.ok) throw new Error(`BCE respondeu ${res.status}`);
    const r = parseEcbRates(await res.text());
    cacheLife("hours");
    return r;
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

/** Alternativa se o BCE falhar: preço atual da Twelve Data (gasta 1 pedido). */
async function twelveDataPrice(symbol: string): Promise<number | { error: string }> {
  "use cache";
  try {
    const data = await td<{ price: string }>(`/price?symbol=${encodeURIComponent(symbol)}`);
    const price = Number(data.price);
    if (!(price > 0)) throw new Error(`Taxa ${symbol} inválida`);
    cacheLife("hours");
    return price;
  } catch (e) {
    cacheLife("seconds");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

/**
 * Taxa EUR/<moeda cotada> para converter o valor do pip para EUR (null se a cotada for EUR).
 * Fonte: taxas de referência do BCE; se indisponíveis, Twelve Data.
 */
export async function eurRateFor(pair: string): Promise<{ rate: number | null; source: string } | { error: string }> {
  const quote = currenciesOf(pair)[1];
  if (quote === "EUR") return { rate: null, source: "—" };
  const ecb = await ecbRates();
  if (!("error" in ecb) && ecb.rates[quote] > 0) return { rate: ecb.rates[quote], source: `BCE, ${ecb.date}` };
  const fallback = await twelveDataPrice(`EUR/${quote}`);
  return typeof fallback === "number" ? { rate: fallback, source: "Twelve Data" } : fallback;
}

type SeriesValues = SeriesResponse["values"];

/**
 * Barras diárias de vários pares num único pedido (1 crédito por par).
 * Nunca lança erro dentro da cache (D50): devolve { error } com cache de minutos.
 */
export async function dailyBarsBatch(pairs: string[], count = 100): Promise<Record<string, Bar[]> | { error: string }> {
  "use cache";
  cacheTag("precos-lote");
  try {
    if (pairs.length < 2) throw new Error("O pedido em lote precisa de pelo menos 2 pares");
    const data = await td<Record<string, { status?: string; message?: string; values?: SeriesValues }>>(
      `/time_series?symbol=${encodeURIComponent(pairs.join(","))}&interval=1day&outputsize=${count}&timezone=UTC`,
    );
    const today = new Date().toISOString().slice(0, 10);
    const out: Record<string, Bar[]> = {};
    for (const pair of pairs) {
      const entry = data[pair];
      if (!entry?.values || entry.status === "error") continue;
      const all = entry.values
        .map((v) => ({ date: v.datetime, open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
        .filter((b) => [b.open, b.high, b.low, b.close].every(Number.isFinite) && b.low <= b.high)
        .reverse();
      const bars = completedWeekdayBars(all, today);
      if (bars.length >= 50) out[pair] = bars;
    }
    cacheLife("hours");
    return out;
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

export type Intraday = "1h" | "4h";

/**
 * Velas intradiárias (1h ou 4h) em UTC. Cache de ~15 min. Nunca lança erro dentro da cache (D50).
 * Gasta 1 pedido da Twelve Data por atualização.
 */
export async function intradayBars(pair: string, interval: Intraday, count = 300): Promise<{ bars: Bar[]; fetchedAt: string } | { error: string }> {
  "use cache";
  cacheTag(`precos-${pair}-${interval}`);
  try {
    const data = await td<SeriesResponse>(
      `/time_series?symbol=${encodeURIComponent(pair)}&interval=${interval}&outputsize=${count}&timezone=UTC`,
    );
    const bars = marketHoursBars(
      data.values
        .map((v) => ({ date: v.datetime, open: +v.open, high: +v.high, low: +v.low, close: +v.close }))
        .filter((b) => [b.open, b.high, b.low, b.close].every(Number.isFinite) && b.low <= b.high)
        .reverse(),
    );
    if (bars.length < 50) throw new Error(`Histórico ${interval} insuficiente para ${pair}`);
    cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
    return { bars, fetchedAt: new Date().toISOString() };
  } catch (e) {
    cacheLife("seconds");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}
