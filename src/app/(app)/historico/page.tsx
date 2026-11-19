import type { Metadata } from "next";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { HistoryView } from "./HistoryView";

export const metadata: Metadata = { title: "Histórico" };

export default function Page() {
  return (
    <>
      <PageHeader title="Histórico" subtitle="Como evoluíram o sentimento de risco e a força das moedas" />
      <HistoryView />
      <Disclaimer source="Sentimento: CBOE + Twelve Data · Força pelo preço: Twelve Data · Força macro: registo diário da app" />
    </>
  );
}
