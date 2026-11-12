import { describe, expect, it } from "vitest";
import { csvCell, needsBackupReminder, toCsv } from "./export";

describe("CSV para o Excel em português", () => {
  it("números com vírgula decimal, booleanos em português", () => {
    expect(csvCell(1.12345)).toBe("1,12345");
    expect(csvCell(true)).toBe("sim");
    expect(csvCell(null)).toBe("");
  });
  it("põe aspas quando há ; aspas ou quebras de linha", () => {
    expect(csvCell('entrada; "SMC"')).toBe('"entrada; ""SMC"""');
    expect(csvCell("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });
  it("neutraliza fórmulas (injeção no Excel)", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("-1R")).toBe("'-1R");
  });
  it("monta cabeçalho e linhas com BOM", () => {
    const csv = toCsv([{ a: 1.5, b: "x" }], [{ key: "a", label: "A" }, { key: "b", label: "B" }]);
    expect(csv).toBe("﻿A;B\r\n1,5;x\r\n");
  });
});

describe("lembrete de cópia de segurança", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  it("sem dados → sem lembrete", () => expect(needsBackupReminder(null, false, now)).toBe(false));
  it("nunca exportou → lembrete", () => expect(needsBackupReminder(null, true, now)).toBe(true));
  it("há 10 dias → sem lembrete; há 40 → lembrete", () => {
    expect(needsBackupReminder("2026-11-02T12:00:00Z", true, now)).toBe(false);
    expect(needsBackupReminder("2026-10-03T12:00:00Z", true, now)).toBe(true);
  });
});
