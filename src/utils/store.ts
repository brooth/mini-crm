import { useEffect } from 'react';
import type { StoreApi } from 'zustand';

import { supabase } from 'lib/supabase';

import { ApiCallState, isEmpty } from './api-state';

export function useApiTools<T extends object>(store: StoreApi<T>) {
  const state = new Proxy({} as T, {
    get: (_, prop) => store.getState()[prop as keyof T],
  });
  return { state, db: supabase };
}

// Cached data must not survive a user switch in the same tab:
// every domain store registers its reset() here, auth calls resetStores().
const resetters: Array<() => void> = [];

export function registerStoreReset(reset: () => void) {
  resetters.push(reset);
}

export function resetStores() {
  resetters.forEach((reset) => reset());
}

/** Loads when the state is empty — so invalidating a state (setting it to {}) triggers a refetch. */
export function useAutoLoad(state: ApiCallState<unknown> | undefined, load: () => void, enabled = true) {
  useEffect(() => {
    if (enabled && isEmpty(state)) load();
  }, [state, enabled]);
}
