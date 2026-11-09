import "server-only";
/**
 * Sentimento do retalho via API oficial do Myfxbook (Community Outlook).
 * Origem: contas reais de traders de retalho ligadas ao Myfxbook. Frequência: atualizado ao longo do dia;
 * aqui em cache durante 1 hora. Credenciais SÓ no servidor (MYFXBOOK_EMAIL / MYFXBOOK_PASSWORD, "Secret" na Vercel).
 *
 * Fluxo: login → ler outlook → logout (não deixa sessões abertas).
 */
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { isPair } from "@/lib/pairs";
import { toPair, type RetailPair } from "@/lib/retail";

const API = "https://www.myfxbook.com/api";

const loginSchema = z.object({ error: z.boolean(), message: z.string().optional(), session: z.string().optional() });

const outlookSchema = z.object({
  error: z.boolean(),
  message: z.string().optional(),
  symbols: z.array(
    z
      .object({
        name: z.string(),
        longPercentage: z.coerce.number(),
        shortPercentage: z.coerce.number(),
        totalPositions: z.coerce.number().optional(),
      })
      .loose(),
  ),
});

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Myfxbook respondeu ${res.status}`);
  return res.json();
}

export interface RetailData {
  pairs: Record<string, RetailPair>;
  fetchedAt: string;
}

/**
 * Nunca lança erro dentro da cache (com Cache Components isso interrompe a pré-geração das páginas):
 * devolve { error } e, nesse caso, guarda só por minutos para voltar a tentar depressa.
 */
export async function getRetailSentiment(): Promise<RetailData | { error: string }> {
  "use cache";
  cacheTag("sentimento-retalho");
  try {
    const data = await fetchRetail();
    cacheLife("hours");
    return data;
  } catch (e) {
    cacheLife("minutes");
    return { error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

async function fetchRetail(): Promise<RetailData> {
  const email = process.env.MYFXBOOK_EMAIL;
  const password = process.env.MYFXBOOK_PASSWORD;
  if (!email || !password) throw new Error("Faltam MYFXBOOK_EMAIL e MYFXBOOK_PASSWORD.");

  const login = loginSchema.parse(
    await getJson(`${API}/login.json?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
  );
  if (login.error || !login.session) throw new Error(`Login no Myfxbook falhou: ${login.message ?? "sem detalhe"}`);
  // A sessão vem já codificada; volta a codificar para ir em segurança na URL.
  const session = encodeURIComponent(decodeURIComponent(login.session));

  try {
    const raw = await getJson(`${API}/get-community-outlook.json?session=${session}`);
    const parsed = outlookSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Formato inesperado na resposta do Myfxbook.");
    if (parsed.data.error) throw new Error(`Myfxbook: ${parsed.data.message ?? "erro"}`);

    const pairs: Record<string, RetailPair> = {};
    for (const s of parsed.data.symbols) {
      const pair = toPair(s.name);
      if (!pair || !isPair(pair)) continue;
      const total = s.longPercentage + s.shortPercentage;
      if (!(total > 95 && total < 105)) continue; // ignora dados incoerentes
      pairs[pair] = {
        pair,
        longPct: Math.round(s.longPercentage),
        shortPct: Math.round(s.shortPercentage),
        positions: s.totalPositions ?? null,
      };
    }
    if (Object.keys(pairs).length === 0) throw new Error("O Myfxbook não devolveu pares reconhecidos.");
    return { pairs, fetchedAt: new Date().toISOString() };
  } finally {
    await fetch(`${API}/logout.json?session=${session}`).catch(() => undefined);
  }
}

export async function getRetailSentimentSafe(): Promise<RetailData | null> {
  const r = await getRetailSentiment();
  if ("error" in r) {
    console.error("Sentimento do retalho indisponível:", r.error);
    return null;
  }
  return r;
}
