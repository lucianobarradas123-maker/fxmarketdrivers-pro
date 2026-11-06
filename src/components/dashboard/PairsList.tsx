import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import type { getDashboard } from "@/lib/dashboard";

type Pair = ReturnType<typeof getDashboard>["pairs"][number];

const ALIGN_STYLE = {
  Alinhado: "text-up-soft bg-up/15",
  Conflito: "text-down-soft bg-down/15",
  Neutro: "text-ink-2 bg-ink-2/10",
} as const;

const TREND = { ascendente: "▲ ascendente", descendente: "▼ descendente", lateral: "◆ lateral" } as const;
const VOL_STYLE = { elevada: "text-down-soft", normal: "text-[#c3cbd5]", baixa: "text-muted" } as const;

const HELP =
  "Compara o viés macro (diferença de força entre as duas moedas) com a tendência técnica. “Alinhado” quer dizer que apontam no mesmo sentido; “Conflito”, que se contradizem. É contexto para a tua análise, não um sinal de entrada.";

export function PairsList({ pairs }: { pairs: Pair[] }) {
  return (
    <Card className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
      <CardHeader id="pares-destaque" title="Pares em destaque" tag="analise" help={HELP} />
      <p className="text-xs text-muted">Macro e técnica lado a lado. Não é um sinal de entrada.</p>
      <ul className="flex flex-col gap-3" aria-labelledby="pares-destaque">
        {pairs.map((p) => (
          <li key={p.pair}>
            <Link
              href="/pares"
              className="flex items-center gap-3 rounded-lg border border-line-soft bg-inset px-3 py-2.5 text-ink transition-colors hover:border-line-strong"
            >
              <div className="flex min-w-0 flex-auto flex-col gap-0.5">
                <span className="num text-[15px] font-semibold">{p.pair}</span>
                <span className="text-xs text-muted">
                  Macro <span className={p.bias === "altista" ? "text-up" : p.bias === "baixista" ? "text-down" : ""}>{p.bias}</span> ·
                  Técnica {TREND[p.trend]}
                </span>
                <span className="text-xs text-faint">
                  Volatilidade <span className={VOL_STYLE[p.vol]}>{p.vol}</span> · <span className="num">ATR {p.atrPips} pips</span>
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALIGN_STYLE[p.alignment]}`}>{p.alignment}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
