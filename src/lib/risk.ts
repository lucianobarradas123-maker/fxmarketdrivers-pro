/**
 * Cálculos de risco para a pré-operação. Conta em EUR (D39).
 * Funções puras (sem rede) — testadas em risk.test.ts.
 */
import type { Currency, Trend } from "@/lib/data/types";

export interface Bar {
  date: string; // AAAA-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Tamanho do pip: 0,01 para pares com JPY como moeda cotada, 0,0001 nos restantes. */
export function pipSize(pair: string): number {
  return pair.endsWith("/JPY") ? 0.01 : 0.0001;
}

export const LOT_UNITS = 100_000;
/** Incremento mínimo de lote no MetaTrader (0,01 lote = micro-lote). */
export const LOT_STEP = 0.01;

/**
 * Valor de 1 pip para 1 lote padrão, em EUR.
 * @param eurQuote taxa EUR/<moeda cotada> (ex.: EUR/USD = 1,12). Ignorada se a moeda cotada for EUR.
 */
export function pipValueEur(pair: string, eurQuote: number | null): number {
  const quote = pair.split("/")[1] as Currency;
  const inQuote = LOT_UNITS * pipSize(pair); // ex.: 10 USD por pip em EUR/USD
  if (quote === "EUR") return inQuote;
  if (!eurQuote || eurQuote <= 0) throw new Error("Falta a taxa de conversão para EUR");
  return inQuote / eurQuote;
}

export interface PositionInput {
  balance: number; // EUR
  riskPct: number; // ex.: 1 = 1%
  stopPips: number;
  targetPips: number | null;
  pipValue: number; // EUR por pip por lote
}

export interface PositionResult {
  riskBudget: number; // EUR que a regra permite arriscar
  lots: number; // arredondado PARA BAIXO ao passo do MetaTrader
  riskActual: number; // EUR em risco com o lote arredondado
  gainTarget: number | null;
  rr: number | null; // risco/retorno (alvo ÷ stop)
  tooSmall: boolean; // o orçamento não chega para o lote mínimo
}

export function positionSize(i: PositionInput): PositionResult {
  if (!(i.balance > 0) || !(i.riskPct > 0) || !(i.stopPips > 0) || !(i.pipValue > 0)) {
    throw new Error("Valores inválidos");
  }
  const riskBudget = (i.balance * i.riskPct) / 100;
  const exact = riskBudget / (i.stopPips * i.pipValue);
  // Arredonda para baixo (nunca arriscar mais do que a regra), com tolerância a erros de vírgula flutuante.
  const lots = Math.floor(exact / LOT_STEP + 1e-9) * LOT_STEP;
  const lotsR = Math.round(lots * 100) / 100;
  const riskActual = lotsR * i.stopPips * i.pipValue;
  const gainTarget = i.targetPips && i.targetPips > 0 ? lotsR * i.targetPips * i.pipValue : null;
  return {
    riskBudget,
    lots: lotsR,
    riskActual,
    gainTarget,
    rr: i.targetPips && i.targetPips > 0 ? i.targetPips / i.stopPips : null,
    tooSmall: lotsR < LOT_STEP,
  };
}

/**
 * Mantém só barras diárias COMPLETAS de dias úteis: remove sábados/domingos (sessões curtas que
 * baixariam o ATR artificialmente) e o dia em curso (ainda incompleto).
 */
export function completedWeekdayBars(bars: Bar[], todayUtc: string): Bar[] {
  return bars.filter((b) => {
    const day = new Date(`${b.date.slice(0, 10)}T12:00:00Z`).getUTCDay();
    return day !== 0 && day !== 6 && b.date.slice(0, 10) < todayUtc;
  });
}

/**
 * Velas intradiárias só com o mercado aberto: remove de sexta 22:00 a domingo 21:00 UTC
 * (o Forex fecha ao fim de semana; os fornecedores devolvem velas planas que distorcem médias e ATR).
 */
export function marketHoursBars(bars: Bar[]): Bar[] {
  return bars.filter((b) => {
    const d = new Date(`${b.date.replace(" ", "T")}Z`);
    const day = d.getUTCDay();
    const h = d.getUTCHours();
    if (day === 6) return false; // sábado
    if (day === 5 && h >= 22) return false; // sexta à noite
    if (day === 0 && h < 21) return false; // domingo antes da abertura
    return true;
  });
}

/** True range de cada barra (a partir da segunda). */
function trueRanges(bars: Bar[]): number[] {
  const out: number[] = [];
  for (let k = 1; k < bars.length; k++) {
    const b = bars[k];
    const prev = bars[k - 1].close;
    out.push(Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev)));
  }
  return out;
}

/**
 * ATR (Average True Range) de N dias, em pips: amplitude média diária, incluindo saltos de abertura.
 * Média simples dos últimos N true ranges. Barras em ordem cronológica (mais antiga primeiro).
 */
export function atrPips(bars: Bar[], pair: string, period = 14): number {
  const tr = trueRanges(bars);
  if (tr.length < period) throw new Error("Barras insuficientes para o ATR");
  const last = tr.slice(-period);
  return last.reduce((s, v) => s + v, 0) / period / pipSize(pair);
}

/** Média do ATR(14) nos últimos 20 dias — referência para dizer se a volatilidade está alta ou baixa. */
export function atrAverage(bars: Bar[], pair: string, period = 14, days = 20): number {
  // Cada um dos 20 ATR precisa de 14 true ranges → pelo menos period + days barras.
  if (bars.length < period + days) throw new Error(`São precisas pelo menos ${period + days} barras diárias`);
  const values: number[] = [];
  for (let end = bars.length - days + 1; end <= bars.length; end++) {
    values.push(atrPips(bars.slice(0, end), pair, period));
  }
  return values.reduce((s, v) => s + v, 0) / values.length;
}

const sma = (xs: number[], n: number) => xs.slice(-n).reduce((s, v) => s + v, 0) / n;

/**
 * Tendência técnica simples (diária): preço acima da média de 20 dias e esta acima da de 50 → ascendente;
 * o inverso → descendente; caso contrário → lateral.
 */
export function trendOf(bars: Bar[]): Trend {
  if (bars.length < 50) throw new Error("Barras insuficientes para a tendência");
  const closes = bars.map((b) => b.close);
  const price = closes[closes.length - 1];
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  if (price > s20 && s20 > s50) return "ascendente";
  if (price < s20 && s20 < s50) return "descendente";
  return "lateral";
}
