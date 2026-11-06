import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Diário" };

export default function Page() {
  return (
    <ComingSoon
      title="Diário"
      stage="Etapa 4"
      items={[
        "Registo de uma operação em menos de 1 minuto",
        "Contexto macro e eventos guardados automaticamente no momento da entrada",
        "Motivo, emoção e se seguiste o plano",
        "Estatísticas básicas: taxa de acerto, R médio, resultado por par",
      ]}
    />
  );
}
