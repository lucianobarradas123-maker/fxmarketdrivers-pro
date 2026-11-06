"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  inputMode,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric";
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="min-h-11 rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none transition-colors focus:border-up"
      />
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export function AuthForm({
  action,
  submit,
  children,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submit: string;
  /** Recebe o email da tentativa anterior, para não ter de o escrever outra vez. */
  children: (email?: string) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    // key: após cada resposta, o formulário volta a montar com o email preenchido.
    <form key={JSON.stringify(state ?? {})} action={formAction} className="flex flex-col gap-4">
      {children(state?.email)}
      {state?.error && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-md border border-up-line bg-up/10 px-3 py-2 text-[13px] text-up-soft">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 cursor-pointer rounded-lg bg-up font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Aguarda…" : submit}
      </button>
    </form>
  );
}
