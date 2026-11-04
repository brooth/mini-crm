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
