import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isFailed, isSuccessful } from "utils";

import {
	BackActivityIndicator, BackoutApiError, Button, PageNotFound
} from "app/components";
import { UserRole } from "../auth.entity";
import { useSignOut } from "../auth.hooks";
import { useAuthStore } from "../auth.store";


/**
 * Gate for protected routes. Roles here only decide what UI is reachable —
 * the actual permissions are enforced by Postgres RLS.
 */
export default function AuthGuard({ roles }: AuthGuardProps) {
  const location = useLocation();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const signOut = useSignOut();

  if (!initialized)
    return <BackActivityIndicator />;

  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (isFailed(loadProfile))
    return (
      <BackoutApiError
        error={loadProfile.error!}
        onTryAgain={() => fetchProfile(session.user.id)}>
        <Button variant="minimal" text="Выйти" onClick={signOut} />
      </BackoutApiError>
    );

  if (!isSuccessful(loadProfile))
    return <BackActivityIndicator />;

  if (roles && !roles.includes(loadProfile.value!.role))
    return <PageNotFound />;

  return <Outlet />;
}

export type AuthGuardProps = {
  roles?: UserRole[],
}
