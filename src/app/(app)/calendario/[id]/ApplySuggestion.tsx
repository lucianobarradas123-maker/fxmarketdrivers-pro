"use client";

import { useActionState } from "react";
import { saveReading } from "@/app/(app)/macro/actions";
import type { BankStance, Currency } from "@/lib/data/types";
import { STANCE_LABEL } from "@/lib/macro/score";

/** Aplica a sugestão da IA à leitura do banco central — só quando o utilizador carrega no botão. */
export function ApplySuggestion({ code, stance, reasoning, current }: { code: Currency; stance: BankStance; reasoning: string; current: BankStance }) {
  const [state, action, pending] = useActionState(saveReading, undefined);
  if (state?.ok) return <p className="text-[13px] text-up-soft">Leitura atualizada para {STANCE_LABEL[stance]}. A força das moedas já reflete a mudança.</p>;
  if (current === stance) return <p className="text-xs text-faint">A tua leitura atual já é {STANCE_LABEL[stance]}.</p>;
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="moeda" value={code} />
      <input type="hidden" name="postura" value={stance} />
      <input type="hidden" name="justificacao" value={reasoning.slice(0, 500)} />
      <button type="submit" disabled={pending} className="min-h-10 cursor-pointer rounded-lg bg-up px-4 text-[13px] font-semibold text-bg disabled:opacity-60">
        {pending ? "A aplicar…" : `Aplicar: passar para ${STANCE_LABEL[stance]}`}
      </button>
      <span className="text-xs text-faint">Também podes ajustar no ecrã Macro.</span>
      {state?.error && <span role="alert" className="text-xs text-down-soft">{state.error}</span>}
    </form>
  );
}
