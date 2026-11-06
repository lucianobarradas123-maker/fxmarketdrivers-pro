import { describe, expect, it } from "vitest";
import { computeDataScores, monthsBehind, type MacroSnapshotEntry } from "./data-score";
import type { CentralBank } from "@/data/central-banks";
import type { Currency } from "@/lib/data/types";

function bank(code: Currency, rate: number, target = 2): CentralBank {
  return {
    code, bank: code, bankName: code, rate, rateLabel: "", inflationTarget: target, targetLabel: "",
    lastDecision: { date: "", text: "" }, nextMeeting: "", stance: "Neutro", reasoning: "", sources: [],
  };
}
function macro(infl: number, une: number, une6m: number): MacroSnapshotEntry {
  return {
    inflation: { value: infl, period: "2026-09", measure: "IPC", url: "" },
    unemployment: { value: une, period: "2026-09", sixMonthsAgo: une6m, sixMonthsAgoPeriod: "2026-03", url: "" },
  };
}

describe("parte automática (Dados)", () => {
  it("dá pontuação mais alta à moeda com juro, pressão inflacionista e emprego mais fortes", () => {
    const banks = [bank("USD", 4), bank("JPY", 0.5)];
    const snap = { USD: macro(3.5, 4.0, 4.3), JPY: macro(1.0, 2.6, 2.4) };
    const [usd, jpy] = computeDataScores(banks, snap);
    expect(usd.dataScore).toBeGreaterThan(0);
    expect(jpy.dataScore).toBeLessThan(0);
    expect(usd.dataScore).toBeCloseTo(-jpy.dataScore);
  });

  it("limita a parte automática a −2…+2", () => {
    const banks = [bank("USD", 10), bank("EUR", 0), bank("GBP", 0), bank("JPY", 0)];
    const snap = { USD: macro(9, 3, 5), EUR: macro(2, 6, 6), GBP: macro(2, 6, 6), JPY: macro(2, 6, 6) };
    const scores = computeDataScores(banks, snap);
    for (const s of scores) expect(Math.abs(s.dataScore)).toBeLessThanOrEqual(2);
  });

  it("dá zero quando todas as moedas são iguais", () => {
    const banks = [bank("USD", 2), bank("EUR", 2)];
    const snap = { USD: macro(2, 5, 5), EUR: macro(2, 5, 5) };
    for (const s of computeDataScores(banks, snap)) expect(s.dataScore).toBe(0);
  });

  it("falha de forma clara se faltar uma moeda", () => {
    expect(() => computeDataScores([bank("USD", 2)], {})).toThrow(/USD/);
  });
});

describe("idade dos dados", () => {
  it("conta meses de atraso para dados mensais e trimestrais", () => {
    expect(monthsBehind("2026-09", "2026-11-06T00:00:00Z")).toBe(2);
    expect(monthsBehind("2026-Q2", "2026-11-06T00:00:00Z")).toBe(5);
  });
});
