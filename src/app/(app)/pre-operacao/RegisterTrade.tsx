"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { openTrade } from "@/app/(app)/diario/actions";
import { EMOTIONS, STRATEGIES, type ChecklistItem, type EntryContext } from "@/lib/journal";
import { shrinkImage } from "@/lib/image";

const input = "num min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none focus:border-up";

export interface RegisterProps {
  pair: string;
  side: "compra" | "venda";
  stopPips: number;
  targetPips: number | null;
  lots: number;
  pipValue: number;
  balance: number;
  lastPrice: number;
  context: EntryContext;
  checklist: ChecklistItem[];
}

export function RegisterTrade(p: RegisterProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(openTrade, undefined);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-up-line bg-up/10 p-4">
        <span className="font-semibold text-up-soft">Operação registada no diário.</span>
        <span className="text-[13px] text-ink-2">O contexto de entrada (macro, técnica, sentimento, retalho, eventos e checklist) ficou guardado.</span>
        <Link href="/diario" className="text-[13px] text-up-soft hover:text-ink">
          Ver no diário →
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-12 cursor-pointer rounded-lg bg-up font-semibold text-bg transition-opacity hover:opacity-90">
        Registar no diário
      </button>
    );
  }

  // Reduz a captura antes de enviar o formulário.
  async function submit(form: FormData) {
    setImageError(null);
    const file = form.get("captura");
    if (file instanceof File && file.size > 0) {
      try {
        setPreparing(true);
        const small = await shrinkImage(file);
        if (small.size > 3.5 * 1024 * 1024) {
          setImageError("A captura continua demasiado grande depois de reduzida.");
          return;
        }
        form.set("captura", small);
      } catch {
        setImageError("Não foi possível ler a imagem. Usa PNG, JPG ou WEBP.");
        return;
      } finally {
        setPreparing(false);
      }
    }
    action(form);
  }

  return (
    <form action={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <h3 className="text-base font-semibold">Registar no diário</h3>
      <p className="text-[13px] text-muted">
        {p.side === "compra" ? "Compra" : "Venda"} {p.pair} · {p.lots.toFixed(2).replace(".", ",")} lotes · stop {p.stopPips} pips
        {p.targetPips ? ` · alvo ${p.targetPips} pips` : ""}
      </p>
      {[
        ["par", p.pair],
        ["direcao", p.side],
        ["stop_pips", String(p.stopPips)],
        ["alvo_pips", p.targetPips ? String(p.targetPips) : ""],
        ["lotes", String(p.lots)],
        ["valor_pip_eur", String(p.pipValue)],
        ["saldo_na_entrada", String(p.balance)],
        ["contexto", JSON.stringify(p.context)],
        ["checklist", JSON.stringify(p.checklist)],
      ].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1.5 text-xs text-muted">
          Preço de entrada (o do MetaTrader)
          <input name="preco_entrada" inputMode="decimal" required defaultValue={String(p.lastPrice)} className={input} />
          <span className="text-[11px] text-faint">Pré-preenchido com o último fecho diário — corrige para o preço real da tua entrada.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Estratégia
          <select name="estrategia" required defaultValue="" className={input}>
            <option value="" disabled>
              Escolhe…
            </option>
            {STRATEGIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Como te sentes
          <select name="emocao" required defaultValue="" className={input}>
            <option value="" disabled>
              Escolhe…
            </option>
            {EMOTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-xs text-muted">
          Porque entras (opcional)
          <textarea name="motivo" rows={3} maxLength={2000} className={`${input} py-2 text-[14px]`} />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-xs text-muted">
          Captura do gráfico (opcional)
          <input name="captura" type="file" accept="image/png,image/jpeg,image/webp" className="text-[13px] text-ink-2 file:mr-3 file:min-h-10 file:rounded-md file:border file:border-line-strong file:bg-surface-2 file:px-3 file:text-ink" />
        </label>
      </div>
      {(imageError || state?.error) && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {imageError ?? state?.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending || preparing} className="min-h-11 cursor-pointer rounded-lg bg-up px-5 font-semibold text-bg disabled:opacity-60">
          {preparing ? "A preparar a imagem…" : pending ? "A registar…" : "Registar operação"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 cursor-pointer rounded-lg px-4 text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
