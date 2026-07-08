import { apiClient } from "./client";
import type { AuthUser } from "@/entities";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
}

/**
 * Войти по email + пароль.
 * POST /api/auth/login
 */
export function login(data: LoginRequest) {
  return apiClient.post<AuthResponse>("/api/auth/login", data, {
    skipAuth: true,
  });
}

/**
 * Зарегистрироваться.
 * POST /api/auth/register
 */
export function register(data: RegisterRequest) {
  return apiClient.post<AuthResponse>("/api/auth/register", data, {
    skipAuth: true,
  });
}

/**
 * Получить текущего пользователя по токену.
 * GET /api/auth/me
 *
 * skipUnauthorizedRedirect: true — 401 здесь означает "нет сессии", это не ошибка,
 * а штатная ситуация. Не нужно редиректить на /login.
 */
export function fetchMe() {
  return apiClient.get<AuthUser>("/api/auth/me", { skipUnauthorizedRedirect: true });
}
