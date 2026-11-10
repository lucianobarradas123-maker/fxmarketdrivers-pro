/**
 * Diário de operações — cálculos puros (testados em journal.test.ts).
 * R = resultado em múltiplos do risco inicial: +1R ganhou o que arriscou; −1R perdeu o que arriscou.
 */
import { pipSize } from "@/lib/risk";

export const STRATEGIES = ["SMC", "Divergência de Forças", "Outra"] as const;
export const EMOTIONS = ["calmo", "confiante", "ansioso", "impaciente", "FOMO", "a recuperar perdas"] as const;
/** Abaixo disto, as estatísticas ainda não são fiáveis. */
export const RELIABLE_SAMPLE = 50;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeResult(i: {
  pair: string;
  side: "compra" | "venda";
  entry: number;
  exit: number;
  stopPips: number;
  lots: number;
  pipValue: number;
}): { pips: number; r: number; eur: number } {
  const dir = i.side === "compra" ? 1 : -1;
  const pips = ((i.exit - i.entry) / pipSize(i.pair)) * dir;
  return { pips: r1(pips), r: r2(pips / i.stopPips), eur: r2(pips * i.lots * i.pipValue) };
}

/** Contexto guardado no momento da entrada (vem da pré-operação). */
export interface EntryContext {
  bias?: "altista" | "baixista" | "neutro";
  trend?: "ascendente" | "descendente" | "lateral";
  alignment?: "Alinhado" | "Conflito" | "Neutro";
  divergence?: number;
  atr?: number;
  vol?: "baixa" | "normal" | "elevada";
  risk?: { index: number; label: string } | null;
  retail?: { longPct: number; shortPct: number; extreme: boolean; contrarian?: "compra" | "venda" } | null;
  eventsSoon?: number;
  price?: number;
}

export interface ChecklistItem {
  label: string;
  status: "ok" | "alerta" | "falha" | "pendente" | "info";
}

export interface ClosedTrade {
  par: string;
  direcao: "compra" | "venda";
  estrategia: string;
  emocao: string;
  resultado_r: number;
  resultado_eur: number | null;
  seguiu_plano: boolean;
  contexto: EntryContext;
  checklist: ChecklistItem[];
  aberta_em: string;
}

export interface Summary {
  count: number;
  winRate: number | null; // 0..1
  avgR: number | null; // = expectativa por operação, em R
  totalR: number;
  totalEur: number;
  avgWinR: number | null;
  avgLossR: number | null;
  profitFactor: number | null;
  maxDrawdownR: number;
}

export function summarize(trades: Pick<ClosedTrade, "resultado_r" | "resultado_eur">[]): Summary {
  const n = trades.length;
  const rs = trades.map((t) => Number(t.resultado_r));
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r < 0);
  const totalR = rs.reduce((s, r) => s + r, 0);
  const eurs = trades.map((t) => Number(t.resultado_eur ?? 0));
  const gross = eurs.filter((e) => e > 0).reduce((s, e) => s + e, 0);
  const loss = Math.abs(eurs.filter((e) => e < 0).reduce((s, e) => s + e, 0));
  let peak = 0;
  let cum = 0;
  let dd = 0;
  for (const r of rs) {
    cum += r;
    peak = Math.max(peak, cum);
    dd = Math.max(dd, peak - cum);
  }
  return {
    count: n,
    winRate: n ? wins.length / n : null,
    avgR: n ? r2(totalR / n) : null,
    totalR: r2(totalR),
    totalEur: r2(eurs.reduce((s, e) => s + e, 0)),
    avgWinR: wins.length ? r2(wins.reduce((s, r) => s + r, 0) / wins.length) : null,
    avgLossR: losses.length ? r2(losses.reduce((s, r) => s + r, 0) / losses.length) : null,
    profitFactor: loss > 0 ? r2(gross / loss) : null, // sem perdas ainda → indefinido
    maxDrawdownR: r2(dd),
  };
}

export interface Group {
  key: string;
  summary: Summary;
}

export function groupBy(trades: ClosedTrade[], keyOf: (t: ClosedTrade) => string | null): Group[] {
  const map = new Map<string, ClosedTrade[]>();
  for (const t of trades) {
    const k = keyOf(t);
    if (k === null) continue;
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return [...map.entries()]
    .map(([key, list]) => ({ key, summary: summarize(list) }))
    .sort((a, b) => b.summary.count - a.summary.count);
}

/** As perguntas que o diário responde: cada dimensão agrupa as operações fechadas de uma forma. */
export const DIMENSIONS: { id: string; title: string; question: string; keyOf: (t: ClosedTrade) => string | null }[] = [
  {
    id: "alinhamento",
    title: "Macro vs. técnica",
    question: "Ganhas mais quando a macro e a técnica estão alinhadas?",
    keyOf: (t) => t.contexto.alignment ?? null,
  },
  {
    id: "macro",
    title: "A favor do viés macro",
    question: "A tua hipótese: a macro pesa mais do que a técnica?",
    keyOf: (t) => {
      const b = t.contexto.bias;
      if (!b) return null;
      if (b === "neutro") return "Viés neutro";
      return (b === "altista") === (t.direcao === "compra") ? "A favor da macro" : "Contra a macro";
    },
  },
  {
    id: "checklist",
    title: "Checklist do plano",
    question: "Os critérios do teu plano fazem diferença?",
    keyOf: (t) => {
      const applicable = t.checklist.filter((c) => c.status !== "info" && c.status !== "pendente");
      if (!applicable.length) return null;
      const failed = applicable.filter((c) => c.status === "falha").length;
      return failed === 0 ? "Nenhum critério falhado" : failed === 1 ? "1 critério falhado" : "2 ou mais falhados";
    },
  },
  {
    id: "eventos",
    title: "Perto de notícias",
    question: "Perdes mais quando entras perto de notícias de alto impacto?",
    keyOf: (t) => (t.contexto.eventsSoon === undefined ? null : t.contexto.eventsSoon > 0 ? "Evento em < 2h" : "Sem evento próximo"),
  },
  {
    id: "plano",
    title: "Seguiste o plano",
    question: "Seguir o plano compensa?",
    keyOf: (t) => (t.seguiu_plano ? "Seguiu o plano" : "Não seguiu"),
  },
  { id: "estrategia", title: "Estratégia", question: "Qual estratégia funciona melhor para ti?", keyOf: (t) => t.estrategia },
  { id: "emocao", title: "Emoção na entrada", question: "Como as emoções afetam os resultados?", keyOf: (t) => t.emocao },
  {
    id: "risco",
    title: "Sentimento de risco",
    question: "O ambiente de medo/ganância influencia?",
    keyOf: (t) => {
      const i = t.contexto.risk?.index;
      if (i === undefined) return null;
      return i < 45 ? "Medo" : i > 55 ? "Ganância" : "Neutro";
    },
  },
  {
    id: "retalho",
    title: "Retalho",
    question: "Ir contra a maioria do retalho resulta?",
    keyOf: (t) => {
      const r = t.contexto.retail;
      if (!r) return null;
      if (!r.extreme) return "Sem extremo";
      return r.contrarian === t.direcao ? "Contra a maioria" : "Com a maioria";
    },
  },
  { id: "par", title: "Par", question: "Em que pares tens melhores resultados?", keyOf: (t) => t.par },
];
