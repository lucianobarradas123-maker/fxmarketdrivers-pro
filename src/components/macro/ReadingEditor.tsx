"use client";

import { useActionState, useState } from "react";
import { saveReading } from "@/app/(app)/macro/actions";
import type { BankStance, Currency } from "@/lib/data/types";
import { STANCE_LABEL } from "@/lib/macro/score";
import { STANCES } from "@/lib/speech/schema";

const input = "w-full rounded-lg border border-line-strong bg-bg px-3 text-[14px] text-ink outline-none focus:border-up";

export function ReadingEditor({ code, bank, stance, reasoning }: { code: Currency; bank: string; stance: BankStance; reasoning: string }) {
  const [state, action, pending] = useActionState(saveReading, undefined);
  // O formulário fecha-se sozinho quando a gravação mais recente é posterior à abertura.
  const [openedAt, setOpenedAt] = useState(0);
  const open = openedAt > (state?.ok ?? 0);

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpenedAt(Date.now())} className="min-h-9 cursor-pointer self-start rounded-md border border-line-strong px-3 text-xs font-semibold text-ink-2 hover:text-ink">
          Editar leitura
        </button>
        {state?.ok && <span className="text-xs text-up-soft">Leitura guardada.</span>}
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="moeda" value={code} />
      <label className="flex flex-col gap-1 text-xs text-muted">
        Postura do {bank}
        <select name="postura" defaultValue={stance} className={`${input} min-h-10`}>
          {STANCES.map((s) => (
            <option key={s} value={s}>
              {STANCE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Justificação
        <textarea name="justificacao" defaultValue={reasoning} rows={3} maxLength={500} required className={`${input} py-2`} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="min-h-9 cursor-pointer rounded-md bg-up px-3 text-xs font-semibold text-bg disabled:opacity-60">
          {pending ? "A guardar…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setOpenedAt(0)} className="min-h-9 cursor-pointer rounded-md px-3 text-xs text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
      {state?.error && <p role="alert" className="text-xs text-down-soft">{state.error}</p>}
    </form>
  );
}
