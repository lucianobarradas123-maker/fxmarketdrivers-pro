import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { EnrollTotp } from "./EnrollTotp";
import Link from "next/link";
import { getSettings } from "@/lib/journal-data";
import { formatDay } from "@/lib/time";

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
      <Backups />
      <Card className="flex flex-col gap-2">
        <CardHeader id="ajuda" title="Ajuda" />
        <p className="text-[13px] text-ink-2">Manual de utilização, rotina semanal sugerida e custos e limites dos serviços.</p>
        <Link href="/ajuda" className="text-[13px] text-up-soft hover:text-ink">
          Abrir o manual →
        </Link>
      </Card>
    </>
  );
}

async function Backups() {
  const settings = await getSettings();
  const last = settings?.ultima_exportacao;
  const btn = "inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 font-semibold hover:bg-surface-2";
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader
        id="copias"
        title="Cópias de segurança"
        help="O plano gratuito da base de dados não inclui cópias de segurança que possas recuperar. Exporta os teus dados pelo menos uma vez por mês e guarda o ficheiro num sítio seguro (por exemplo, no teu computador e numa pasta na nuvem)."
      />
      <p className="text-[13px] text-ink-2">
        {last ? `Última exportação: ${formatDay(last)}.` : "Ainda não exportaste os teus dados."} Recomendado: uma vez por mês.
      </p>
      <div className="flex flex-wrap gap-3">
        <a href="/api/exportar?formato=json" className={btn}>
          Cópia completa (JSON)
        </a>
        <a href="/api/exportar?formato=csv" className={btn}>
          Operações para Excel (CSV)
        </a>
      </div>
      <p className="text-xs text-faint">A cópia completa inclui operações, eventos (com textos e análises de IA), leituras dos bancos centrais e definições. As capturas de ecrã não estão incluídas.</p>
    </Card>
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
