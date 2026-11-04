import { Icon } from "@blueprintjs/core";
import { Navigate, useLocation } from "react-router-dom";

import {
  Card, CardContent, CardHeader, Column, Form, FormButton, Row, TextInputField
} from "app/components";
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

  const { formData, onChange } = useFormData<LoginFormData>(null, { email: '', password: '' }, []);
  useApiErrors(signInState);

  if (session)
    return <Navigate to={locationState?.from || "/"} replace />;

  const canSubmit = !!formData.email && !!formData.password && !signInState.isLoading;
  const submit = () => canSubmit && signIn(formData.email, formData.password);

  return (
    <div className="fullscreenGuard">
      <Card elevation={2} className="app-loginPage-card">
        <Row>
          <Column>
            <CardHeader title="Вход" />
            <CardContent>
              <Form className="app-loginPage-form">
                <form
                  className="app-loginPage-formSection"
                  onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <TextInputField
                    autoFocus
                    name="email"
                    type="email"
                    label="Email"
                    autoComplete="username"
                    autoCapitalize="none"
                    value={formData.email}
                    readOnly={signInState.isLoading}
                    onChange={onChange}
                  />
                  <TextInputField
                    name="password"
                    type="password"
                    label="Пароль"
                    autoComplete="current-password"
                    value={formData.password}
                    readOnly={signInState.isLoading}
                    onChange={onChange}
                  />
                  <FormButton
                    type="submit"
                    variant="outlined"
                    text="Войти"
                    loading={signInState.isLoading}
                    disabled={!formData.email || !formData.password}
                  />
                </form>
              </Form>
            </CardContent>
          </Column>
          <div className="app-loginPage-logobox">
            <Icon icon="office" size={56} />
            <span>Мини-CRM</span>
          </div>
        </Row>
      </Card>
    </div>
  );
}
