"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthUser } from "@/entities";
import { login as apiLogin, register as apiRegister, fetchMe } from "@/lib/api/auth";
import { setAccessToken, clearAccessToken, getTokenStrategy } from "@/lib/api/token-strategy";
import { setAccessTokenGetter, setUnauthorizedHandler } from "@/lib/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {
    throw new Error("AuthProvider not ready");
  },
  register: async () => {
    throw new Error("AuthProvider not ready");
  },
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => getTokenStrategy() === "httpOnly-cookie",
  );

  // Настроить интерцептор 401 → logout + редирект
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAccessToken();
      setUser(null);
      router.push("/login");
    });
  }, [router]);

  // Настроить getter токена для API-клиента
  useEffect(() => {
    setAccessTokenGetter(() => {
      // Для in-memory стратегии токен хранится в token-strategy
      // Для httpOnly-cookie — токен в куке, не доступен из JS
      return null; // httpOnly-cookie: токен не доступен из JS
    });
  }, []);

  // Загрузить пользователя при монтировании (только для httpOnly-cookie)
  useEffect(() => {
    if (getTokenStrategy() !== "httpOnly-cookie") {
      return;
    }

    let cancelled = false;

    fetchMe()
      .then((authUser) => {
        if (!cancelled) {
          setUser(authUser);
        }
      })
      .catch(() => {
        // Нет сессии — пользователь не авторизован
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin({ email, password });

      // Если бэкенд вернул токен в теле ответа — сохраняем
      if (response.accessToken) {
        setAccessToken(response.accessToken);
      }

      setUser(response.user);
      return response.user;
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await apiRegister({ email, password });

      // Если бэкенд вернул токен в теле ответа — сохраняем
      if (response.accessToken) {
        setAccessToken(response.accessToken);
      }

      setUser(response.user);
      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}