import type { Metadata } from "next";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { Suspense } from "react";
import { getSettings } from "@/lib/journal-data";
import { PreTrade } from "./PreTrade";

async function WithSettings() {
  return <PreTrade settings={await getSettings()} />;
}

export const metadata: Metadata = { title: "Pré-operação" };

export default function Page() {
  return (
    <>
      <PageHeader title="Pré-operação" subtitle="Tamanho de posição, risco e verificação do teu plano antes de entrar" />
      <Suspense fallback={<p className="text-muted">A carregar…</p>}>
        <WithSettings />
      </Suspense>
      <Disclaimer source="Preços: Twelve Data (diários, atrasados) · Macro: OCDE + leitura manual · Eventos: o teu calendário" />
    </>
  );
}
