/**
 * Стратегия хранения JWT.
 *
 * Бэкенд возвращает токен в теле ответа (поле token).
 * Храним токен in-memory, чтобы не светить в localStorage/XSS.
 * Для персистентности между перезагрузками — используем httpOnly cookie
 * через бэкенд в будущем, сейчас только in-memory.
 */

export type TokenStrategy = "in-memory";

let inMemoryToken: string | null = null;

export function getTokenStrategy(): TokenStrategy {
  return "in-memory";
}

/**
 * Получить токен.
 */
export function getAccessToken(): string | null {
  return inMemoryToken;
}

/**
 * Сохранить токен.
 */
export function setAccessToken(token: string | null) {
  inMemoryToken = token;
}

/**
 * Очистить токен.
 */
export function clearAccessToken() {
  inMemoryToken = null;
}