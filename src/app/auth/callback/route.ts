/** Destino do link de confirmação de email: troca o código por uma sessão e entra na app. */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = request.nextUrl.clone();
  url.search = "";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    url.pathname = error ? "/login" : "/conta";
    return NextResponse.redirect(url);
  }
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
