import "server-only";
/**
 * Análise de discursos e comunicados de bancos centrais com Claude (D51).
 * Modelo: Claude Opus 5.5 · respostas estruturadas (validadas) · reserva automática em caso de recusa.
 * A chave ANTHROPIC_API_KEY fica só no servidor ("Secret" na Vercel).
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { STANCE_LABEL } from "@/lib/macro/score";
import { AnalysisSchema, type StoredAnalysis } from "./schema";
import { htmlToText, isSafeUrl, quoteAppears } from "./text";

export const MODEL = "claude-opus-5-5";
const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_CHARS = 200_000;

export type Source = { kind: "text"; text: string } | { kind: "pdf"; base64: string };

/** Lê o conteúdo de um link público (HTML, texto ou PDF), seguindo no máximo 3 redireções seguras. */
export async function fetchSource(url: string): Promise<Source> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    if (!isSafeUrl(current)) throw new Error("Link não permitido (só https para sites públicos).");
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "FXMarketDriversPro/1.0 (leitura pessoal de discursos)" },
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) break;
      current = new URL(next, current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`O site respondeu ${res.status}. Cola o texto manualmente.`);
    const size = Number(res.headers.get("content-length") ?? 0);
    if (size > MAX_BYTES) throw new Error("Documento demasiado grande (máx. 10 MB).");
    const type = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error("Documento demasiado grande (máx. 10 MB).");
    if (type.includes("pdf") || buf.subarray(0, 5).toString() === "%PDF-") return { kind: "pdf", base64: buf.toString("base64") };
    const raw = buf.toString("utf8");
    const text = type.includes("html") || /<html|<body|<p[\s>]/i.test(raw) ? htmlToText(raw) : raw.trim();
    if (text.length < 500) throw new Error("Não consegui extrair texto suficiente desta página. Cola o texto manualmente.");
    return { kind: "text", text: text.slice(0, MAX_CHARS) };
  }
  throw new Error("Demasiadas redireções.");
}

export interface SpeechContext {
  currency: string;
  bank: string;
  eventName: string;
  eventDate: string;
  currentStance: keyof typeof STANCE_LABEL;
  currentReasoning: string;
  previous: { date: string; name: string; tom: string; resumo: string[] }[];
}

const SYSTEM = `És um analista sénior de política monetária a apoiar um trader de Forex (day e swing trading).
Analisas discursos, conferências de imprensa e comunicados de bancos centrais e escreves em português de Portugal.

Escala de tom (a mesma que o utilizador usa para a leitura dos bancos centrais):
- Restritivo: inclinação clara para subir juros ou manter política apertada por mais tempo.
- Lig. restritivo: preocupação com a inflação domina, mas sem compromisso com subidas.
- Neutro: equilíbrio entre riscos, dependência dos dados sem inclinação.
- Lig. expansionista: preocupação com o crescimento/emprego domina, abertura a cortes.
- Expansionista: inclinação clara para cortar juros ou estimular.

Regras:
- Baseia-te apenas no texto fornecido e no contexto dado. Se o texto não for de política monetária, diz isso no resumo e usa confiança baixa.
- As citações têm de ser copiadas literalmente do texto, na língua original, sem alterar palavras.
- Distingue o que o orador disse do que tu interpretas.
- Não dês sinais de compra ou venda nem previsões de preço: descreve implicações para a política monetária e para a moeda como contexto.
- Só preenche "sugestao_leitura" se, com base neste texto, a leitura atual do utilizador já não for a mais adequada.`;

function contextText(c: SpeechContext): string {
  const prev = c.previous.length
    ? c.previous.map((p) => `- ${p.date} · ${p.name} · tom ${p.tom}: ${p.resumo.slice(0, 3).join(" | ")}`).join("\n")
    : "- (sem análises anteriores)";
  return `Evento: ${c.eventName} (${c.currency}, ${c.bank}) em ${c.eventDate}.
Leitura atual do utilizador para o ${c.bank}: ${STANCE_LABEL[c.currentStance]} — ${c.currentReasoning}
Análises anteriores desta moeda:
${prev}

Analisa o texto seguinte (discurso ou comunicado).`;
}

export async function analyzeSpeech(source: Source, ctx: SpeechContext): Promise<StoredAnalysis> {
  const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente do servidor

  const content: Anthropic.Beta.BetaContentBlockParam[] =
    source.kind === "pdf"
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: source.base64 } },
          { type: "text", text: contextText(ctx) },
        ]
      : [{ type: "text", text: `${contextText(ctx)}\n\n<texto>\n${source.text}\n</texto>` }];

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // se o modelo recusar por engano, outro modelo responde automaticamente
    output_config: { effort: "high", format: betaZodOutputFormat(AnalysisSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("A IA recusou analisar este texto.");
  if (response.stop_reason === "max_tokens") throw new Error("A análise ficou incompleta (texto demasiado longo). Tenta com um excerto.");
  const out = response.parsed_output;
  if (!out) throw new Error("A IA devolveu uma resposta num formato inesperado. Tenta novamente.");

  const viaReserva = (response.usage.iterations ?? []).some((i) => i.type === "fallback_message");
  return {
    ...out,
    citacoes_verificadas: out.citacoes.map((c) => (source.kind === "text" ? quoteAppears(c.texto, source.text) : null)),
    custo_tokens: { entrada: response.usage.input_tokens, saida: response.usage.output_tokens },
    via_reserva: viaReserva,
  };
}
