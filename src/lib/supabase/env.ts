/**
 * Configuração pública do Supabase.
 * O endereço é normalizado para a origem (ex.: remove "/rest/v1/" se tiver sido colado por engano).
 */
function origin(raw: string | undefined): string {
  if (!raw) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL (ver .env.example).");
  try {
    return new URL(raw.trim()).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não é um endereço válido.");
  }
}

export const SUPABASE_URL = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

if (!SUPABASE_KEY) throw new Error("Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).");
