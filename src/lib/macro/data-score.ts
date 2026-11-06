/**
 * Parte AUTOMÁTICA do viés macro ("Dados"), calculada a partir de números oficiais.
 *
 * Três componentes, cada um comparado entre as 8 moedas (pontuação z = quantos desvios-padrão
 * acima ou abaixo da média do grupo). No Forex o que conta é a força RELATIVA, por isso
 * comparar com o grupo é mais útil do que valores absolutos.
 *
 *  1. Juro   — nível da taxa de referência. Juros mais altos atraem capital (carry).
 *  2. Inflação vs. meta — inflação acima da meta pressiona o banco central a subir juros.
 *  3. Emprego — variação do desemprego em ~6 meses. Desemprego a descer = economia mais forte.
 *
 * Dados = média dos três z, multiplicada por 1,5 e limitada a −2…+2.
 */
import type { CentralBank } from "@/data/central-banks";
import type { Currency } from "@/lib/data/types";

export interface MacroSnapshotEntry {
  inflation: { value: number; period: string; measure: string; url: string };
  unemployment: { value: number; period: string; sixMonthsAgo: number; sixMonthsAgoPeriod: string; url: string };
}

export interface Component {
  key: "juro" | "inflacao" | "emprego";
  label: string;
  raw: number;
  z: number;
}

export interface DataScore {
  code: Currency;
  components: Component[];
  dataScore: number;
}

export const DATA_SCALE = 1.5;

function zScores(values: number[]): number[] {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  return values.map((v) => (sd === 0 ? 0 : (v - mean) / sd));
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function computeDataScores(
  banks: CentralBank[],
  snapshot: Partial<Record<Currency, MacroSnapshotEntry>>,
): DataScore[] {
  const rows = banks.map((b) => {
    const m = snapshot[b.code];
    if (!m) throw new Error(`Faltam dados macro para ${b.code}`);
    return {
      code: b.code,
      juro: b.rate,
      inflacao: m.inflation.value - b.inflationTarget,
      emprego: -(m.unemployment.value - m.unemployment.sixMonthsAgo),
    };
  });

  const zJuro = zScores(rows.map((r) => r.juro));
  const zInfl = zScores(rows.map((r) => r.inflacao));
  const zEmp = zScores(rows.map((r) => r.emprego));

  return rows.map((r, i) => {
    const components: Component[] = [
      { key: "juro", label: "Juro", raw: r.juro, z: round(zJuro[i]) },
      { key: "inflacao", label: "Inflação vs. meta", raw: round(r.inflacao), z: round(zInfl[i]) },
      { key: "emprego", label: "Emprego (6 meses)", raw: round(r.emprego), z: round(zEmp[i]) },
    ];
    const mean = (zJuro[i] + zInfl[i] + zEmp[i]) / 3;
    return { code: r.code, components, dataScore: round(Math.max(-2, Math.min(2, mean * DATA_SCALE)), 1) };
  });
}

/** Um dado é considerado desatualizado se o período tiver mais de N meses face à data de referência. */
export function monthsBehind(period: string, referenceIso: string): number {
  const ref = new Date(referenceIso);
  const [y, rest] = period.split("-");
  const month = rest.startsWith("Q") ? Number(rest.slice(1)) * 3 : Number(rest);
  return (ref.getUTCFullYear() - Number(y)) * 12 + (ref.getUTCMonth() + 1 - month);
}
