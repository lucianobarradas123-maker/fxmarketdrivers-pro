import { InfoButton } from "./InfoButton";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

/** Separa visualmente factos (Informação) de interpretação (Análise). */
export function Tag({ kind }: { kind: "informacao" | "analise" }) {
  return kind === "analise" ? (
    <span className="rounded border border-up-line px-1.5 text-[11px] font-semibold tracking-wider text-up-soft">ANÁLISE</span>
  ) : (
    <span className="rounded border border-line-strong px-1.5 text-[11px] font-semibold tracking-wider text-ink-2">INFORMAÇÃO</span>
  );
}

export function CardHeader({
  id,
  title,
  tag,
  help,
  aside,
}: {
  id: string;
  title: string;
  tag?: "informacao" | "analise";
  help?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      {tag && <Tag kind={tag} />}
      {help && <InfoButton title={title} text={help} />}
      {aside && (
        <>
          <div className="flex-1" />
          <span className="text-xs text-muted">{aside}</span>
        </>
      )}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs tracking-wider text-muted uppercase">{children}</span>;
}
