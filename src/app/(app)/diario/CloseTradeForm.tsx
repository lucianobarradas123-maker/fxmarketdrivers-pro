"use client";

import { useActionState, useState } from "react";
import { closeTrade } from "./actions";

const input = "num min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none focus:border-up";

export function CloseTradeForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(closeTrade, undefined);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-10 cursor-pointer self-start rounded-lg bg-up px-4 text-[13px] font-semibold text-bg">
        Fechar operação
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg bg-inset p-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Preço de saída
          <input name="preco_saida" inputMode="decimal" required className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Resultado real em € (opcional)
          <input name="resultado_eur" inputMode="decimal" placeholder="o do MT5, com custos" className={input} />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1.5 text-xs text-muted">
        <legend className="mb-1.5">Seguiste o teu plano?</legend>
        <div className="flex gap-4 text-[14px] text-ink">
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="seguiu_plano" value="sim" required className="size-4 accent-[var(--color-up)]" /> Sim
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="seguiu_plano" value="nao" className="size-4 accent-[var(--color-down)]" /> Não
          </label>
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 text-xs text-muted">
        O que aprendeste (opcional)
        <textarea name="licoes" rows={3} maxLength={2000} className={`${input} py-2 text-[14px]`} />
      </label>
      {state?.error && (
        <p role="alert" className="text-[13px] text-down-soft">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-lg bg-up px-5 font-semibold text-bg disabled:opacity-60">
          {pending ? "A fechar…" : "Confirmar fecho"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 cursor-pointer rounded-lg px-4 text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
