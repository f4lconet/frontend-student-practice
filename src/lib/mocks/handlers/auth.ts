import { http, HttpResponse } from "msw";
import type { HttpHandler } from "msw";

import type { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/api/auth";
import type { AuthUser } from "@/entities";

const STORAGE_KEY_USERS = "mock_users";
const STORAGE_KEY_SESSION = "mock_session";

interface StoredUser {
  user: AuthUser;
  password: string;
}

/** Загрузить пользователей из localStorage */
function loadUsers(): Map<string, StoredUser> {
  if (typeof window === "undefined") {
    return getDefaultUsers();
  }

  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  if (stored) {
    try {
      const parsed: Record<string, StoredUser> = JSON.parse(stored);

      // Убедиться, что тестовые пользователи есть всегда
      const defaults = getDefaultUsersMap();
      for (const [email, data] of defaults) {
        if (!parsed[email]) {
          parsed[email] = data;
        }
      }

      return new Map(Object.entries(parsed));
    } catch {
      // ignore
    }
  }

  // Первый запуск — сохраняем тестовых пользователей
  const defaults = getDefaultUsersMap();
  saveUsers(defaults);
  return defaults;
}

/** Сохранить пользователей в localStorage */
function saveUsers(users: Map<string, StoredUser>) {
  if (typeof window === "undefined") return;
  const obj: Record<string, StoredUser> = {};
  for (const [email, data] of users) {
    obj[email] = data;
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(obj));
}

function getDefaultUsersMap(): Map<string, StoredUser> {
  return new Map([
    [
      "student@test.ru",
      {
        user: {
          id: "user-student-1",
          email: "student@test.ru",
          role: "student",
        },
        password: "123456",
      },
    ],
    [
      "admin@test.ru",
      {
        user: {
          id: "user-admin-1",
          email: "admin@test.ru",
          role: "admin",
        },
        password: "123456",
      },
    ],
  ]);
}

function getDefaultUsers(): Map<string, StoredUser> {
  return getDefaultUsersMap();
}

/** Генерация токена (заглушка — в реальном проекте будет JWT от бэкенда) */
function generateToken(user: AuthUser): string {
  return `mock-jwt-${user.id}-${Date.now()}`;
}

/** Извлечь userId из mock-токена */
function parseUserIdFromToken(token: string): string | null {
  // Формат: mock-jwt-{userId}-{timestamp}
  const parts = token.split("-");
  if (parts.length < 4 || parts[0] !== "mock" || parts[1] !== "jwt") {
    return null;
  }
  return parts.slice(2, -1).join("-");
}

/** Сохранить сессию в localStorage + установить куку для middleware */
function saveSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY_SESSION,
    JSON.stringify({ token, user }),
  );
  // Устанавливаем куку auth_session для middleware
  // Формат: userId|role, живёт 24 часа
  document.cookie = `auth_session=${user.id}|${user.role}; path=/; max-age=86400; SameSite=Lax`;
}

/** Очистить сессию и куку */
function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  // Удаляем куку auth_session
  document.cookie = "auth_session=; path=/; max-age=0; SameSite=Lax";
}

/** Загрузить сессию */
function loadSession(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export const authHandlers: HttpHandler[] = [
  // POST /api/auth/login
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

    const users = loadUsers();
    const storedUser = users.get(email);

    if (!storedUser || storedUser.password !== password) {
      return HttpResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 },
      );
    }

    const token = generateToken(storedUser.user);

    // Сохраняем сессию, чтобы после перезагрузки пользователь оставался авторизованным
    saveSession(token, storedUser.user);

    const response: AuthResponse = {
      user: storedUser.user,
      accessToken: token,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/auth/register
  http.post("*/auth/register", async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;
    const { email, password } = body;

    const users = loadUsers();

    // Проверка на занятый email
    if (users.has(email)) {
      return HttpResponse.json(
        { message: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }

    // Создаём нового пользователя (всегда с ролью student)
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email,
      role: "student",
    };

    users.set(email, { user: newUser, password });
    saveUsers(users);

    const token = generateToken(newUser);

    // Сохраняем сессию
    saveSession(token, newUser);

    const response: AuthResponse = {
      user: newUser,
      accessToken: token,
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/auth/me
  http.get("*/auth/me", async ({ request }) => {
    // Сначала пробуем получить пользователя через Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const userId = parseUserIdFromToken(token);

      if (userId) {
        const users = loadUsers();
        for (const [, { user }] of users) {
          if (user.id === userId) {
            return HttpResponse.json(user, { status: 200 });
          }
        }
      }
    }

    // Если нет заголовка — пробуем восстановить сессию из localStorage
    // (для случая перезагрузки страницы при httpOnly-cookie стратегии)
    const session = loadSession();
    if (session) {
      return HttpResponse.json(session.user, { status: 200 });
    }

    return HttpResponse.json(
      { message: "Не авторизован" },
      { status: 401 },
    );
  }),

  // POST /api/auth/logout
  http.post("*/auth/logout", async () => {
    clearSession();
    return HttpResponse.json({ message: "Выход выполнен" }, { status: 200 });
  }),
];

/**
 * Тестовые учётные данные для ручного тестирования:
 *
 * Практикант:
 *   email: student@test.ru
 *   password: 123456
 *
 * Админ:
 *   email: admin@test.ru
 *   password: 123456
 */