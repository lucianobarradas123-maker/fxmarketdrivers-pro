import { Tag } from "@/components/ui/Card";
import { STANCE_STYLE } from "@/components/dashboard/CurrencyStrength";
import { decimal, signed } from "@/lib/format";
import type { getMacro } from "@/lib/macro/build";
import { STANCE_LABEL, STANCE_POINTS } from "@/lib/macro/score";
import { RISK_BETA } from "@/lib/sentiment";
import { ReadingEditor } from "./ReadingEditor";

type C = ReturnType<typeof getMacro>[number];

function date(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(iso))
    .replace(".", "");
}

function period(p: string) {
  if (p.includes("Q")) {
    const [y, q] = p.split("-");
    return `${q.slice(1)}.º trim. ${y}`;
  }
  const [y, m] = p.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-PT", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, 1)))
    .replace(".", "");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line-soft py-1.5 first:border-t-0">
      <dt className="flex-none text-xs text-muted">{label}</dt>
      <dd className="text-right text-[13px]">{children}</dd>
    </div>
  );
}

function ZBar({ z }: { z: number }) {
  const pct = (Math.min(2, Math.abs(z)) / 2) * 100;
  return (
    <div className="grid h-2 w-24 flex-none grid-cols-2" aria-hidden="true">
      <div className="flex justify-end border-r border-[#3a4654]">
        {z < 0 && <div className="h-2 rounded-l-sm bg-down" style={{ width: `${pct}%` }} />}
      </div>
      <div className="flex">{z > 0 && <div className="h-2 rounded-r-sm bg-up" style={{ width: `${pct}%` }} />}</div>
    </div>
  );
}

const Stale = () => (
  <span
    className="ml-1.5 rounded border border-down-line px-1 text-[10px] font-semibold text-down-soft"
    title="Último dado publicado tem mais de 4 meses"
  >
    ANTIGO
  </span>
);

function riskRole(beta: number) {
  if (beta >= 1) return "moeda de risco";
  if (beta > 0) return "ligeiramente sensível ao risco";
  if (beta === 0) return "neutra ao sentimento";
  if (beta > -1) return "refúgio parcial";
  return "moeda-refúgio";
}

export function CurrencyCard({ c, rank, riskLabel }: { c: C; rank: number; riskLabel: string | null }) {
  const unDelta = Math.round((c.macro.unemployment.value - c.macro.unemployment.sixMonthsAgo) * 10) / 10;
  return (
    <article aria-labelledby={`cur-${c.code}`} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <header className="flex items-start gap-3">
        <span className="num pt-1 text-xs text-faint">#{rank}</span>
        <div className="flex min-w-0 flex-auto flex-col">
          <h2 id={`cur-${c.code}`} className="num text-xl font-semibold">
            {c.code}
          </h2>
          <span className="text-xs text-muted">{c.bankName}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`num text-2xl font-semibold ${c.total >= 0 ? "text-up" : "text-down"}`}>{signed(c.total)}</span>
          <span className="text-[11px] text-faint">pontuação total</span>
        </div>
      </header>

      <section className="flex flex-col gap-1">
        <span className="self-start">
          <Tag kind="informacao" />
        </span>
        <dl className="mt-1">
          <Row label="Taxa de juro">
            <span className="num">{c.rateLabel}</span>
          </Row>
          <Row label={`Inflação (${c.macro.inflation.measure})`}>
            <span className="num">{decimal(c.macro.inflation.value, 1)}%</span>
            <span className="text-muted">
              {" "}
              · meta {c.targetLabel} · {period(c.macro.inflation.period)}
            </span>
            {c.stale.inflation && <Stale />}
          </Row>
          <Row label="Desemprego">
            <span className="num">{decimal(c.macro.unemployment.value, 1)}%</span>
            <span className={unDelta > 0 ? "text-down-soft" : unDelta < 0 ? "text-up-soft" : "text-muted"}>
              {" "}
              ({signed(unDelta)} p.p. em 6 meses)
            </span>
            <span className="text-muted"> · {period(c.macro.unemployment.period)}</span>
            {c.stale.unemployment && <Stale />}
          </Row>
          <Row label="Última decisão">
            <span className="text-muted">{date(c.lastDecision.date)} · </span>
            {c.lastDecision.text}
          </Row>
          <Row label="Próxima reunião">
            <span className="num">{date(c.nextMeeting)}</span>
          </Row>
        </dl>
      </section>

      <section className="flex flex-col gap-2.5">
        <span className="self-start">
          <Tag kind="analise" />
        </span>
        <div className="flex flex-col gap-1.5 rounded-lg bg-inset p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-ink-2">Dados (automático)</span>
            <span className={`num font-semibold ${c.dataScore >= 0 ? "text-up" : "text-down"}`}>{signed(c.dataScore)}</span>
          </div>
          <ul className="flex flex-col gap-1">
            {c.components.map((k) => (
              <li key={k.key} className="flex items-center gap-3 text-xs text-muted">
                <span className="flex-auto">{k.label}</span>
                <ZBar z={k.z} />
                <span className="num w-10 text-right">{signed(k.z)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg bg-inset p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink-2">Banco central (a tua leitura)</span>
            <span className="num font-semibold text-ink-2">{signed(STANCE_POINTS[c.stance])}</span>
          </div>
          <span className={`self-start rounded border px-2 py-px text-xs ${STANCE_STYLE[c.stance]}`}>{STANCE_LABEL[c.stance]}</span>
          <p className="text-[13px] text-ink-2">{c.reasoning}</p>
          <p className="text-[11px] text-faint">
            Revista a {date(c.reviewedAt)} · {c.editedInApp ? "editada por ti na app" : "leitura inicial"}
          </p>
          <ReadingEditor code={c.code} bank={c.bank} stance={c.stance} reasoning={c.reasoning} />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-inset p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink-2">Sentimento de risco (automático)</span>
            <span className={`num font-semibold ${c.riskScore > 0 ? "text-up" : c.riskScore < 0 ? "text-down" : "text-ink-2"}`}>{signed(c.riskScore)}</span>
          </div>
          <p className="text-xs text-muted">
            {riskLabel ? `${riskLabel} no mercado · ` : "Indisponível · "}
            {c.code} é {riskRole(RISK_BETA[c.code])}
          </p>
        </div>
      </section>

      <footer className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-line-soft pt-3 text-xs text-faint">
        <span>Fontes:</span>
        <a href={c.macro.inflation.url} target="_blank" rel="noreferrer" className="text-up-soft hover:text-ink">
          OCDE (inflação)
        </a>
        <a href={c.macro.unemployment.url} target="_blank" rel="noreferrer" className="text-up-soft hover:text-ink">
          OCDE (desemprego)
        </a>
        {c.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-up-soft hover:text-ink">
            {s.label}
          </a>
        ))}
      </footer>
    </article>
  );
}
