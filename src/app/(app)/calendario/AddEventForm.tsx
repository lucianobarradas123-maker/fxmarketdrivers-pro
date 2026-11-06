"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CURRENCIES, EVENT_CATALOG } from "@/data/event-catalog";
import type { Currency, Impact } from "@/lib/data/types";
import { addEvent } from "./actions";

const OTHER = "__outro__";
const input =
  "min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none transition-colors focus:border-up";

export function AddEventForm() {
  const [state, formAction, pending] = useActionState(addEvent, undefined);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [choice, setChoice] = useState(EVENT_CATALOG.USD[0].name);
  const [impact, setImpact] = useState<Impact>(EVENT_CATALOG.USD[0].impact);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  const catalog = EVENT_CATALOG[currency];
  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    setChoice(EVENT_CATALOG[c][0].name);
    setImpact(EVENT_CATALOG[c][0].impact);
  };
  const pickEvent = (name: string) => {
    setChoice(name);
    const found = catalog.find((e) => e.name === name);
    if (found) setImpact(found.impact);
  };

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Data e hora (Lisboa)
        <input name="data_hora" type="datetime-local" required className={`${input} num`} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Moeda
        <select name="moeda" value={currency} onChange={(e) => pickCurrency(e.target.value as Currency)} className={`${input} num`}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="col-span-full flex flex-col gap-1.5 text-xs text-muted sm:col-span-2">
        Evento
        <select value={choice} onChange={(e) => pickEvent(e.target.value)} className={input}>
          {catalog.map((e) => (
            <option key={e.name} value={e.name}>
              {e.name}
            </option>
          ))}
          <option value={OTHER}>Outro…</option>
        </select>
      </label>
      {choice === OTHER ? (
        <label className="col-span-full flex flex-col gap-1.5 text-xs text-muted sm:col-span-2">
          Nome do evento
          <input name="nome" required maxLength={120} className={input} />
        </label>
      ) : (
        <input type="hidden" name="nome" value={choice} />
      )}
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Impacto
        <select name="impacto" value={impact} onChange={(e) => setImpact(e.target.value as Impact)} className={input}>
          <option value="alto">Alto</option>
          <option value="médio">Médio</option>
          <option value="baixo">Baixo</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Previsão (opcional)
        <input name="previsao" maxLength={30} placeholder="ex.: 150K" className={`${input} num`} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Anterior (opcional)
        <input name="anterior" maxLength={30} placeholder="ex.: 142K" className={`${input} num`} />
      </label>
      <div className="col-span-full flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 cursor-pointer rounded-lg bg-up px-5 font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "A guardar…" : "Adicionar evento"}
        </button>
        {state?.error && (
          <p role="alert" className="text-[13px] text-down-soft">
            {state.error}
          </p>
        )}
        {state?.ok && !pending && (
          <p role="status" className="text-[13px] text-up-soft">
            Evento guardado.
          </p>
        )}
      </div>
    </form>
  );
}
