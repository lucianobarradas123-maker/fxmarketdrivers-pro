import type { Metadata } from "next";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { PairsView } from "./PairsView";

export const metadata: Metadata = { title: "Pares" };

export default function Page() {
  return (
    <>
      <PageHeader title="Pares" subtitle="H4 para a direção, H1 para a entrada · EMA 8 e 21, ATR, suportes e resistências" />
      <PairsView />
      <Disclaimer source="Preços: Twelve Data (H1/H4 ~15 min, D1 diária) · Gráfico: TradingView Lightweight Charts" />
    </>
  );
}
