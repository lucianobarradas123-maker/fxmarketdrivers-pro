/**
 * Testa as regras de segurança (RLS) da base de dados com utilizadores fictícios.
 * Tudo é anulado no fim (nada fica gravado). Uso: npm run db:test
 */
import { readFileSync } from "node:fs";

process.removeAllListeners("warning");
const PROJECT = process.env.SUPABASE_PROJECT_REF ?? "kbfncjkxhhfsueuzbgrp";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN ?? "proxy-injected";

const EXPECTED = [
  "A vê os seus=1",
  "B vê de A=0",
  "B altera de A=0",
  "B apaga de A=0",
  "B cria em nome de A=recusado",
  "B vê leituras de A=0",
  "B altera leituras de A=0",
  "postura inválida=recusada",
  "B vê operações de A=0",
  "B altera operações de A=0",
  "B vê definições de A=0",
  "fechada sem saída=recusada",
  "B grava na pasta de A=recusado",
  "A vê capturas de B=0",
  "anónimo=recusado",
  "A 2FA sem código vê=0",
  "A 2FA com código vê=1",
  "moeda inválida=recusada",
];

const query = readFileSync(new URL("../supabase/tests/seguranca-rls.sql", import.meta.url), "utf8");
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({ query }),
});
const body = await res.text();
const match = body.match(/RESULTADO: ([^\\]+)/);
if (!match) {
  console.error("Resposta inesperada:", body);
  process.exit(1);
}
const got = match[1].split(" | ").map((s) => s.trim());
let failed = 0;
for (const e of EXPECTED) {
  const ok = got.includes(e);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${e}`);
}
if (failed) {
  console.error(`${failed} verificação(ões) de segurança falharam. Obtido: ${got.join(" | ")}`);
  process.exit(1);
}
console.log("Todas as regras de segurança estão corretas.");
