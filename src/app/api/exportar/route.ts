/**
 * Exportação de TODOS os dados do utilizador (cópia de segurança). Exige sessão (RLS limita aos dados do próprio).
 *  ?formato=json → tudo (definições, leituras, eventos com textos e análises, operações)
 *  ?formato=csv  → operações, para o Excel
 * As capturas de ecrã (imagens) não estão incluídas.
 */
import { NextResponse, type NextRequest } from "next/server";
import { TRADE_COLUMNS, toCsv } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

const NUMERIC = ["preco_entrada", "preco_saida", "stop_pips", "alvo_pips", "lotes", "valor_pip_eur", "risco_eur", "saldo_na_entrada", "resultado_pips", "resultado_r", "resultado_eur", "saldo", "risco_pct"];

function numbers<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((r) => {
    const o: Record<string, unknown> = { ...r };
    for (const k of NUMERIC) if (typeof o[k] === "string") o[k] = Number(o[k]);
    return o as T;
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Sessão expirada. Entra novamente." }, { status: 401 });

  const format = request.nextUrl.searchParams.get("formato") === "csv" ? "csv" : "json";
  const [ops, evs, reads, defs] = await Promise.all([
    supabase.from("operacoes").select("*").order("aberta_em"),
    supabase.from("eventos").select("*").order("data_hora"),
    supabase.from("leituras_bancos").select("*").order("moeda"),
    supabase.from("definicoes_conta").select("*"),
  ]);
  const failed = [ops, evs, reads, defs].find((r) => r.error);
  if (failed) return NextResponse.json({ error: "Não foi possível ler os dados para exportar." }, { status: 500 });

  const strip = <T extends Record<string, unknown>>(rows: T[]) => rows.map(({ user_id: _u, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
  const operacoes = numbers(strip(ops.data ?? []));
  const now = new Date().toISOString();
  const stamp = now.slice(0, 10);

  // Regista a data da exportação (para o lembrete mensal), se as definições existirem.
  if ((defs.data ?? []).length) await supabase.from("definicoes_conta").update({ ultima_exportacao: now }).not("saldo", "is", null);

  if (format === "csv") {
    return new NextResponse(toCsv(operacoes, TRADE_COLUMNS), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fxmarketdrivers-operacoes-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
  const body = {
    aplicacao: "FX Market Drivers Pro",
    versao_formato: 1,
    exportado_em: now,
    nota: "Cópia de segurança dos teus dados. As capturas de ecrã (imagens) não estão incluídas.",
    definicoes: numbers(strip(defs.data ?? [])),
    leituras_bancos_centrais: strip(reads.data ?? []),
    eventos: strip(evs.data ?? []),
    operacoes,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="fxmarketdrivers-copia-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
