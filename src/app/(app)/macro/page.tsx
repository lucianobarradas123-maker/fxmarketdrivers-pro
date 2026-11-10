import type { Metadata } from "next";
import { Suspense } from "react";
import { CurrencyCard } from "@/components/macro/CurrencyCard";
import { RiskPanel } from "@/components/macro/RiskPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { getMacro, MACRO_META } from "@/lib/macro/build";
import { getReadings } from "@/lib/macro/readings";
import { getRiskSentimentSafe } from "@/lib/sentiment-data";

export const metadata: Metadata = { title: "Macro" };

function fmt(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Lisbon" }).format(new Date(iso));
}

/** Parte que depende do utilizador (as suas leituras dos bancos centrais) — carrega dentro de Suspense. */
async function Currencies() {
  const [risk, readings] = await Promise.all([getRiskSentimentSafe(), getReadings()]);
  const currencies = getMacro(risk, readings);
  return (
    <>
      <RiskPanel risk={risk} />
      <section aria-label="Moedas" className="fade-in grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {currencies.map((c, i) => (
          <CurrencyCard key={c.code} c={c} rank={i + 1} riskLabel={risk?.label ?? null} />
        ))}
      </section>
    </>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader
        title="Macro"
        subtitle={`Força relativa das 8 moedas · dados OCDE recolhidos a ${fmt(MACRO_META.fetchedAt)} · leituras dos bancos centrais editáveis em cada moeda`}
      />
      <Card className="fade-in flex flex-col gap-3">
        <CardHeader id="como" title="Como funciona a pontuação" tag="analise" />
        <p className="text-[13px] text-ink-2">
          <span className="num text-ink">Total = Dados (−2 a +2) + Banco central (−1 a +1) + Sentimento de risco (−0,5 a +0,5)</span>. Os{" "}
          <strong className="text-ink">Dados</strong> comparam cada moeda com as outras sete em três pontos: <strong className="text-ink">juro</strong>{" "}
          (juros mais altos atraem capital), <strong className="text-ink">inflação face à meta</strong> (acima da meta pressiona o banco central a subir
          juros) e <strong className="text-ink">emprego</strong> (desemprego a descer em 6 meses = economia mais forte). O{" "}
          <strong className="text-ink">Banco central</strong> é a tua leitura da direção provável da próxima decisão — podes editá-la em cada moeda. O{" "}
          <strong className="text-ink">Sentimento de risco</strong> dá pontos às moedas-refúgio (JPY, CHF, USD) quando há medo, e às moedas de risco (AUD,
          NZD, CAD) quando há ganância.
        </p>
        <p className="text-xs text-faint">
          É contexto para a tua análise, não um sinal de compra ou venda. No Forex conta a diferença entre as duas moedas de um par.
        </p>
      </Card>
      <Suspense fallback={<Card><p className="text-muted">A carregar…</p></Card>}>
        <Currencies />
      </Suspense>
      <Disclaimer source="Fontes: OCDE (inflação, desemprego) · bancos centrais e imprensa (decisões) · CBOE (VIX) · Twelve Data (SPY, AUD/JPY, ouro)" />
    </>
  );
}
