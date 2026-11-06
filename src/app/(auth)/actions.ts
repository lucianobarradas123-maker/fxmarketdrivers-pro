"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string; email?: string } | undefined;

const credentials = z.object({
  email: z.email("Indica um email válido."),
  password: z.string().min(1, "Indica a palavra-passe."),
});

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const parsed = credentials.safeParse({ email, password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Mensagem genérica: não revela se o email existe.
  if (error) return { error: "Email ou palavra-passe incorretos, ou conta ainda não confirmada.", email };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2" ? "/login/2fa" : "/");
}

const signUpSchema = z
  .object({
    email: z.email("Indica um email válido."),
    password: z
      .string()
      .min(12, "A palavra-passe precisa de pelo menos 12 caracteres.")
      .regex(/[a-z]/, "Inclui pelo menos uma letra minúscula.")
      .regex(/[A-Z]/, "Inclui pelo menos uma letra maiúscula.")
      .regex(/[0-9]/, "Inclui pelo menos um número."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As palavras-passe não coincidem.", path: ["confirm"] });

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const parsed = signUpSchema.safeParse({
    email,
    password: form.get("password"),
    confirm: form.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    console.error("Registo falhou:", error.code, error.status, error.message);
    return { error: signUpError(error.code, error.message), email };
  }
  return { message: "Conta criada. Abre o email de confirmação que te enviámos (verifica também o spam)." };
}

/** Traduz os erros do Supabase em mensagens claras (sem revelar dados sensíveis). */
function signUpError(code: string | undefined, message: string): string {
  switch (code) {
    case "signup_disabled":
      return "O registo de novas contas está fechado.";
    case "email_address_not_authorized":
      return "Este email não é aceite pelo serviço de email de teste do Supabase, que só envia para os emails da equipa do projeto. Usa o mesmo email da tua conta Supabase.";
    case "over_email_send_rate_limit":
      return "Foi atingido o limite de emails do serviço de teste (2 por hora). Tenta novamente daqui a uma hora.";
    case "email_address_invalid":
      return "Este endereço de email não é aceite. Verifica se está bem escrito.";
    case "weak_password":
      return "A palavra-passe não cumpre os requisitos de segurança.";
    case "user_already_exists":
    case "email_exists":
      return "Não foi possível criar a conta com este email. Se já te registaste, entra pela página de login.";
    default:
      if (/signups? not allowed|disabled/i.test(message)) return "O registo de novas contas está fechado.";
      return `Não foi possível criar a conta (código: ${code ?? "desconhecido"}). Envia este código ao suporte.`;
  }
}

const codeSchema = z.string().regex(/^\d{6}$/, "O código tem 6 dígitos.");

export async function verify2fa(_: FormState, form: FormData): Promise<FormState> {
  const code = codeSchema.safeParse(String(form.get("code") ?? "").replace(/\s/g, ""));
  if (!code.success) return { error: code.error.issues[0].message };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp.find((f) => f.status === "verified");
  if (!totp) redirect("/");

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: code.data });
  if (error) return { error: "Código incorreto ou expirado." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
