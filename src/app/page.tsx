import { BottomCards } from "@/components/dashboard/BottomCardsGrid";
import { CurrencyStrength } from "@/components/dashboard/CurrencyStrength";
import { PairsList } from "@/components/dashboard/PairsList";
import { StatCards } from "@/components/dashboard/StatCards";
import { Disclaimer, PageHeader, SampleNotice } from "@/components/ui/PageHeader";
import { getDashboard } from "@/lib/dashboard";
import { SAMPLE_NOW } from "@/lib/data/sample";

export default function Home() {
  const d = getDashboard();
  const today = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date(SAMPLE_NOW));

  return (
    <>
      <PageHeader title="Visão geral" subtitle={`${today.charAt(0).toUpperCase()}${today.slice(1)}`} aside={<SampleNotice />} />
      <div className="fade-in flex flex-col gap-5">
        <StatCards d={d} />
        <div className="flex flex-wrap items-stretch gap-4">
          <CurrencyStrength currencies={d.currencies} />
          <PairsList pairs={d.pairs} />
        </div>
        <BottomCards events={d.events} />
      </div>
      <Disclaimer />
    </>
  );
}
