"use client";

import { useActionState } from "react";
import { setActual } from "./actions";

/** Campo para registar o valor real depois de o dado sair. */
export function ActualForm({ id, value, label }: { id: string; value: string | null; label: string }) {
  const [state, formAction, pending] = useActionState(setActual, undefined);
  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <input
        name="atual"
        defaultValue={value ?? ""}
        maxLength={30}
        aria-label={`Valor real: ${label}`}
        placeholder="atual"
        className="num h-9 w-20 rounded-md border border-line-strong bg-bg px-2 text-[13px] text-ink outline-none focus:border-up"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Guardar valor real"
        className="grid size-9 cursor-pointer place-items-center rounded-md border border-line-strong text-ink-2 hover:text-ink disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 7.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {state?.error && <span className="text-[11px] text-down-soft">{state.error}</span>}
    </form>
  );
}
