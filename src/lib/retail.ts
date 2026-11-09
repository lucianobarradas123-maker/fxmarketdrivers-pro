/**
 * Sentimento do retalho (D48) — percentagem de traders de retalho comprados/vendidos por par.
 * Uso: filtro de CONFIRMAÇÃO em extremos (a maioria do retalho tende a perder), não um sinal isolado.
 * Funções puras, testadas em retail.test.ts.
 */
export interface RetailPair {
  pair: string; // "EUR/USD"
  longPct: number;
  shortPct: number;
  positions: number | null;
}

/** A partir de 70% num dos lados consideramos o posicionamento extremo. */
export const RETAIL_EXTREME = 70;

export type RetailRead =
  | { extreme: false; majority: "compra" | "venda" | "equilíbrio"; pct: number }
  | { extreme: true; majority: "compra" | "venda"; pct: number; contrarian: "compra" | "venda" };

export function readRetail(r: Pick<RetailPair, "longPct" | "shortPct">): RetailRead {
  if (r.longPct >= RETAIL_EXTREME) return { extreme: true, majority: "compra", pct: r.longPct, contrarian: "venda" };
  if (r.shortPct >= RETAIL_EXTREME) return { extreme: true, majority: "venda", pct: r.shortPct, contrarian: "compra" };
  if (r.longPct === r.shortPct) return { extreme: false, majority: "equilíbrio", pct: 50 };
  return r.longPct > r.shortPct
    ? { extreme: false, majority: "compra", pct: r.longPct }
    : { extreme: false, majority: "venda", pct: r.shortPct };
}

/** "EURUSD" → "EUR/USD" (só pares de 6 letras). */
export function toPair(symbol: string): string | null {
  const s = symbol.toUpperCase().replace(/[^A-Z]/g, "");
  return s.length === 6 ? `${s.slice(0, 3)}/${s.slice(3)}` : null;
}

/** Texto curto para a interface. */
export function retailText(r: RetailRead): string {
  if (r.extreme) return `${r.pct}% em ${r.majority} → contrário: ${r.contrarian}`;
  if (r.majority === "equilíbrio") return "Retalho equilibrado";
  return `${r.pct}% em ${r.majority} · sem extremo`;
}
