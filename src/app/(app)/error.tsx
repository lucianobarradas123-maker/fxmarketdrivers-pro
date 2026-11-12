"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Erro numa página da app: mensagem em português, tentar de novo, e o código para diagnóstico. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-line bg-surface p-6">
      <h1 className="text-xl font-bold">Algo correu mal nesta página</h1>
      <p className="text-[14px] text-ink-2">
        Pode ser uma falha temporária de uma fonte de dados. Tenta de novo; se persistir, envia o código abaixo para diagnóstico.
      </p>
      {digest && <p className="num text-xs text-faint">Código: {digest}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className="min-h-11 cursor-pointer rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90">
          Tentar de novo
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 font-semibold hover:bg-surface-2">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
