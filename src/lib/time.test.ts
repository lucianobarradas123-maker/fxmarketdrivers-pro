import { describe, expect, it } from "vitest";
import { dayKey, lisbonToUtc, utcToLisbonInput } from "./time";

describe("hora de Lisboa ↔ UTC", () => {
  it("no inverno Lisboa = UTC", () => {
    expect(lisbonToUtc("2026-11-06T13:30").toISOString()).toBe("2026-11-06T13:30:00.000Z");
  });
  it("no verão Lisboa = UTC+1", () => {
    expect(lisbonToUtc("2026-07-03T13:30").toISOString()).toBe("2026-07-03T12:30:00.000Z");
  });
  it("converte de volta para o formulário", () => {
    expect(utcToLisbonInput(new Date("2026-07-03T12:30:00Z"))).toBe("2026-07-03T13:30");
  });
  it("agrupa por dia de Lisboa", () => {
    expect(dayKey("2026-07-03T23:30:00Z")).toBe("2026-07-04");
  });
  it("rejeita formatos inválidos", () => {
    expect(() => lisbonToUtc("06/11/2026 13:30")).toThrow();
  });
});
