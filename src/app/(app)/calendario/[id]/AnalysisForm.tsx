"use client";

import { useActionState } from "react";
import { analyzeEvent } from "./actions";

const input =
  "w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none transition-colors focus:border-up";

export function AnalysisForm({ id, texto, url, hasAnalysis }: { id: string; texto: string | null; url: string | null; hasAnalysis: boolean }) {
  const [state, action, pending] = useActionState(analyzeEvent, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Link do discurso ou comunicado (opcional)
        <input name="url" type="url" defaultValue={url ?? ""} placeholder="https://www.ecb.europa.eu/press/key/…" className={`${input} min-h-11`} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Texto (cola aqui; se preencheres, tem prioridade sobre o link)
        <textarea name="texto" defaultValue={texto ?? ""} rows={8} className={`${input} py-2 text-[14px] leading-relaxed`} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 cursor-pointer rounded-lg bg-up px-5 font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "A analisar… (até 1 minuto)" : hasAnalysis ? "Analisar de novo" : "Analisar com IA"}
        </button>
        <span className="text-xs text-faint">Custo aproximado: 0,05 € a 0,15 € por análise.</span>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {state.error}
        </p>
      )}
    </form>
  );
}
