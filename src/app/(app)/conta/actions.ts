"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EnrollData = { factorId: string; qr: string; secret: string } | { error: string };

/** Inicia a configuração da 2FA: devolve o código QR para a app de autenticação. */
export async function startEnroll(): Promise<EnrollData> {
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  // Remove tentativas anteriores não concluídas.
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "FX Market Drivers Pro" });
  if (error || !data) return { error: "Não foi possível iniciar a configuração. Tenta novamente." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export type ConfirmState = { error?: string; ok?: boolean } | undefined;

export async function confirmEnroll(_: ConfirmState, form: FormData): Promise<ConfirmState> {
  const factorId = z.uuid().safeParse(form.get("factorId"));
  const code = z.string().regex(/^\d{6}$/).safeParse(String(form.get("code") ?? "").replace(/\s/g, ""));
  if (!factorId.success || !code.success) return { error: "O código tem 6 dígitos." };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.data, code: code.data });
  if (error) return { error: "Código incorreto. Confirma que a hora do telemóvel está certa e tenta de novo." };
  revalidatePath("/conta");
  return { ok: true };
}
