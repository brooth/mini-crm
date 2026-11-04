import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from './auth.store';
import { Profile, UserRole } from './auth.entity';

/** Current profile. Only valid inside <AuthGuard />, which guarantees it is loaded. */
export function useProfile(): Profile {
  return useAuthStore((s) => s.loadProfile.value)!;
}

export function useHasRole(...roles: UserRole[]) {
  const role = useAuthStore((s) => s.loadProfile.value?.role);
  return role != null && roles.includes(role);
}

export function useIsManager() {
  return useHasRole('manager');
}

export function homePath(role: UserRole) {
  return role === 'manager' ? '/objects' : '/my-tasks';
}

/**
 * Sign out and go to "/" — otherwise the login page would send the next user
 * back to the previous user's page (it remembers `from`).
 */
export function useSignOut() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  return useCallback(async () => {
    await signOut();
    navigate('/', { replace: true });
  }, [signOut, navigate]);
}
