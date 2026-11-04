import { useNavigate } from "react-router-dom";

import { Button, Navbar, NavbarGroup, NavbarHeading, Tag } from "app/components";
import { useAppStore } from "app/app.store";
import { ROLE_LABELS } from "auth/auth.entity";
import { useProfile } from "auth/auth.hooks";
import { useAuthStore } from "auth/auth.store";

import "./Topbar.css";


export default function Topbar({ className, menuButton }: TopbarProps) {
  const navigate = useNavigate();
  const profile = useProfile();
  const signOut = useAuthStore((s) => s.signOut);
  const themeMode = useAppStore((s) => s.themeMode);
  const cycleThemeMode = useAppStore((s) => s.cycleThemeMode);

  return (
    <Navbar className={["app-topbar", className].join(" ")}>
      <NavbarGroup align="left">
        {menuButton}
        <NavbarHeading>
          <div className="app-topbar-logo" onClick={() => navigate("/")}>
            Мини-CRM
          </div>
        </NavbarHeading>
      </NavbarGroup>
      <NavbarGroup align="right">
        <Button
          variant="minimal"
          icon={themeMode === 'dark' ? 'flash' : themeMode === 'light' ? 'moon' : 'desktop'}
          onClick={cycleThemeMode}
        />
        <span className="app-topbar-user">{profile.full_name}</span>
        <Tag minimal intent={profile.role === 'manager' ? 'primary' : 'none'}>
          {ROLE_LABELS[profile.role]}
        </Tag>
        <Button
          variant="minimal"
          icon="log-out"
          text="Выйти"
          onClick={signOut}
        />
      </NavbarGroup>
    </Navbar>
  );
}

export type TopbarProps = {
  className?: string,
  menuButton?: JSX.Element,
}
