"use client";

import { useActionState, useState } from "react";
import { analyzeEvent } from "./actions";

const input =
  "w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none transition-colors focus:border-up";

export function AnalysisForm({ id, texto, url, hasAnalysis }: { id: string; texto: string | null; url: string | null; hasAnalysis: boolean }) {
  const [state, action, pending] = useActionState(analyzeEvent, undefined);
  // Campos controlados: o texto não se perde entre o aviso de custo e a confirmação.
  const [text, setText] = useState(texto ?? "");
  const [link, setLink] = useState(url ?? "");
  const needsConfirm = state?.confirm && !pending;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Link do discurso ou comunicado (opcional)
        <input
          name="url"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.ecb.europa.eu/press/key/…"
          className={`${input} min-h-11`}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Texto (cola aqui; se preencheres, tem prioridade sobre o link)
        <textarea name="texto" value={text} onChange={(e) => setText(e.target.value)} rows={8} className={`${input} py-2 text-[14px] leading-relaxed`} />
        {text.length > 0 && <span className="text-[11px] text-faint">{text.length.toLocaleString("pt-PT")} caracteres</span>}
      </label>

      {needsConfirm && (
        <div role="alert" className="flex flex-col gap-2 rounded-md border border-down-line bg-down/10 px-3 py-3 text-[13px] text-down-soft">
          <span>
            Texto longo ({state.confirm!.chars.toLocaleString("pt-PT")} caracteres): custo estimado ≈ {state.confirm!.usd.toFixed(2)} $. Se for uma página
            inteira, colar só o discurso fica mais barato e mais preciso.
          </span>
          <button
            type="submit"
            name="confirmar"
            value="1"
            className="min-h-10 cursor-pointer self-start rounded-lg border border-down-line px-4 font-semibold text-down-soft hover:bg-down/10"
          >
            Confirmar e analisar
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 cursor-pointer rounded-lg bg-up px-5 font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "A analisar… (até 1 minuto)" : hasAnalysis ? "Analisar de novo" : "Analisar com IA"}
        </button>
        <span className="text-xs text-faint">Custo habitual: 0,05 € a 0,15 € por análise.</span>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {state.error}
        </p>
      )}
    </form>
  );
}
