import { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Button, Card, TextInputField } from "app/components";
import { useApiErrors, useFormData } from "utils";

import { useAuthStore } from "../auth.store";
import "./LoginPage.css";


interface LoginFormData {
  email: string;
  password: string;
}

// No sign-up link on purpose: accounts are created by the administrator only.
export default function LoginPage() {
  const { state: locationState } = useLocation();
  const session = useAuthStore((s) => s.session);
  const signInState = useAuthStore((s) => s.signInState);
  const signIn = useAuthStore((s) => s.signIn);

  const { formData, onChange } = useFormData<LoginFormData>(null, { email: '', password: '' });
  useApiErrors(signInState);

  if (session)
    return <Navigate to={locationState?.from || "/"} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    signIn(formData.email, formData.password);
  };

  return (
    <div className="app-loginPage">
      <Card className="app-loginPage-card">
        <h2>Мини-CRM</h2>
        <form onSubmit={onSubmit}>
          <TextInputField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            value={formData.email}
            onChange={onChange}
            disabled={signInState.isLoading}
            leftIcon="envelope"
            large
          />
          <TextInputField
            label="Пароль"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={onChange}
            disabled={signInState.isLoading}
            leftIcon="lock"
            large
          />
          <Button
            type="submit"
            intent="primary"
            text="Войти"
            loading={signInState.isLoading}
            disabled={!formData.email || !formData.password}
            large
            fill
          />
        </form>
      </Card>
    </div>
  );
}
