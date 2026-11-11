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
import { execFile } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);

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
    // Usa o curl (ferramenta indicada na documentação da API da OCDE): o servidor da OCDE responde 500
    // a pedidos do cliente HTTP do Node que não estejam em cache, mas responde normalmente ao curl.
    const { stdout } = await run(
      "curl",
      ["-sS", "-m", "90", "-w", "\n%{http_code}", "-H", "Accept: application/vnd.sdmx.data+csv; charset=utf-8", url],
      { maxBuffer: 50 * 1024 * 1024 },
    ).catch((e) => ({ stdout: `\n000 ${e.message}` }));
    const cut = stdout.lastIndexOf("\n");
    const status = Number(stdout.slice(cut + 1, cut + 4));
    const body = stdout.slice(0, cut);
    if (status === 200) return { url, rows: parseCsv(body) };
    const res = { status };
    if (attempt >= 5) throw new Error(`OCDE respondeu ${res.status} para ${url}`);
    const wait = 3000 * 2 ** (attempt - 1);
    console.warn(`  OCDE respondeu ${res.status}; nova tentativa em ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

function latest(rows: Row[]) {
  return [...rows].sort((a, b) => a.TIME_PERIOD.localeCompare(b.TIME_PERIOD));
}

const SNAPSHOT = new URL("../src/data/macro-snapshot.json", import.meta.url);

async function main() {
  const codes = Object.keys(CONFIG) as Code[];
  const out: Record<string, unknown> = {};
  // Dados anteriores: usados para as partes que falharem nesta execução.
  const previous = existsSync(SNAPSHOT) ? (JSON.parse(readFileSync(SNAPSHOT, "utf8")).currencies as Record<string, { inflation: unknown; unemployment: unknown }>) : {};
  const failures: string[] = [];

  // Inflação: um pedido por conjunto de dados.
  const cpiByFlow = new Map<string, Code[]>();
  for (const c of codes) cpiByFlow.set(CONFIG[c].cpi.flow, [...(cpiByFlow.get(CONFIG[c].cpi.flow) ?? []), c]);
  const cpi: Partial<Record<Code, { value: number; period: string; measure: string; url: string }>> = {};
  for (const [flow, list] of cpiByFlow) {
    const areas = list.map((c) => CONFIG[c].area).join("+");
    let res: { url: string; rows: Row[] };
    try {
      res = await get(flow, `${areas}.M+Q.N+HICP.CPI.PA._T.N.GY`, 1);
    } catch (e) {
      failures.push(`inflação (${list.join(", ")}): ${(e as Error).message}`);
      continue;
    }
    const { url, rows } = res;
    for (const c of list) {
      const cfg = CONFIG[c];
      const r = rows.find((x) => x.REF_AREA === cfg.area && x.FREQ === cfg.cpi.freq && x.METHODOLOGY === cfg.cpi.method);
      if (!r) {
        failures.push(`inflação ${c}: sem dados`);
        continue;
      }
      cpi[c] = { value: Number(Number(r.OBS_VALUE).toFixed(2)), period: r.TIME_PERIOD, measure: cfg.cpi.method === "HICP" ? "IHPC" : "IPC", url };
    }
  }

  // Desemprego: valor mais recente e de há ~6 meses (ou 2 trimestres).
  const areas = codes.map((c) => CONFIG[c].area).join("+");
  let une: { url: string; rows: Row[] } | null = null;
  try {
    une = await get(UNE, `${areas}..._Z.Y._T.Y_GE15..M+Q`, 7);
  } catch (e) {
    failures.push(`desemprego: ${(e as Error).message}`);
  }
  for (const c of codes) {
    const cfg = CONFIG[c];
    const prev = previous[c];
    const series = une ? latest(une.rows.filter((x) => x.REF_AREA === cfg.area && x.FREQ === cfg.une)) : [];
    if (series.length < 3 || !une) {
      if (une) failures.push(`desemprego ${c}: sem dados suficientes`);
      if (!prev) throw new Error(`Sem dados (nem anteriores) para ${c}`);
      out[c] = { inflation: cpi[c] ?? prev.inflation, unemployment: prev.unemployment };
      continue;
    }
    const last = series[series.length - 1];
    const back = cfg.une === "M" ? series[Math.max(0, series.length - 7)] : series[series.length - 3];
    if (!cpi[c] && !prev) throw new Error(`Sem inflação (nem anterior) para ${c}`);
    out[c] = {
      inflation: cpi[c] ?? prev!.inflation,
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
  // Se TUDO falhou, não escreve nada (mantém o ficheiro anterior intacto) e assinala erro.
  if (failures.length && Object.keys(cpi).length === 0 && !une) throw new Error(`A OCDE falhou em todos os pedidos: ${failures.join(" | ")}`);
  writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 2) + "\n");
  if (failures.length) console.warn(`Atualização PARCIAL — mantidos os dados anteriores em: ${failures.join(" | ")}`);
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
