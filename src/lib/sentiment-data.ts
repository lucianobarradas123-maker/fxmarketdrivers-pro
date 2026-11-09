import "server-only";
/**
 * Dados do sentimento de risco. Em cache durante horas.
 * Fontes: CBOE (VIX, oficial, diário) · Twelve Data (SPY, AUD/JPY, XAU/USD — diários, atrasados).
 */
import { cacheLife, cacheTag } from "next/cache";
import { dailyBars } from "@/lib/market";
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

export async function getRiskSentiment(): Promise<RiskSentiment> {
  "use cache";
  cacheLife("hours");
  cacheTag("sentimento-risco");
  const [vix, spy, audjpy, gold] = await Promise.all([
    latestVix(),
    dailyBars("SPY"),
    dailyBars("AUD/JPY"),
    dailyBars("XAU/USD"),
  ]);
  const closes = (b: { bars: { close: number }[] }) => b.bars.map((x) => x.close);
  const dates = [vix.date, ...[spy, audjpy, gold].map((b) => b.bars[b.bars.length - 1].date)].sort();
  return computeRisk({ vix: vix.value, spx: closes(spy), audjpy: closes(audjpy), gold: closes(gold), asOf: dates[0] });
}

/** Versão tolerante a falhas: se uma fonte falhar, a app continua sem o componente de sentimento. */
export async function getRiskSentimentSafe(): Promise<RiskSentiment | null> {
  try {
    return await getRiskSentiment();
  } catch (e) {
    console.error("Sentimento de risco indisponível:", e instanceof Error ? e.message : e);
    return null;
  }
}
