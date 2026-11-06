import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Pares" };

export default function Page() {
  return (
    <ComingSoon
      title="Pares"
      stage="Etapa 5"
      items={[
        "Gráfico de velas (H1, H4, D1) com médias móveis",
        "Tendência técnica vs. viés macro: alinhado, em conflito ou neutro",
        "Volatilidade (ATR) e nível face à média",
      ]}
    />
  );
}
