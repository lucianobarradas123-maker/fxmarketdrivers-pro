import { describe, expect, it } from "vitest";
import { priceStrength, rebase, riskHistory, USD_LEGS, type Point } from "./history";
import { computeRisk } from "./sentiment";

const days = (n: number, start = Date.UTC(2026, 0, 1)) => Array.from({ length: n }, (_, i) => new Date(start + i * 864e5).toISOString().slice(0, 10));

describe("histórico do sentimento", () => {
  const d = days(70);
  const spx: Point[] = d.map((date, i) => ({ date, close: 100 + i }));
  const flat = (v: number): Point[] => d.map((date) => ({ date, close: v }));
  const vix: Point[] = d.map((date) => ({ date, close: 15 }));
  it("começa no 50.º dia e coincide com o cálculo do dia", () => {
    const h = riskHistory({ vix, spx, audjpy: flat(100), gold: flat(100) });
    expect(h[0].date).toBe(d[49]);
    expect(h).toHaveLength(21);
    const last = computeRisk({ vix: 15, spx: spx.slice(-50).map((p) => p.close), audjpy: Array(50).fill(100), gold: Array(50).fill(100), asOf: "" });
    expect(h.at(-1)!.index).toBe(last.index);
  });
  it("não usa dados do futuro: VIX de um dia posterior não entra", () => {
    const lateVix: Point[] = [{ date: d[69], close: 40 }];
    expect(riskHistory({ vix: lateVix, spx, audjpy: flat(100), gold: flat(100) }).map((x) => x.date)).toEqual([d[69]]);
  });
});

describe("força das moedas pelo preço", () => {
  const d = days(3);
  const legs = (eur: number[]): Record<string, Point[]> => {
    const out: Record<string, Point[]> = {};
    for (const l of Object.values(USD_LEGS)) out[l.pair] = d.map((date) => ({ date, close: 1 }));
    out["EUR/USD"] = d.map((date, i) => ({ date, close: eur[i] }));
    return out;
  };
  it("se só o EUR sobe 10%, o EUR fica forte e as outras 7 ligeiramente fracas", () => {
    const s = priceStrength(legs([1, 1.05, 1.1]));
    const last = s.at(-1)!.values;
    // ln(1,1) = 9,53%; média das 8 = 1,19% → EUR +8,34%, restantes −1,19%
    expect(last.EUR).toBeCloseTo(8.34, 1);
    expect(last.USD).toBeCloseTo(-1.19, 1);
    expect(last.JPY).toBeCloseTo(-1.19, 1);
    expect(Object.values(last).reduce((a, b) => a + b, 0)).toBeCloseTo(0, 1); // soma zero
  });
  it("USD/JPY a subir enfraquece o JPY", () => {
    const l = legs([1, 1, 1]);
    l["USD/JPY"] = d.map((date, i) => ({ date, close: [150, 155, 160][i] }));
    expect(priceStrength(l).at(-1)!.values.JPY).toBeLessThan(0);
  });
  it("recomeçar o período põe todas as moedas em 0 no primeiro dia", () => {
    const r = rebase(priceStrength(legs([1, 1.05, 1.1])), d[1]);
    expect(r[0].values.EUR).toBe(0);
    expect(r[1].values.EUR).toBeGreaterThan(0);
  });
  it("só usa dias em que os 7 pares têm preço", () => {
    const l = legs([1, 1.05, 1.1]);
    l["USD/CHF"] = l["USD/CHF"].slice(1);
    expect(priceStrength(l)).toHaveLength(2);
  });
});
