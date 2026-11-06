"use client";

import { useId, useState } from "react";

/** Botão "o que significa isto?" — camada educativa (D9). */
export function InfoButton({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative">
      <button
        type="button"
        aria-label={`O que significa “${title}”?`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="grid size-6 cursor-pointer place-items-center rounded-full border border-line-strong text-xs font-semibold text-ink-2 transition-colors hover:border-up-line hover:text-ink"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="fade-in absolute top-8 left-0 z-10 block w-72 rounded-lg border border-line-strong bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
