import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Calendário" };

export default function Page() {
  return (
    <ComingSoon
      title="Calendário"
      stage="Etapa 2"
      items={[
        "Registo rápido dos eventos de alto impacto da semana",
        "Filtro por moeda e por par",
        "Contagem decrescente para o próximo evento importante",
        "Valores anterior, previsão e atual",
      ]}
    />
  );
}
