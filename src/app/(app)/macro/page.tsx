import type { Metadata } from "next";
import { CurrencyCard } from "@/components/macro/CurrencyCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { BANKS_REVIEWED_AT, getMacro, MACRO_META } from "@/lib/macro/build";
import { RiskPanel } from "@/components/macro/RiskPanel";
import { getRiskSentimentSafe } from "@/lib/sentiment-data";

export const metadata: Metadata = { title: "Macro" };

function fmt(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Lisbon" }).format(new Date(iso));
}

export default async function Page() {
  const risk = await getRiskSentimentSafe();
  const currencies = getMacro(risk);
  return (
    <>
      <PageHeader
        title="Macro"
        subtitle={`Força relativa das 8 moedas · dados OCDE recolhidos a ${fmt(MACRO_META.fetchedAt)} · leitura dos bancos centrais revista a ${fmt(BANKS_REVIEWED_AT)}`}
      />
      <Card className="fade-in flex flex-col gap-3">
        <CardHeader id="como" title="Como funciona a pontuação" tag="analise" />
        <p className="text-[13px] text-ink-2">
          <span className="num text-ink">Total = Dados (−2 a +2) + Banco central (−1 a +1) + Sentimento de risco (−0,5 a +0,5)</span>. Os <strong className="text-ink">Dados</strong> comparam
          cada moeda com as outras sete em três pontos: <strong className="text-ink">juro</strong> (juros mais altos atraem capital),{" "}
          <strong className="text-ink">inflação face à meta</strong> (acima da meta pressiona o banco central a subir juros) e{" "}
          <strong className="text-ink">emprego</strong> (desemprego a descer em 6 meses = economia mais forte). O{" "}
          <strong className="text-ink">Banco central</strong> é a tua leitura da direção provável da próxima decisão. O{" "}
          <strong className="text-ink">Sentimento de risco</strong> dá pontos às moedas-refúgio (JPY, CHF, USD) quando há medo, e às moedas de risco (AUD, NZD, CAD) quando há ganância.
        </p>
        <p className="text-xs text-faint">
          É contexto para a tua análise, não um sinal de compra ou venda. No Forex conta a diferença entre as duas moedas de um par.
        </p>
      </Card>
      <RiskPanel risk={risk} />
      <section aria-label="Moedas" className="fade-in grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {currencies.map((c, i) => (
          <CurrencyCard key={c.code} c={c} rank={i + 1} riskLabel={risk?.label ?? null} />
        ))}
      </section>
      <Disclaimer source="Fontes: OCDE (inflação, desemprego) · bancos centrais e imprensa (decisões) · CBOE (VIX) · Twelve Data (SPY, AUD/JPY, ouro)" />
    </>
  );
}
