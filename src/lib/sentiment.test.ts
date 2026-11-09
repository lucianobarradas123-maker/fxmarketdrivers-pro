import { describe, expect, it } from "vitest";
import { computeRisk, riskContribution, riskLabel, vsSma } from "./sentiment";

const flat = (v: number, n = 60) => Array(n).fill(v);
const rising = (end: number, n = 60) => Array.from({ length: n }, (_, k) => 100 + ((end - 100) * k) / (n - 1));

describe("sentimento de risco", () => {
  it("mercado calmo e a subir → ganância", () => {
    const r = computeRisk({ vix: 12, spx: rising(115), audjpy: rising(110), gold: flat(100), asOf: "2026-11-06" });
    expect(r.index).toBeGreaterThan(70);
    expect(r.label).toMatch(/Ganância/);
  });
  it("VIX alto, ações a cair, ouro a subir → medo", () => {
    const falling = rising(85);
    const r = computeRisk({ vix: 32, spx: falling, audjpy: falling, gold: rising(115), asOf: "2026-11-06" });
    expect(r.index).toBeLessThan(25);
    expect(r.label).toBe("Medo extremo");
  });
  it("tudo neutro → 50", () => {
    const r = computeRisk({ vix: 20, spx: flat(100), audjpy: flat(100), gold: flat(100), asOf: "x" });
    expect(r.index).toBe(50);
    expect(r.label).toBe("Neutro");
  });
  it("cada componente fica limitado a −1…+1", () => {
    const r = computeRisk({ vix: 80, spx: rising(300), audjpy: flat(100), gold: flat(100), asOf: "x" });
    for (const c of r.components) expect(Math.abs(c.score)).toBeLessThanOrEqual(1);
  });
  it("exige histórico suficiente para a média de 50 dias", () => {
    expect(() => vsSma([1, 2, 3])).toThrow();
  });
  it("etiquetas por intervalo", () => {
    expect(riskLabel(10)).toBe("Medo extremo");
    expect(riskLabel(40)).toBe("Medo");
    expect(riskLabel(55)).toBe("Neutro");
    expect(riskLabel(70)).toBe("Ganância");
    expect(riskLabel(90)).toBe("Ganância extrema");
  });
});

describe("efeito por moeda", () => {
  it("em medo extremo: refúgios ganham, moedas de risco perdem", () => {
    expect(riskContribution("JPY", 0)).toBe(0.5);
    expect(riskContribution("CHF", 0)).toBe(0.5);
    expect(riskContribution("AUD", 0)).toBe(-0.5);
    expect(riskContribution("EUR", 0)).toBe(0);
  });
  it("em ganância extrema: o inverso", () => {
    expect(riskContribution("AUD", 100)).toBe(0.5);
    expect(riskContribution("JPY", 100)).toBe(-0.5);
  });
  it("sem dados de sentimento → sem efeito", () => {
    expect(riskContribution("AUD", null)).toBe(0);
  });
});
