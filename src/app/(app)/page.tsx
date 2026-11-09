import { BottomCards } from "@/components/dashboard/BottomCardsGrid";
import { CurrencyStrength } from "@/components/dashboard/CurrencyStrength";
import { PairsList } from "@/components/dashboard/PairsList";
import { StatCards } from "@/components/dashboard/StatCards";
import { Disclaimer, PageHeader, SampleNotice } from "@/components/ui/PageHeader";
import { getDashboard } from "@/lib/dashboard";
import { getRiskSentimentSafe } from "@/lib/sentiment-data";
import { getRetailSentimentSafe } from "@/lib/retail-data";
import { Today } from "@/components/ui/Today";

export default async function Home() {
  const [risk, retail] = await Promise.all([getRiskSentimentSafe(), getRetailSentimentSafe()]);
  const d = getDashboard(risk, retail);

  return (
    <>
      <PageHeader title="Visão geral" subtitle={<Today />} aside={<SampleNotice />} />
      <div className="fade-in flex flex-col gap-5">
        <StatCards d={d} />
        <div className="flex flex-wrap items-stretch gap-4">
          <CurrencyStrength currencies={d.currencies} />
          <PairsList pairs={d.pairs} />
        </div>
        <BottomCards />
      </div>
      <Disclaimer />
    </>
  );
}
