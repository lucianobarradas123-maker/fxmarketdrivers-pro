"use client";

import { signUp } from "../actions";
import { AuthForm, Field } from "../AuthForm";

export function RegistoForm() {
  return (
      <AuthForm action={signUp} submit="Criar conta">
        {(email) => (
          <>
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={email} />
        <Field
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 12 caracteres, com maiúsculas, minúsculas e números. Usa um gestor de palavras-passe."
        />
        <Field label="Confirmar palavra-passe" name="confirm" type="password" autoComplete="new-password" />
          </>
        )}
      </AuthForm>
  );
}
