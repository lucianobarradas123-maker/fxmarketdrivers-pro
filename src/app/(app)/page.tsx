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
import { needsBackupReminder } from "@/lib/export";
import { getSettings, getTrades } from "@/lib/journal-data";
import Link from "next/link";
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
  const [settings, { now, trades }] = await Promise.all([getSettings(), getTrades(1)]);
  const remind = needsBackupReminder(settings?.ultima_exportacao ?? null, trades.length > 0, now);
  return (
    <div className="fade-in flex flex-col gap-5">
      {remind && (
        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-down-line px-4 py-2.5 text-[13px] text-down-soft">
          {settings?.ultima_exportacao ? "Já passou mais de um mês desde a última cópia de segurança." : "Ainda não fizeste nenhuma cópia de segurança dos teus dados."}
          <Link href="/conta#copias" className="font-semibold underline-offset-2 hover:underline">
            Exportar agora →
          </Link>
        </p>
      )}
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
