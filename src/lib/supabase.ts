import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

// Only the public anon/publishable key ever reaches the browser.
// All access rules are enforced by Postgres (RLS, column grants, RPC).
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/** `const { data, error } = await …; if (error) throw error; return data;` */
export function unwrap<T>(res: { data: T, error: unknown }): NonNullable<T> {
  if (res.error) throw res.error;
  return res.data as NonNullable<T>;
}

/**
 * For detail pages: a malformed id (22P02) and a row hidden by RLS both mean
 * "not found", so a user can't tell a foreign id from a missing one.
 */
export function unwrapMaybe<T>(res: { data: T, error: unknown }): NonNullable<T> | null {
  if ((res.error as { code?: string } | null)?.code === '22P02') return null;
  if (res.error) throw res.error;
  return res.data ?? null;
}
