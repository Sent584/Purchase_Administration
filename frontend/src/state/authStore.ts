import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/queryClient';
import type { TokenResponse, UserSummary } from '../types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserSummary | null;
  setSession: (tokens: TokenResponse) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: UserSummary) => void;
  clearSession: () => void;
  hasPermission: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (tokens) => {
        // A different identity may be signing in on the same tab (e.g. demoing multiple
        // roles) — any cached query results belong to the previous session's permissions.
        queryClient.clear();
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          user: tokens.user,
        });
      },
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      clearSession: () => {
        queryClient.clear();
        set({ accessToken: null, refreshToken: null, user: null });
      },
      hasPermission: (code) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.includes('*') || user.permissions.includes(code);
      },
    }),
    { name: 'sasurie-auth' },
  ),
);
