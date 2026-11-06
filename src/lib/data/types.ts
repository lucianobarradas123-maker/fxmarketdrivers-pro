/**
 * Todos os dados mostrados na app indicam de onde vêm e quando foram obtidos.
 * (Princípio 2 do PLANO.md — transparência dos dados.)
 */
export type DataKind = "tempo-real" | "atrasado" | "fim-de-dia" | "manual" | "exemplo";

export interface DataMeta {
  source: string;
  fetchedAt: string; // ISO 8601
  kind: DataKind;
  delayMinutes?: number;
}

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "NZD";

/**
 * Leitura do utilizador sobre a postura do banco central (parte manual do viés híbrido).
 * Escala de 5 níveis (D24): avalia a DIREÇÃO provável da próxima decisão, não o nível da taxa.
 */
export type BankStance =
  | "Restritivo"
  | "Lig. restritivo"
  | "Neutro"
  | "Lig. expansionista"
  | "Expansionista";

export interface CurrencyMacro {
  code: Currency;
  bank: string;
  dataScore: number; // parte automática, de −2 a +2
  stance: BankStance;
}

export type VolLevel = "baixa" | "normal" | "elevada";
export type Trend = "ascendente" | "descendente" | "lateral";

export interface PairSnapshot {
  pair: string;
  trend: Trend;
  atrPips: number;
  atrAvg20Pips: number;
}

export type Impact = "alto" | "médio" | "baixo";

export interface EconomicEvent {
  time: string; // ISO 8601
  currency: Currency;
  name: string;
  impact: Impact;
}
