"use client";

import { verify2fa } from "../../actions";
import { AuthForm, Field } from "../../AuthForm";

export function TwoFactorForm() {
  return (
      <AuthForm action={verify2fa} submit="Verificar">
        {() => <Field label="Código" name="code" inputMode="numeric" autoComplete="one-time-code" />}
      </AuthForm>
  );
}
