"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";

const input = "num min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none focus:border-up";

export function SettingsForm({ saldo, risco }: { saldo: number | null; risco: number | null }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex w-40 flex-col gap-1.5 text-xs text-muted">
        Saldo da conta (€)
        <input name="saldo" inputMode="decimal" required defaultValue={saldo ?? ""} className={input} />
      </label>
      <label className="flex w-28 flex-col gap-1.5 text-xs text-muted">
        Risco por operação (%)
        <input name="risco_pct" inputMode="decimal" required defaultValue={risco ?? 1} className={input} />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-lg border border-line-strong px-4 font-semibold hover:bg-surface-2 disabled:opacity-60">
        {pending ? "A guardar…" : "Guardar"}
      </button>
      {state?.ok && <span className="text-[13px] text-up-soft">Guardado.</span>}
      {state?.error && <span role="alert" className="text-[13px] text-down-soft">{state.error}</span>}
    </form>
  );
}
