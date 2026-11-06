"use client";

import { useActionState, useState, useTransition } from "react";
import { confirmEnroll, startEnroll, type EnrollData } from "./actions";

export function EnrollTotp() {
  const [data, setData] = useState<EnrollData | null>(null);
  const [starting, start] = useTransition();
  const [state, formAction, pending] = useActionState(confirmEnroll, undefined);

  if (state?.ok) {
    return <p className="rounded-md border border-up-line bg-up/10 px-3 py-2 text-[13px] text-up-soft">2FA ativada. A partir de agora, cada entrada pede o código.</p>;
  }

  if (!data || "error" in data) {
    return (
      <div className="flex flex-col gap-3">
        {data && "error" in data && <p role="alert" className="text-[13px] text-down-soft">{data.error}</p>}
        <button
          type="button"
          disabled={starting}
          onClick={() => start(async () => setData(await startEnroll()))}
          className="min-h-11 cursor-pointer self-start rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90 disabled:opacity-60"
        >
          {starting ? "Aguarda…" : "Ativar 2FA"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13px] text-ink-2">
        <li>Abre a tua app de autenticação (Google Authenticator, Authy, 1Password…).</li>
        <li>Adiciona uma conta e lê este código QR.</li>
        <li>Escreve abaixo o código de 6 dígitos que aparece na app.</li>
      </ol>
      <div className="self-start rounded-lg bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado pelo Supabase como data URI */}
        <img src={data.qr} alt="Código QR para configurar a verificação em dois passos" width={180} height={180} />
      </div>
      <details className="text-xs text-muted">
        <summary className="cursor-pointer">Não consigo ler o QR</summary>
        <p className="mt-1">
          Introduz esta chave manualmente na app: <code className="num break-all text-ink">{data.secret}</code>
        </p>
      </details>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="factorId" value={data.factorId} />
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Código de 6 dígitos
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className="num min-h-11 w-40 rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none focus:border-up"
          />
        </label>
        <button type="submit" disabled={pending} className="min-h-11 cursor-pointer rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90 disabled:opacity-60">
          {pending ? "Aguarda…" : "Confirmar"}
        </button>
      </form>
      {state?.error && <p role="alert" className="text-[13px] text-down-soft">{state.error}</p>}
    </div>
  );
}
