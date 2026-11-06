/**
 * Aplica as migrações de supabase/migrations/ ao projeto Supabase, por ordem, uma única vez cada.
 * Usa a API de gestão do Supabase. O token de acesso NUNCA fica no código:
 *  - neste ambiente cloud é injetado pelo proxy de rede;
 *  - noutro computador, define SUPABASE_ACCESS_TOKEN.
 *
 * Uso: npm run db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";

process.removeAllListeners("warning");

const PROJECT = process.env.SUPABASE_PROJECT_REF ?? "kbfncjkxhhfsueuzbgrp";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN ?? "proxy-injected";
const DIR = new URL("../supabase/migrations/", import.meta.url);

async function sql(query: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status}: ${body}`);
  return JSON.parse(body) as Record<string, unknown>[];
}

async function main() {
  await sql(`create schema if not exists app_meta;
    create table if not exists app_meta.migracoes (nome text primary key, aplicada_em timestamptz not null default now());`);
  const done = new Set((await sql("select nome from app_meta.migracoes")).map((r) => r.nome as string));
  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    const body = readFileSync(new URL(f, DIR), "utf8");
    // Cada migração corre numa transação: ou entra toda, ou nada.
    await sql(`begin;\n${body}\ninsert into app_meta.migracoes (nome) values ('${f.replace(/'/g, "''")}');\ncommit;`);
    console.log(`  ✓ ${f}`);
    applied++;
  }
  console.log(applied ? `${applied} migração(ões) aplicada(s).` : "Base de dados já está atualizada.");
}

main().catch((e) => {
  console.error("Falhou a migração:", e.message);
  process.exit(1);
});
