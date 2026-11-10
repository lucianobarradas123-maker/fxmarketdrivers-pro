import { Suspense } from "react";
import { BottomCards } from "@/components/dashboard/BottomCardsGrid";
import { CurrencyStrength } from "@/components/dashboard/CurrencyStrength";
import { PairsList } from "@/components/dashboard/PairsList";
import { StatCards } from "@/components/dashboard/StatCards";
import { Card } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { Today } from "@/components/ui/Today";
import { getDashboard, macroAndFeatured } from "@/lib/dashboard";
import { getReadings } from "@/lib/macro/readings";
import { dailyBarsBatch } from "@/lib/market";
import { getRetailSentimentSafe } from "@/lib/retail-data";
import { getRiskSentimentSafe } from "@/lib/sentiment-data";

/** Depende das leituras do utilizador → carrega dentro de Suspense. */
async function Dashboard() {
  const [risk, retail, readings] = await Promise.all([getRiskSentimentSafe(), getRetailSentimentSafe(), getReadings()]);
  const { featured } = macroAndFeatured(risk, readings);
  const batch = await dailyBarsBatch(featured.map((f) => f.pair));
  if ("error" in batch) console.error("Preços dos pares em destaque indisponíveis:", batch.error);
  const d = getDashboard(risk, retail, readings, "error" in batch ? null : batch);
  return (
    <div className="fade-in flex flex-col gap-5">
      <StatCards d={d} />
      <div className="flex flex-wrap items-stretch gap-4">
        <CurrencyStrength currencies={d.currencies} />
        <PairsList pairs={d.pairs} />
      </div>
      <BottomCards />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <PageHeader title="Visão geral" subtitle={<Today />} />
      <Suspense fallback={<Card><p className="text-muted">A carregar o painel…</p></Card>}>
        <Dashboard />
      </Suspense>
      <Disclaimer />
    </>
  );
}
