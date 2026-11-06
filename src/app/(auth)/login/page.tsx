import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold tracking-tight">Entrar</h1>
      <LoginForm />
    </div>
  );
}
