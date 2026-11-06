import type { Metadata } from "next";
import { signOut } from "../../actions";
import { TwoFactorForm } from "./TwoFactorForm";

export const metadata: Metadata = { title: "Verificação em dois passos" };

export default function TwoFactorPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Verificação em dois passos</h1>
        <p className="mt-1 text-[13px] text-muted">Introduz o código de 6 dígitos da tua app de autenticação.</p>
      </div>
      <TwoFactorForm />
      <form action={signOut} className="text-center">
        <button type="submit" className="cursor-pointer text-xs text-muted hover:text-ink">
          Sair e entrar com outra conta
        </button>
      </form>
    </div>
  );
}
