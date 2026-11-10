import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { STANCE_STYLE } from "@/components/dashboard/CurrencyStrength";
import { Card, CardHeader } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { CENTRAL_BANKS } from "@/data/central-banks";
import { STANCE_LABEL } from "@/lib/macro/score";
import type { StoredAnalysis } from "@/lib/speech/schema";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatTime } from "@/lib/time";
import { AnalysisForm } from "./AnalysisForm";
import { ApplySuggestion } from "./ApplySuggestion";
import type { BankStance, Currency } from "@/lib/data/types";

export const metadata: Metadata = { title: "Evento" };
// A análise pode demorar até ~1 minuto.
export const maxDuration = 120;

function AnalysisView({ a, when, model, code, current }: { a: StoredAnalysis; when: string; model: string | null; code: Currency; current: BankStance }) {
  const usd = (a.custo_tokens.entrada * 4 + a.custo_tokens.saida * 20) / 1_000_000;
  return (
    <Card className="fade-in flex flex-col gap-5">
      <CardHeader id="analise" title="Análise" tag="analise" aside={`IA · ${model ?? ""}${a.via_reserva ? " (modelo de reserva)" : ""}`} />
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded border px-2.5 py-1 text-sm font-semibold ${STANCE_STYLE[a.tom]}`}>{STANCE_LABEL[a.tom]}</span>
        <span className="text-[13px] text-muted">confiança {a.confianca}</span>
        {a.orador && <span className="text-[13px] text-ink-2">· {a.orador}</span>}
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold text-ink-2">Resumo</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px]">
          {a.resumo.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold text-ink-2">Frases-chave</h3>
        <ul className="flex flex-col gap-3">
          {a.citacoes.map((c, i) => {
            const v = a.citacoes_verificadas[i];
            return (
              <li key={c.texto} className="flex flex-col gap-1 rounded-lg bg-inset p-3">
                <blockquote className="text-[14px] text-ink italic">“{c.texto}”</blockquote>
                <p className="text-[13px] text-ink-2">{c.porque}</p>
                <span className={`text-[11px] font-semibold ${v === true ? "text-up-soft" : v === false ? "text-down-soft" : "text-faint"}`}>
                  {v === true ? "✓ Encontrada no texto" : v === false ? "! Não encontrada literalmente no texto — confirma" : "Não verificável (PDF)"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[13px] font-semibold text-ink-2">O que mudou</h3>
          <p className="text-[14px]">{a.mudancas}</p>
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[13px] font-semibold text-ink-2">Direção futura</h3>
          <p className="text-[14px]">{a.direcao_futura}</p>
        </section>
      </div>

      {a.dados_a_vigiar.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-ink-2">Dados a vigiar</h3>
          <ul className="flex flex-col gap-1.5">
            {a.dados_a_vigiar.map((d) => (
              <li key={d.indicador} className="text-[14px]">
                <span className="font-semibold">{d.indicador}</span> <span className="text-ink-2">— {d.porque}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.sugestao_leitura && (
        <section className="flex flex-col gap-1.5 rounded-lg border border-up-line bg-up/5 p-4">
          <h3 className="text-[13px] font-semibold text-up-soft">Sugestão para a tua leitura do banco central</h3>
          <p className="text-[14px]">
            Passar para <strong>{STANCE_LABEL[a.sugestao_leitura.postura]}</strong>: {a.sugestao_leitura.justificacao}
          </p>
          <ApplySuggestion
            code={code}
            stance={a.sugestao_leitura.postura}
            current={current}
            reasoning={`Sugestão IA (${when.split(" ").slice(0, -1).join(" ")}): ${a.sugestao_leitura.justificacao}`}
          />
        </section>
      )}

      <p className="text-xs text-faint">
        Interpretação automática, pode conter erros: confirma as frases-chave. Analisado a {when} · {a.custo_tokens.entrada.toLocaleString("pt-PT")} +{" "}
        {a.custo_tokens.saida.toLocaleString("pt-PT")} tokens ≈ {usd.toFixed(2)} $
      </p>
    </Card>
  );
}

async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("eventos")
    .select("id, data_hora, moeda, nome, impacto, previsao, anterior, atual, texto, fonte_url, analise, analisado_em, analise_modelo")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  const bank = CENTRAL_BANKS.find((b) => b.code === e.moeda);
  const { data: own } = await supabase.from("leituras_bancos").select("postura").eq("moeda", e.moeda).maybeSingle();
  const currentStance = ((own?.postura as BankStance | undefined) ?? bank?.stance ?? "Neutro") as BankStance;
  const analysis = e.analise as StoredAnalysis | null;
  const when = e.analisado_em ? `${formatDay(e.analisado_em)} ${formatTime(e.analisado_em)}` : "";

  return (
    <>
      <PageHeader
        title={`${e.moeda} · ${e.nome}`}
        subtitle={`${formatDay(e.data_hora)} · ${formatTime(e.data_hora)} Lisboa · impacto ${e.impacto}${bank ? ` · leitura atual do ${bank.bank}: ${STANCE_LABEL[currentStance]}` : ""}`}
        aside={
          <Link href="/calendario" className="text-[13px] text-up-soft hover:text-ink">
            ← Calendário
          </Link>
        }
      />
      <Card className="flex flex-col gap-4">
        <CardHeader
          id="fonte"
          title="Texto do discurso ou comunicado"
          tag="informacao"
          help="Cola o texto ou indica o link da página oficial (Fed, BCE, BoE…). Os bancos centrais publicam as transcrições dos discursos e os comunicados nos seus sites. Funciona com páginas de texto e PDF."
        />
        <AnalysisForm id={e.id} texto={e.texto} url={e.fonte_url} hasAnalysis={!!analysis} />
      </Card>
      {analysis && <AnalysisView a={analysis} when={when} model={e.analise_modelo} code={e.moeda as Currency} current={currentStance} />}
      <Disclaimer source="Análise: Claude (Anthropic) a partir do texto fornecido · não constitui recomendação" />
    </>
  );
}

export default function EventPage({ params }: PageProps<"/calendario/[id]">) {
  return (
    <Suspense fallback={<Card><p className="text-muted">A carregar…</p></Card>}>
      <EventDetail params={params} />
    </Suspense>
  );
}
