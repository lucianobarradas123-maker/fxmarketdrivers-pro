import "server-only";
/**
 * Dados históricos para os gráficos (D72–D74). Nunca lançam erro dentro da cache (D50).
 * Fontes: CBOE (VIX), Twelve Data (SPY, AUD/JPY, ouro, 7 pares contra o USD).
 */
import { cacheLife, cacheTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Currency } from "@/lib/data/types";
import { priceStrength, riskHistory, USD_LEGS, type Point, type RiskDay, type StrengthDay } from "@/lib/history";
import { fetchDailyBatch, fetchDailyBars } from "@/lib/market";

const VIX_URL = "https://cdn-api.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv";

async function vixHistory(): Promise<Point[]> {
  const res = await fetch(VIX_URL);
  if (!res.ok) throw new Error(`CBOE respondeu ${res.status}`);
  return (await res.text())
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, , , , close] = line.split(",");
      const [m, d, y] = date.split("/");
      return { date: `${y}-${m}-${d}`, close: Number(close) };
    })
    .filter((p) => p.close > 0 && p.date >= "2023-01-01");
}

const toPoints = (bars: { date: string; close: number }[]): Point[] => bars.map((b) => ({ date: b.date.slice(0, 10), close: b.close }));

/** Sentimento de risco dia a dia nos últimos ~2 anos. */
export async function getRiskHistory(): Promise<{ days: RiskDay[]; fetchedAt: string } | { error: string }> {
  "use cache";
  cacheTag("historico-sentimento");
  try {
    const [vix, spy, audjpy, gold] = await Promise.all([
      vixHistory(),
      fetchDailyBars("SPY", 1000),
      fetchDailyBars("AUD/JPY", 1000),
      fetchDailyBars("XAU/USD", 1000),
    ]);
    const days = riskHistory({ vix, spx: toPoints(spy.bars), audjpy: toPoints(audjpy.bars), gold: toPoints(gold.bars) });
    const since = new Date(Date.now() - 2 * 365 * 864e5).toISOString().slice(0, 10);
    cacheLife("hours");
    return { days: days.filter((d) => d.date >= since), fetchedAt: new Date().toISOString() };
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

/** Força das moedas pelo preço, diária, nos últimos ~12 meses. */
export async function getPriceStrength(): Promise<{ days: StrengthDay[]; fetchedAt: string } | { error: string }> {
  "use cache";
  cacheTag("historico-forca-preco");
  try {
    const pairs = Object.values(USD_LEGS).map((l) => l.pair);
    const bars = await fetchDailyBatch(pairs, 400, 100);
    if (Object.keys(bars).length < pairs.length) throw new Error("Faltam pares para calcular a força pelo preço");
    const days = priceStrength(Object.fromEntries(Object.entries(bars).map(([k, v]) => [k, toPoints(v)])));
    cacheLife("hours");
    return { days, fetchedAt: new Date().toISOString() };
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

export interface MacroSnapshot {
  code: Currency;
  total: number;
  dataScore: number;
  stancePoints: number;
  riskScore: number;
}

/** Dia de hoje em Lisboa (AAAA-MM-DD). */
function todayLisbon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}

/** Regista (ou atualiza) a força macro de hoje. Chamado depois de enviar a página (after). */
export async function recordStrength(supabase: SupabaseClient, rows: MacroSnapshot[]): Promise<void> {
  const dia = todayLisbon();
  const { error } = await supabase.from("historico_forca").upsert(
    rows.map((r) => ({ dia, moeda: r.code, total: r.total, dados: r.dataScore, banco: r.stancePoints, risco: r.riskScore, atualizado_em: new Date().toISOString() })),
    { onConflict: "user_id,dia,moeda" },
  );
  if (error) console.error("Histórico da força não registado:", error.message);
}

export interface MacroHistoryRow {
  dia: string;
  moeda: Currency;
  total: number;
  dados: number;
  banco: number;
  risco: number;
}

export async function getMacroHistory(supabase: SupabaseClient): Promise<MacroHistoryRow[]> {
  const { data, error } = await supabase.from("historico_forca").select("dia, moeda, total, dados, banco, risco").order("dia").limit(5000);
  if (error) throw new Error("Não foi possível ler o histórico da força macro.");
  return (data ?? []).map((r) => ({ ...r, total: Number(r.total), dados: Number(r.dados), banco: Number(r.banco), risco: Number(r.risco) })) as MacroHistoryRow[];
}
