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
    if (/signups? not allowed|disabled/i.test(error.message)) return { error: "O registo de novas contas está fechado.", email };
    return { error: "Não foi possível criar a conta. Tenta novamente.", email };
  }
  return { message: "Conta criada. Abre o email de confirmação que te enviámos (verifica também o spam)." };
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
