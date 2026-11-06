/**
 * Atualiza os dados macro automáticos (inflação e desemprego) das 8 economias
 * a partir da API pública da OCDE (sem chave). Escreve src/data/macro-snapshot.json.
 *
 * Uso:  npm run data:macro
 *
 * Fonte: OECD Data Explorer — https://sdmx.oecd.org
 *  - Inflação: preços no consumidor, variação homóloga (%)
 *  - Desemprego: taxa de desemprego mensal/trimestral, ajustada sazonalmente (%)
 * Frequência: mensal (trimestral para NZ e desemprego na Suíça). Publicação com 1–3 meses de atraso.
 */
import { writeFileSync } from "node:fs";

process.removeAllListeners("warning");

const BASE = "https://sdmx.oecd.org/public/rest/data";
const CPI_2018 = "OECD.SDD.TPS,DSD_PRICES_COICOP2018@DF_PRICES_C2018_ALL,1.0";
const CPI_1999 = "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0";
const UNE = "OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0";

type Code = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "NZD";

/** Para cada moeda: que série da OCDE usar (há países que só existem num dos conjuntos). */
const CONFIG: Record<Code, { area: string; cpi: { flow: string; freq: "M" | "Q"; method: string }; une: "M" | "Q" }> = {
  USD: { area: "USA", cpi: { flow: CPI_1999, freq: "M", method: "N" }, une: "M" },
  EUR: { area: "EA", cpi: { flow: CPI_2018, freq: "M", method: "HICP" }, une: "M" },
  GBP: { area: "GBR", cpi: { flow: CPI_1999, freq: "M", method: "HICP" }, une: "M" },
  JPY: { area: "JPN", cpi: { flow: CPI_2018, freq: "M", method: "N" }, une: "M" },
  CHF: { area: "CHE", cpi: { flow: CPI_2018, freq: "M", method: "N" }, une: "Q" },
  CAD: { area: "CAN", cpi: { flow: CPI_2018, freq: "M", method: "N" }, une: "M" },
  AUD: { area: "AUS", cpi: { flow: CPI_1999, freq: "M", method: "N" }, une: "M" },
  NZD: { area: "NZL", cpi: { flow: CPI_1999, freq: "Q", method: "N" }, une: "Q" },
};

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));
}

async function get(flow: string, key: string, lastN: number): Promise<{ url: string; rows: Row[] }> {
  const url = `${BASE}/${flow}/${key}?lastNObservations=${lastN}`;
  // A API da OCDE recusa pedidos muito seguidos e falha ocasionalmente (500/429):
  // espaça os pedidos e tenta até 5 vezes, com espera crescente.
  await new Promise((r) => setTimeout(r, 1500));
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/vnd.sdmx.data+csv; charset=utf-8" } });
    if (res.ok) return { url, rows: parseCsv(await res.text()) };
    if (attempt >= 5) throw new Error(`OCDE respondeu ${res.status} para ${url}`);
    const wait = 3000 * 2 ** (attempt - 1);
    console.warn(`  OCDE respondeu ${res.status}; nova tentativa em ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

function latest(rows: Row[]) {
  return [...rows].sort((a, b) => a.TIME_PERIOD.localeCompare(b.TIME_PERIOD));
}

async function main() {
  const codes = Object.keys(CONFIG) as Code[];
  const out: Record<string, unknown> = {};

  // Inflação: um pedido por conjunto de dados.
  const cpiByFlow = new Map<string, Code[]>();
  for (const c of codes) cpiByFlow.set(CONFIG[c].cpi.flow, [...(cpiByFlow.get(CONFIG[c].cpi.flow) ?? []), c]);
  const cpi: Partial<Record<Code, { value: number; period: string; measure: string; url: string }>> = {};
  for (const [flow, list] of cpiByFlow) {
    const areas = list.map((c) => CONFIG[c].area).join("+");
    const { url, rows } = await get(flow, `${areas}.M+Q.N+HICP.CPI.PA._T.N.GY`, 1);
    for (const c of list) {
      const cfg = CONFIG[c];
      const r = rows.find((x) => x.REF_AREA === cfg.area && x.FREQ === cfg.cpi.freq && x.METHODOLOGY === cfg.cpi.method);
      if (!r) throw new Error(`Sem inflação para ${c}`);
      cpi[c] = { value: Number(Number(r.OBS_VALUE).toFixed(2)), period: r.TIME_PERIOD, measure: cfg.cpi.method === "HICP" ? "IHPC" : "IPC", url };
    }
  }

  // Desemprego: valor mais recente e de há ~6 meses (ou 2 trimestres).
  const areas = codes.map((c) => CONFIG[c].area).join("+");
  const une = await get(UNE, `${areas}..._Z.Y._T.Y_GE15..M+Q`, 7);
  for (const c of codes) {
    const cfg = CONFIG[c];
    const series = latest(une.rows.filter((x) => x.REF_AREA === cfg.area && x.FREQ === cfg.une));
    if (series.length < 3) throw new Error(`Sem desemprego suficiente para ${c}`);
    const last = series[series.length - 1];
    const back = cfg.une === "M" ? series[Math.max(0, series.length - 7)] : series[series.length - 3];
    out[c] = {
      inflation: cpi[c],
      unemployment: {
        value: Number(Number(last.OBS_VALUE).toFixed(2)),
        period: last.TIME_PERIOD,
        sixMonthsAgo: Number(Number(back.OBS_VALUE).toFixed(2)),
        sixMonthsAgoPeriod: back.TIME_PERIOD,
        url: une.url,
      },
    };
  }

  const snapshot = {
    source: "OCDE (OECD Data Explorer, sdmx.oecd.org)",
    fetchedAt: new Date().toISOString(),
    kind: "fim-de-dia",
    currencies: out,
  };
  writeFileSync(new URL("../src/data/macro-snapshot.json", import.meta.url), JSON.stringify(snapshot, null, 2) + "\n");
  console.log("Dados macro atualizados:");
  for (const c of codes) {
    const d = out[c] as { inflation: { value: number; period: string }; unemployment: { value: number; period: string; sixMonthsAgo: number } };
    console.log(`  ${c}  inflação ${d.inflation.value}% (${d.inflation.period})  desemprego ${d.unemployment.value}% (${d.unemployment.period}, há 6m ${d.unemployment.sixMonthsAgo}%)`);
  }
}

main().catch((e) => {
  console.error("Falhou a atualização dos dados macro:", e.message);
  process.exit(1);
});
