/** Utilitários puros para textos de discursos: links seguros, extração de texto e verificação de citações. */

/**
 * Só aceita https e nomes de domínio públicos (bloqueia IPs, localhost e redes internas),
 * para o servidor nunca ser usado para aceder a endereços internos.
 */
export function isSafeUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal") || host === "localhost") return false;
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return false; // IPv4/IPv6 literais
  return true;
}

/** Converte HTML em texto simples (remove scripts, estilos, navegação e marcas). */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[“”"'.,;:…]+$/g, "")
    .trim();
}

/** A citação aparece mesmo no texto? (tolerante a aspas, travessões, espaços e maiúsculas). */
export function quoteAppears(quote: string, text: string): boolean {
  const q = normalize(quote).replace(/^["'“]+|["'”]+$/g, "");
  if (q.length < 12) return false;
  const t = normalize(text);
  if (t.includes(q)) return true;
  // aceita reticências da IA: todas as partes têm de existir, pela ordem
  const parts = q.split(/\s*(?:\.\.\.|…|\[\.\.\.\])\s*/).filter((p) => p.length >= 8);
  if (parts.length < 2) return false;
  let from = 0;
  for (const p of parts) {
    const idx = t.indexOf(p, from);
    if (idx < 0) return false;
    from = idx + p.length;
  }
  return true;
}

/** Custo estimado (USD) de analisar um texto: ~3,3 caracteres por token, ~4000 tokens de resposta (Opus 5.5: 4 $/20 $ por milhão). */
export function estimateCostUsd(chars: number): number {
  return (chars / 3.3) * (4 / 1_000_000) + 4000 * (20 / 1_000_000);
}
/** Acima deste custo estimado, pede confirmação antes de analisar. */
export const CONFIRM_ABOVE_USD = 0.15;
