import "server-only";
/**
 * Dados do sentimento de risco. Em cache durante horas.
 * Fontes: CBOE (VIX, oficial, diário) · Twelve Data (SPY, AUD/JPY, XAU/USD — diários, atrasados).
 */
import { cacheLife, cacheTag } from "next/cache";
import { fetchDailyBars } from "@/lib/market";
import { computeRisk, type RiskSentiment } from "@/lib/sentiment";

const VIX_URL = "https://cdn-api.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv";

async function latestVix(): Promise<{ value: number; date: string }> {
  const res = await fetch(VIX_URL);
  if (!res.ok) throw new Error(`CBOE respondeu ${res.status}`);
  const lines = (await res.text()).trim().split(/\r?\n/);
  const [date, , , , close] = lines[lines.length - 1].split(",");
  const value = Number(close);
  if (!(value > 0)) throw new Error("VIX inválido");
  const [m, d, y] = date.split("/");
  return { value, date: `${y}-${m}-${d}` };
}

/** Nunca lança erro dentro da cache (ver retail-data.ts); falhas ficam em cache só por minutos. */
export async function getRiskSentiment(): Promise<RiskSentiment | { error: string }> {
  "use cache";
  cacheTag("sentimento-risco");
  try {
    const r = await fetchRisk();
    cacheLife("hours");
    return r;
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

async function fetchRisk(): Promise<RiskSentiment> {
  const [vix, spy, audjpy, gold] = await Promise.all([
    latestVix(),
    fetchDailyBars("SPY"),
    fetchDailyBars("AUD/JPY"),
    fetchDailyBars("XAU/USD"),
  ]);
  const closes = (b: { bars: { close: number }[] }) => b.bars.map((x) => x.close);
  const dates = [vix.date, ...[spy, audjpy, gold].map((b) => b.bars[b.bars.length - 1].date)].sort();
  return computeRisk({ vix: vix.value, spx: closes(spy), audjpy: closes(audjpy), gold: closes(gold), asOf: dates[0] });
}

/** Versão tolerante a falhas: se uma fonte falhar, a app continua sem o componente de sentimento. */
export async function getRiskSentimentSafe(): Promise<RiskSentiment | null> {
  const r = await getRiskSentiment();
  if ("error" in r) {
    console.error("Sentimento de risco indisponível:", r.error);
    return null;
  }
  return r;
}
