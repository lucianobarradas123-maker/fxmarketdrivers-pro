import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold tracking-tight">Entrar</h1>
      <LoginForm />
      <p className="text-center text-xs text-muted">
        Primeira utilização?{" "}
        <Link href="/registo" className="text-up-soft hover:text-ink">
          Criar a tua conta
        </Link>
      </p>
    </div>
  );
}
