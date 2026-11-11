import { describe, expect, it } from "vitest";
import { atrPrice, ema, supportResistance, swings, trendEma } from "./indicators";
import type { Bar } from "./risk";

const bar = (c: number, range = 0.001, i = 0): Bar => ({ date: String(i), open: c, high: c + range / 2, low: c - range / 2, close: c });
const series = (closes: number[], range = 0.001) => closes.map((c, i) => bar(c, range, i));

describe("EMA", () => {
  it("começa com a média simples e reage mais aos preços recentes", () => {
    const e = ema([1, 2, 3, 4, 5, 6], 3);
    expect(e.slice(0, 2)).toEqual([null, null]);
    expect(e[2]).toBe(2); // (1+2+3)/3
    expect(e[3]).toBe(3); // 4*0,5 + 2*0,5
    expect(e[5]).toBe(5);
  });
});

describe("tendência por EMA 8/21", () => {
  const up = Array.from({ length: 40 }, (_, i) => 1.1 + i * 0.001);
  it("subida → ascendente", () => expect(trendEma(series(up))).toBe("ascendente"));
  it("descida → descendente", () => expect(trendEma(series([...up].reverse()))).toBe("descendente"));
  it("plano → lateral", () => expect(trendEma(series(Array(40).fill(1.1)))).toBe("lateral"));
  it("exige velas suficientes", () => expect(() => trendEma(series([1, 2, 3]))).toThrow());
});

describe("ATR em preço", () => {
  it("velas planas com amplitude 0,002 → 0,002", () => expect(atrPrice(series(Array(20).fill(1.1), 0.002))).toBeCloseTo(0.002, 9));
});

describe("suportes e resistências", () => {
  // Oscila entre 1,10 e 1,12 várias vezes, termina a meio (1,11)
  const zig = [1.11, 1.115, 1.12, 1.115, 1.11, 1.105, 1.1, 1.105, 1.11, 1.115, 1.12, 1.115, 1.11, 1.105, 1.1, 1.105, 1.11];
  const bars = series(zig, 0.0002);
  it("encontra os topos e fundos", () => {
    const s = swings(bars);
    expect(s.highs.length).toBe(2);
    expect(s.lows.length).toBe(2);
  });
  it("agrupa toques próximos num nível: resistência ~1,12 (2 toques) e suporte ~1,10 (2 toques)", () => {
    const lv = supportResistance(bars, 1.11, 0.002);
    const r = lv.find((l) => l.kind === "resistência")!;
    const s = lv.find((l) => l.kind === "suporte")!;
    expect(r.price).toBeCloseTo(1.1201, 3);
    expect(r.touches).toBe(2);
    expect(s.price).toBeCloseTo(1.0999, 3);
    expect(s.touches).toBe(2);
  });
});
