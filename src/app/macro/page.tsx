import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Macro" };

export default function Page() {
  return (
    <ComingSoon
      title="Macro"
      stage="Etapa 1"
      items={[
        "Taxa de juro, inflação face à meta e emprego das 8 economias",
        "A tua leitura da postura de cada banco central (restritivo, neutro, expansionista)",
        "Ranking de força das moedas, com a parte automática e a tua leitura separadas",
        "Explicação de cada indicador",
      ]}
    />
  );
}
