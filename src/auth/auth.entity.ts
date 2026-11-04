import type { Enums, Tables } from 'app/database.types';

export type UserRole = Enums<'user_role'>;

export type Profile = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'role'>;

export const ROLE_LABELS: Record<UserRole, string> = {
  manager: 'Постановщик',
  executor: 'Исполнитель',
};
