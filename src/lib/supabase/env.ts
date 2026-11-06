/**
 * Configuração do Supabase — usada APENAS no servidor (nunca enviada para o browser).
 * Nomes preferidos: SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (podem ser "Secret" na Vercel).
 * Os nomes antigos NEXT_PUBLIC_* continuam aceites por compatibilidade.
 * O endereço é normalizado para a origem (ex.: remove "/rest/v1/" se tiver sido colado por engano).
 */
function origin(raw: string | undefined): string {
  if (!raw) throw new Error("Falta SUPABASE_URL (ver .env.example).");
  try {
    return new URL(raw.trim()).origin;
  } catch {
    throw new Error("SUPABASE_URL não é um endereço válido.");
  }
}

export const SUPABASE_URL = origin(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_KEY = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

if (!SUPABASE_KEY) throw new Error("Falta SUPABASE_PUBLISHABLE_KEY (ver .env.example).");
