import { Card, CardHeader } from "@/components/ui/Card";
import { decimal, signed } from "@/lib/format";
import type { RiskSentiment } from "@/lib/sentiment";

function ScoreBar({ score }: { score: number }) {
  const pct = Math.abs(score) * 100;
  return (
    <div className="grid h-2 w-28 flex-none grid-cols-2" aria-hidden="true">
      <div className="flex justify-end border-r border-[#3a4654]">{score < 0 && <div className="h-2 rounded-l-sm bg-down" style={{ width: `${pct}%` }} />}</div>
      <div className="flex">{score > 0 && <div className="h-2 rounded-r-sm bg-up" style={{ width: `${pct}%` }} />}</div>
    </div>
  );
}

const HELP =
  "Indicador próprio de apetite pelo risco, de 0 (medo extremo) a 100 (ganância extrema). Junta 4 sinais com o mesmo peso: o VIX (medo nas ações americanas), o S&P 500 e o AUD/JPY face à média de 50 dias (sobem quando há apetite pelo risco) e o ouro face à média de 50 dias (sobe quando se procura refúgio, por isso conta ao contrário).";

export function RiskPanel({ risk }: { risk: RiskSentiment | null }) {
  return (
    <Card className="fade-in flex flex-col gap-3">
      <CardHeader id="risco-mercado" title="Sentimento de risco" tag="analise" help={HELP} aside={risk ? `Dados até ${risk.asOf}` : undefined} />
      {!risk ? (
        <p className="text-[13px] text-muted">Fonte indisponível de momento. A força das moedas está a ser calculada sem este componente.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className={`text-2xl font-semibold ${risk.index < 45 ? "text-down-soft" : risk.index > 55 ? "text-up-soft" : "text-ink"}`}>{risk.label}</span>
            <span className="num text-xs text-muted">Índice {risk.index} / 100</span>
          </div>
          <ul className="flex flex-[1_1_320px] flex-col gap-1.5">
            {risk.components.map((c) => (
              <li key={c.key} className="flex items-center gap-3 text-xs text-muted">
                <span className="flex-auto">
                  {c.label} <span className="num text-ink-2">{c.key === "vix" ? decimal(c.value, 1) : `${signed(c.value, 1)}%`}</span>
                </span>
                <ScoreBar score={c.score} />
                <span className="num w-10 text-right">{signed(c.score)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
