import { describe, expect, it } from "vitest";
import { readRetail, retailText, toPair } from "./retail";

describe("sentimento do retalho", () => {
  it("78% comprados → extremo, contrário = venda", () => {
    const r = readRetail({ longPct: 78, shortPct: 22 });
    expect(r).toEqual({ extreme: true, majority: "compra", pct: 78, contrarian: "venda" });
    expect(retailText(r)).toBe("78% em compra → contrário: venda");
  });
  it("72% vendidos → extremo, contrário = compra", () => {
    expect(readRetail({ longPct: 28, shortPct: 72 })).toMatchObject({ extreme: true, contrarian: "compra" });
  });
  it("exatamente 70% conta como extremo", () => {
    expect(readRetail({ longPct: 70, shortPct: 30 }).extreme).toBe(true);
  });
  it("62% comprados → sem extremo", () => {
    const r = readRetail({ longPct: 62, shortPct: 38 });
    expect(r.extreme).toBe(false);
    expect(retailText(r)).toBe("62% em compra · sem extremo");
  });
  it("50/50 → equilíbrio", () => {
    expect(readRetail({ longPct: 50, shortPct: 50 }).majority).toBe("equilíbrio");
  });
  it("converte símbolos do Myfxbook", () => {
    expect(toPair("EURUSD")).toBe("EUR/USD");
    expect(toPair("eurusd")).toBe("EUR/USD");
    expect(toPair("XAUUSDm")).toBeNull();
  });
});
