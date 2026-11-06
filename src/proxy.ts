/**
 * Corre antes de cada pedido:
 *  1. renova a sessão do Supabase (cookies);
 *  2. sem sessão → envia para /login;
 *  3. com 2FA configurada mas ainda sem código introduzido → envia para /login/2fa.
 * A proteção definitiva dos dados está na base de dados (RLS); isto é a primeira barreira.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Páginas acessíveis sem sessão (correspondência exata). */
const PUBLIC_PATHS = ["/login", "/registo", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const r = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (!data?.claims) {
    return isPublic ? response : redirect("/login");
  }

  // Sessão iniciada: verificar se falta o segundo fator.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needs2fa = aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";
  if (needs2fa && path !== "/login/2fa") return redirect("/login/2fa");
  if (!needs2fa && (path === "/login" || path === "/login/2fa" || path === "/registo")) return redirect("/");

  return response;
}

export const config = {
  // Tudo exceto ficheiros estáticos, imagens e o manifesto da app.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
