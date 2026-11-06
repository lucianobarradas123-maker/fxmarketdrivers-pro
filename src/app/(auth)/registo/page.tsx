import type { Metadata } from "next";
import Link from "next/link";
import { RegistoForm } from "./RegistoForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegistoPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-[13px] text-muted">Depois de criares a tua conta, o registo é fechado.</p>
      </div>
      <RegistoForm />
      <p className="text-center text-xs text-muted">
        <Link href="/login" className="text-up-soft hover:text-ink">
          Já tenho conta
        </Link>
      </p>
    </div>
  );
}
