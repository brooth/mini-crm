import type { Session } from '@supabase/supabase-js';
import { create } from "zustand";

import { supabase } from "utils/supabase";
import { ApiCallState, empty, failed, loading, success } from "utils/api-state";
import { resetStores } from "utils/store";
import { Profile } from "./auth.entity";


interface AuthState {
  // false until supabase reports the initial session (restored from localStorage)
  initialized: boolean;
  session: Session | null;
  loadProfile: ApiCallState<Profile>;
  signInState: ApiCallState<null>;
  init: () => () => void;
  fetchProfile: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Auth keeps its API calls inline (same exception as the admin's auth.store):
// it is tightly coupled with the session lifecycle.
export const useAuthStore = create<AuthState>()((set, get) => ({
  initialized: false,
  session: null,
  loadProfile: {},
  signInState: {},

  init: () => {
    // onAuthStateChange emits INITIAL_SESSION right away, so no separate getSession() is needed
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const prevUserId = get().session?.user.id;
      const userId = session?.user.id;
      set({ session, initialized: true });
      if (prevUserId !== userId) {
        resetStores();
        set({ loadProfile: empty() });
        // supabase-js forbids awaiting its own calls inside this callback (deadlock)
        if (userId) setTimeout(() => get().fetchProfile(userId), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  },

  fetchProfile: async (userId) => {
    set({ loadProfile: loading() });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId).single();

      if (error) throw error;
      set({ loadProfile: success(data) });
    } catch (error) {
      set({ loadProfile: failed(error) });
    }
  },

  signIn: async (email, password) => {
    set({ signInState: loading() });
    try {
      const { error } = await supabase
        .auth
        .signInWithPassword({ email: email.trim(), password });

      if (error) throw error;
      set({ signInState: success(null) });
    } catch (error) {
      set({ signInState: failed(error) });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
