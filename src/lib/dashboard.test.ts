import { describe, expect, it } from "vitest";
import { pickFeatured } from "./dashboard";

describe("pares em destaque", () => {
  const ranked = [
    { pair: "USD/CHF", divergence: 4.1 },
    { pair: "GBP/CHF", divergence: 4.0 },
    { pair: "EUR/CHF", divergence: 2.6 },
    { pair: "AUD/CHF", divergence: 2.6 },
    { pair: "NZD/USD", divergence: -2.6 },
    { pair: "GBP/NZD", divergence: 2.5 },
    { pair: "EUR/JPY", divergence: 0.6 },
  ];
  it("ordena por divergência absoluta e limita cada moeda a 2 aparições", () => {
    const out = pickFeatured(ranked, 5, 2).map((r) => r.pair);
    expect(out).toEqual(["USD/CHF", "GBP/CHF", "NZD/USD", "GBP/NZD", "EUR/JPY"]);
  });
  it("nunca devolve mais do que o pedido", () => {
    expect(pickFeatured(ranked, 3, 2)).toHaveLength(3);
  });
});
