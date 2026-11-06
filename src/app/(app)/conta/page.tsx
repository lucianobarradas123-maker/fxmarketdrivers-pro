import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { EnrollTotp } from "./EnrollTotp";

export const metadata: Metadata = { title: "Conta" };

async function Security() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const active = factors?.totp.some((f) => f.status === "verified");
  return (
    <>
      <Card className="flex flex-col gap-3">
        <CardHeader id="sessao" title="Sessão" />
        <p className="text-[13px] text-ink-2">
          Entraste como <span className="text-ink">{String(claims?.claims.email ?? "")}</span>
        </p>
        <form action={signOut}>
          <button type="submit" className="min-h-11 cursor-pointer rounded-lg border border-line-strong px-4 font-semibold hover:bg-surface-2">
            Sair
          </button>
        </form>
      </Card>
      <Card className="flex flex-col gap-3">
        <CardHeader
          id="2fa"
          title="Verificação em dois passos (2FA)"
          help="Além da palavra-passe, cada entrada pede um código que muda a cada 30 segundos na tua app de autenticação. Mesmo que alguém descubra a palavra-passe, não entra sem o teu telemóvel."
        />
        {active ? (
          <p className="flex items-center gap-2 text-[13px] text-up-soft">
            <span className="size-2 rounded-full bg-up" aria-hidden="true" /> Ativa — a tua conta está protegida.
          </p>
        ) : (
          <>
            <p className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
              Ainda não está ativa. Recomendo ativar agora.
            </p>
            <EnrollTotp />
          </>
        )}
      </Card>
    </>
  );
}

export default function ContaPage() {
  return (
    <>
      <PageHeader title="Conta" subtitle="Sessão e segurança" />
      <Suspense fallback={<Card><p className="text-muted">A carregar…</p></Card>}>
        <Security />
      </Suspense>
    </>
  );
}
