import type { DataMeta } from "@/lib/data/types";

const LABEL: Record<DataMeta["kind"], string> = {
  "tempo-real": "Tempo real",
  atrasado: "Preços atrasados",
  "fim-de-dia": "Dados oficiais",
  manual: "Inserido manualmente",
  exemplo: "Dados de exemplo",
};

/** Indicador sempre visível da origem e idade dos dados. */
export function DataStatus({ meta, prefix }: { meta: DataMeta; prefix?: string }) {
  const time = new Intl.DateTimeFormat("pt-PT", {
    day: meta.kind === "fim-de-dia" ? "2-digit" : undefined,
    month: meta.kind === "fim-de-dia" ? "2-digit" : undefined,
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
        {prefix ?? LABEL[meta.kind]}
        <span className="hidden sm:inline">
          {prefix ? ` · ${LABEL[meta.kind]}` : ""}
          {meta.delayMinutes ? ` ~${meta.delayMinutes} min` : ""}
        </span>
      </span>
      <span className="text-faint" aria-hidden="true">·</span>
      <span className="num"><span className="hidden sm:inline">Atualizado </span>{time}</span>
    </div>
  );
}
