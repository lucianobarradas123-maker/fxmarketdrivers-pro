import { describe, expect, it } from "vitest";
import { computeResult, DIMENSIONS, groupBy, summarize, type ClosedTrade } from "./journal";

describe("resultado de uma operação", () => {
  it("venda EUR/USD 1,1200 → 1,1150 com stop 30 pips: +50 pips, +1,67R", () => {
    const r = computeResult({ pair: "EUR/USD", side: "venda", entry: 1.12, exit: 1.115, stopPips: 30, lots: 0.33, pipValue: 8.9 });
    expect(r.pips).toBe(50);
    expect(r.r).toBe(1.67);
    expect(r.eur).toBeCloseTo(146.85, 2);
  });
  it("compra USD/JPY que bate no stop: −1R", () => {
    const r = computeResult({ pair: "USD/JPY", side: "compra", entry: 152.3, exit: 151.9, stopPips: 40, lots: 0.5, pipValue: 5.66 });
    expect(r.pips).toBe(-40);
    expect(r.r).toBe(-1);
    expect(r.eur).toBeCloseTo(-113.2, 2);
  });
});

const t = (r: number, extra: Partial<ClosedTrade> = {}): ClosedTrade => ({
  par: "EUR/USD",
  direcao: "venda",
  estrategia: "SMC",
  emocao: "calmo",
  resultado_r: r,
  resultado_eur: r * 100,
  seguiu_plano: true,
  contexto: { bias: "baixista", alignment: "Alinhado", eventsSoon: 0, risk: { index: 40, label: "Medo" } },
  checklist: [],
  aberta_em: "2026-11-10T10:00:00Z",
  ...extra,
});

describe("estatísticas", () => {
  it("resume taxa de acerto, R médio, fator de lucro e queda máxima", () => {
    const s = summarize([t(2), t(-1), t(-1), t(1.5)]);
    expect(s.count).toBe(4);
    expect(s.winRate).toBe(0.5);
    expect(s.avgR).toBe(0.38);
    expect(s.totalR).toBe(1.5);
    expect(s.profitFactor).toBe(1.75);
    expect(s.maxDrawdownR).toBe(2);
    expect(s.avgWinR).toBe(1.75);
    expect(s.avgLossR).toBe(-1);
  });
  it("lida com zero operações", () => {
    expect(summarize([]).winRate).toBeNull();
  });
  it("agrupa por estratégia", () => {
    const g = groupBy([t(1), t(-1, { estrategia: "Divergência de Forças" }), t(2)], (x) => x.estrategia);
    expect(g[0]).toMatchObject({ key: "SMC", summary: { count: 2, totalR: 3 } });
  });
  it("classifica a favor/contra a macro conforme a direção", () => {
    const dim = DIMENSIONS.find((d) => d.id === "macro")!;
    expect(dim.keyOf(t(1))).toBe("A favor da macro"); // venda com viés baixista
    expect(dim.keyOf(t(1, { direcao: "compra" }))).toBe("Contra a macro");
  });
  it("conta critérios falhados da checklist", () => {
    const dim = DIMENSIONS.find((d) => d.id === "checklist")!;
    expect(dim.keyOf(t(1, { checklist: [{ label: "a", status: "ok" }, { label: "b", status: "falha" }, { label: "c", status: "info" }] }))).toBe("1 critério falhado");
  });
  it("retalho: contra a maioria em extremo", () => {
    const dim = DIMENSIONS.find((d) => d.id === "retalho")!;
    expect(dim.keyOf(t(1, { contexto: { retail: { longPct: 85, shortPct: 15, extreme: true, contrarian: "venda" } } }))).toBe("Contra a maioria");
  });
});
