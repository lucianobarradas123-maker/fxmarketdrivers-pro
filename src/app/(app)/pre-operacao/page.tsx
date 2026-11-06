import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Pré-operação" };

export default function Page() {
  return (
    <ComingSoon
      title="Pré-operação"
      stage="Etapa 3"
      items={[
        "Calculadora de tamanho de posição (saldo, % de risco, stop em pips → lotes)",
        "Rácio risco/retorno",
        "Comparação do stop com a volatilidade (ATR)",
        "Aviso de eventos de alto impacto nas próximas horas",
        "Checklist do teu plano de trading",
      ]}
    />
  );
}
