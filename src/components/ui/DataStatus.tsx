import type { DataMeta } from "@/lib/data/types";

const LABEL: Record<DataMeta["kind"], string> = {
  "tempo-real": "Tempo real",
  atrasado: "Preços atrasados",
  "fim-de-dia": "Fim de dia",
  manual: "Inserido manualmente",
  exemplo: "Dados de exemplo",
};

/** Indicador sempre visível da origem e idade dos dados. */
export function DataStatus({ meta }: { meta: DataMeta }) {
  const time = new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(new Date(meta.fetchedAt));
  const live = meta.kind === "tempo-real";
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted"
      title={`Fonte: ${meta.source}`}
    >
      <span className={`size-[7px] rounded-full ${live ? "bg-up" : "bg-down"}`} aria-hidden="true" />
      <span>
        {LABEL[meta.kind]}
        {meta.delayMinutes ? ` ~${meta.delayMinutes} min` : ""}
      </span>
      <span className="text-faint" aria-hidden="true">·</span>
      <span className="num">Atualizado {time}</span>
    </div>
  );
}
