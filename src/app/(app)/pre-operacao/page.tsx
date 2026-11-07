import type { Metadata } from "next";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { PreTrade } from "./PreTrade";

export const metadata: Metadata = { title: "Pré-operação" };

export default function Page() {
  return (
    <>
      <PageHeader title="Pré-operação" subtitle="Tamanho de posição, risco e verificação do teu plano antes de entrar" />
      <PreTrade />
      <Disclaimer source="Preços: Twelve Data (diários, atrasados) · Macro: OCDE + leitura manual · Eventos: o teu calendário" />
    </>
  );
}
