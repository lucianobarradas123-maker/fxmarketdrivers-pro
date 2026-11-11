import { describe, expect, it } from "vitest";
import { atrAverage, atrPips, completedWeekdayBars, marketHoursBars, pipSize, pipValueEur, positionSize, trendOf, type Bar } from "./risk";

describe("pip", () => {
  it("tamanho do pip", () => {
    expect(pipSize("EUR/USD")).toBe(0.0001);
    expect(pipSize("USD/JPY")).toBe(0.01);
    expect(pipSize("GBP/JPY")).toBe(0.01);
  });
});

describe("valor do pip em EUR (conta em EUR)", () => {
  it("par com EUR como moeda cotada: 10 EUR por pip", () => {
    expect(pipValueEur("GBP/EUR" as string, null)).toBe(10);
  });
  it("EUR/USD a 1,12: 10 USD = 8,93 EUR", () => {
    expect(pipValueEur("EUR/USD", 1.12)).toBeCloseTo(8.9286, 3);
  });
  it("USD/JPY com EUR/JPY a 170: 1000 JPY = 5,88 EUR", () => {
    expect(pipValueEur("USD/JPY", 170)).toBeCloseTo(5.882, 3);
  });
  it("falha se faltar a taxa de conversão", () => {
    expect(() => pipValueEur("EUR/USD", null)).toThrow();
  });
});

describe("tamanho de posição", () => {
  it("10 000 € a 1%, stop 25 pips, pip 8,93 € → 0,44 lotes (arredonda para baixo)", () => {
    const r = positionSize({ balance: 10_000, riskPct: 1, stopPips: 25, targetPips: 50, pipValue: 8.9286 });
    expect(r.riskBudget).toBe(100);
    expect(r.lots).toBe(0.44);
    expect(r.riskActual).toBeLessThanOrEqual(100);
    expect(r.riskActual).toBeCloseTo(98.21, 1);
    expect(r.gainTarget).toBeCloseTo(196.43, 1);
    expect(r.rr).toBe(2);
    expect(r.tooSmall).toBe(false);
  });
  it("nunca arrisca mais do que a regra, mesmo com valores exatos", () => {
    const r = positionSize({ balance: 10_000, riskPct: 1, stopPips: 10, targetPips: null, pipValue: 10 });
    expect(r.lots).toBe(1);
    expect(r.riskActual).toBe(100);
    expect(r.rr).toBeNull();
  });
  it("assinala quando o orçamento não chega para 0,01 lotes", () => {
    const r = positionSize({ balance: 100, riskPct: 0.5, stopPips: 80, targetPips: 80, pipValue: 9 });
    expect(r.tooSmall).toBe(true);
    expect(r.lots).toBe(0);
  });
  it("rejeita valores inválidos", () => {
    expect(() => positionSize({ balance: 0, riskPct: 1, stopPips: 10, targetPips: null, pipValue: 10 })).toThrow();
    expect(() => positionSize({ balance: 1000, riskPct: 1, stopPips: 0, targetPips: null, pipValue: 10 })).toThrow();
  });
});

function bars(closes: number[], range = 0.002): Bar[] {
  return closes.map((c, k) => ({ date: `d${k}`, open: c, high: c + range / 2, low: c - range / 2, close: c }));
}

describe("ATR", () => {
  it("barras planas com amplitude de 20 pips → ATR 20", () => {
    const b = bars(Array(40).fill(1.1), 0.002);
    expect(atrPips(b, "EUR/USD")).toBeCloseTo(20, 6);
    expect(atrAverage(b, "EUR/USD")).toBeCloseTo(20, 6);
  });
  it("conta os saltos de abertura (true range)", () => {
    const b: Bar[] = [
      { date: "1", open: 1.1, high: 1.1, low: 1.1, close: 1.1 },
      { date: "2", open: 1.105, high: 1.106, low: 1.104, close: 1.105 }, // TR = 1.106-1.1 = 60 pips
    ];
    expect(atrPips(b, "EUR/USD", 1)).toBeCloseTo(60, 6);
  });
  it("usa pips de JPY nos pares com iene", () => {
    const b = bars(Array(30).fill(150), 1); // amplitude 1 iene = 100 pips
    expect(atrPips(b, "USD/JPY")).toBeCloseTo(100, 6);
  });
  it("falha com barras insuficientes", () => {
    expect(() => atrPips(bars([1, 2, 3]), "EUR/USD")).toThrow();
    expect(() => atrAverage(bars(Array(30).fill(1.1)), "EUR/USD")).toThrow(/34/);
  });
});

describe("tendência", () => {
  const up = Array.from({ length: 60 }, (_, k) => 1 + k * 0.001);
  it("subida consistente → ascendente", () => expect(trendOf(bars(up))).toBe("ascendente"));
  it("descida consistente → descendente", () => expect(trendOf(bars([...up].reverse()))).toBe("descendente"));
  it("sem direção → lateral", () => expect(trendOf(bars(Array(60).fill(1.1)))).toBe("lateral"));
});

describe("barras completas de dias úteis", () => {
  const mk = (date: string): Bar => ({ date, open: 1, high: 1, low: 1, close: 1 });
  it("remove fins de semana e o dia em curso", () => {
    // 2026-11-05 quinta, 06 sexta, 07 sábado, 08 domingo, 09 segunda (hoje)
    const out = completedWeekdayBars(["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"].map(mk), "2026-11-09");
    expect(out.map((b) => b.date)).toEqual(["2026-11-05", "2026-11-06"]);
  });
});

describe("velas com o mercado aberto", () => {
  const mk = (date: string): Bar => ({ date, open: 1, high: 1, low: 1, close: 1 });
  it("remove de sexta 22h a domingo 21h (UTC)", () => {
    const dates = ["2026-11-06 20:00:00", "2026-11-06 22:00:00", "2026-11-07 12:00:00", "2026-11-08 20:00:00", "2026-11-08 21:00:00", "2026-11-09 08:00:00"];
    expect(marketHoursBars(dates.map(mk)).map((b) => b.date)).toEqual(["2026-11-06 20:00:00", "2026-11-08 21:00:00", "2026-11-09 08:00:00"]);
  });
});
