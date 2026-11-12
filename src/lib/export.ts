/** Exportação dos dados do utilizador (funções puras, testadas em export.test.ts). */

/** Uma célula CSV para o Excel em português: separador ";", vírgula decimal, aspas quando necessário. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v).replace(".", ",") : "";
  if (typeof v === "boolean") return v ? "sim" : "não";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // Evita que o Excel interprete o texto como fórmula (injeção de fórmulas).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const head = columns.map((c) => csvCell(c.label)).join(";");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(";"));
  return "﻿" + [head, ...body].join("\r\n") + "\r\n"; // BOM: o Excel reconhece UTF-8 (acentos)
}

export const TRADE_COLUMNS = [
  { key: "aberta_em", label: "Aberta em" },
  { key: "fechada_em", label: "Fechada em" },
  { key: "estado", label: "Estado" },
  { key: "par", label: "Par" },
  { key: "direcao", label: "Direção" },
  { key: "estrategia", label: "Estratégia" },
  { key: "emocao", label: "Emoção" },
  { key: "preco_entrada", label: "Entrada" },
  { key: "preco_saida", label: "Saída" },
  { key: "stop_pips", label: "Stop (pips)" },
  { key: "alvo_pips", label: "Alvo (pips)" },
  { key: "lotes", label: "Lotes" },
  { key: "risco_eur", label: "Risco (€)" },
  { key: "resultado_pips", label: "Resultado (pips)" },
  { key: "resultado_r", label: "Resultado (R)" },
  { key: "resultado_eur", label: "Resultado (€)" },
  { key: "seguiu_plano", label: "Seguiu o plano" },
  { key: "motivo", label: "Motivo" },
  { key: "licoes", label: "Lições" },
  { key: "contexto", label: "Contexto na entrada" },
  { key: "checklist", label: "Checklist" },
];

/** Precisa de lembrete? Nunca exportou, ou há mais de `days` dias. */
export function needsBackupReminder(lastExport: string | null, hasData: boolean, now: number, days = 30): boolean {
  if (!hasData) return false;
  if (!lastExport) return true;
  return now - new Date(lastExport).getTime() > days * 864e5;
}
