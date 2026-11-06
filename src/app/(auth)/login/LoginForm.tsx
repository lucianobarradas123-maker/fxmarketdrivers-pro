"use client";

import { signIn } from "../actions";
import { AuthForm, Field } from "../AuthForm";

export function LoginForm() {
  return (
      <AuthForm action={signIn} submit="Entrar">
        {(email) => (
          <>
            <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={email} />
            <Field label="Palavra-passe" name="password" type="password" autoComplete="current-password" />
          </>
        )}
      </AuthForm>
  );
}
