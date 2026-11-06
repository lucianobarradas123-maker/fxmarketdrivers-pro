import type { BankStance, CurrencyMacro, Trend, VolLevel } from "@/lib/data/types";

/** Contributo da leitura do banco central para a pontuação total. */
export const STANCE_POINTS: Record<BankStance, number> = {
  Restritivo: 1,
  "Lig. restritivo": 0.5,
  Neutro: 0,
  "Lig. expansionista": -0.5,
  Expansionista: -1,
};

export const STANCE_LABEL: Record<BankStance, string> = {
  Restritivo: "Restritivo",
  "Lig. restritivo": "Ligeiramente restritivo",
  Neutro: "Neutro",
  "Lig. expansionista": "Ligeiramente expansionista",
  Expansionista: "Expansionista",
};

/** Pontuação total = dados (automático) + banco central (leitura do utilizador). Intervalo −3..+3. */
export function totalScore(c: CurrencyMacro): number {
  return Math.max(-3, Math.min(3, c.dataScore + STANCE_POINTS[c.stance]));
}

export type Bias = "altista" | "baixista" | "neutro";

/** Viés macro de um par BASE/COTADA = força da base − força da cotada. */
export function pairDivergence(base: CurrencyMacro, quote: CurrencyMacro): number {
  return totalScore(base) - totalScore(quote);
}

export function biasFrom(divergence: number, threshold = 1): Bias {
  if (divergence >= threshold) return "altista";
  if (divergence <= -threshold) return "baixista";
  return "neutro";
}

export type Alignment = "Alinhado" | "Conflito" | "Neutro";

/** Compara o viés macro com a tendência técnica. Não é um sinal de entrada. */
export function alignment(bias: Bias, trend: Trend): Alignment {
  if (bias === "neutro" || trend === "lateral") return "Neutro";
  const up = bias === "altista";
  return (up && trend === "ascendente") || (!up && trend === "descendente") ? "Alinhado" : "Conflito";
}

/** Nível de volatilidade: ATR atual face à média de 20 dias. */
export function volLevel(atr: number, avg20: number): VolLevel {
  const r = atr / avg20;
  if (r >= 1.2) return "elevada";
  if (r <= 0.8) return "baixa";
  return "normal";
}
