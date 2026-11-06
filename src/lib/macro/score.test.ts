import { describe, expect, it } from "vitest";
import { alignment, biasFrom, pairDivergence, totalScore, volLevel } from "./score";
import type { CurrencyMacro } from "@/lib/data/types";

const usd: CurrencyMacro = { code: "USD", bank: "Fed", dataScore: 1.2, stance: "Restritivo" };
const jpy: CurrencyMacro = { code: "JPY", bank: "BoJ", dataScore: -0.8, stance: "Expansionista" };

describe("pontuação macro", () => {
  it("soma dados + leitura do banco central", () => {
    expect(totalScore(usd)).toBeCloseTo(2.2);
    expect(totalScore(jpy)).toBeCloseTo(-1.8);
  });
  it("limita a pontuação ao intervalo −3..+3", () => {
    expect(totalScore({ ...usd, dataScore: 2.5 })).toBe(3);
    expect(totalScore({ ...jpy, dataScore: -2.5 })).toBe(-3);
  });
  it("calcula a divergência de um par como base − cotada", () => {
    expect(pairDivergence(usd, jpy)).toBeCloseTo(4.0);
    expect(pairDivergence(jpy, usd)).toBeCloseTo(-4.0);
  });
});

describe("viés e alinhamento", () => {
  it("classifica o viés com um limiar de 1 ponto", () => {
    expect(biasFrom(1.5)).toBe("altista");
    expect(biasFrom(-1)).toBe("baixista");
    expect(biasFrom(0.4)).toBe("neutro");
  });
  it("compara viés macro com tendência técnica", () => {
    expect(alignment("altista", "ascendente")).toBe("Alinhado");
    expect(alignment("baixista", "descendente")).toBe("Alinhado");
    expect(alignment("altista", "descendente")).toBe("Conflito");
    expect(alignment("neutro", "ascendente")).toBe("Neutro");
    expect(alignment("altista", "lateral")).toBe("Neutro");
  });
});

describe("volatilidade", () => {
  it("compara o ATR com a média de 20 dias", () => {
    expect(volLevel(120, 100)).toBe("elevada");
    expect(volLevel(100, 100)).toBe("normal");
    expect(volLevel(80, 100)).toBe("baixa");
  });
});
