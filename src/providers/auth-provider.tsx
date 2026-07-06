"use client";

import { createContext, useContext } from "react";

import type { AuthUser } from "@/entities";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Заготовка AuthProvider — реальная логика login/register/logout
 * будет добавлена в День 3.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextValue = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
