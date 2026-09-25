"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { appUserApi, authApi } from "./api";
import type { AppUser } from "./types";

const STORAGE_KEY = "bidder.userId";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (input: {
    email?: string;
    phoneNumber?: string;
    password: string;
  }) => Promise<void>;
  register: (input: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (userId: string) => {
    try {
      const profile = await appUserApi.getById(userId);
      setUser(profile);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const storedId = window.localStorage.getItem(STORAGE_KEY);
      if (storedId) await loadUser(storedId);
      setLoading(false);
    }
    init();
  }, [loadUser]);

  const login = useCallback(
    async (input: { email?: string; phoneNumber?: string; password: string }) => {
      const userId = await authApi.login(input);
      window.localStorage.setItem(STORAGE_KEY, userId);
      await loadUser(userId);
    },
    [loadUser],
  );

  const register = useCallback(
    async (input: {
      fullName: string;
      email?: string;
      phoneNumber?: string;
      password: string;
    }) => {
      const userId = await authApi.register(input);
      window.localStorage.setItem(STORAGE_KEY, userId);
      await loadUser(userId);
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      window.localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const storedId = window.localStorage.getItem(STORAGE_KEY);
    if (storedId) await loadUser(storedId);
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
