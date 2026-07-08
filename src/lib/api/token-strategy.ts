/**
 * Стратегия хранения JWT.
 *
 * По умолчанию — httpOnly cookie (токен устанавливается бэкендом через Set-Cookie,
 * на фронте ничего хранить не нужно).
 *
 * Если контракт с бэкендом предполагает, что токен приходит в теле ответа,
 * переключи стратегию на "in-memory" — токен будет храниться в памяти приложения
 * (переменная + getter для API-клиента).
 *
 * Переключение: измени значение по умолчанию в функции `getTokenStrategy()`
 * или установи NEXT_PUBLIC_TOKEN_STRATEGY=in-memory в .env.local.
 */

export type TokenStrategy = "httpOnly-cookie" | "in-memory";

let currentStrategy: TokenStrategy = (process.env.NEXT_PUBLIC_TOKEN_STRATEGY as TokenStrategy) ?? "httpOnly-cookie";

let inMemoryToken: string | null = null;

export function getTokenStrategy(): TokenStrategy {
  return currentStrategy;
}

export function setTokenStrategy(strategy: TokenStrategy) {
  currentStrategy = strategy;
}

/**
 * Получить токен — работает только для in-memory стратегии.
 * Для httpOnly-cookie возвращает null (токен в куке, не доступен из JS).
 */
export function getAccessToken(): string | null {
  if (currentStrategy === "in-memory") {
    return inMemoryToken;
  }
  return null;
}

/**
 * Сохранить токен — работает только для in-memory стратегии.
 * Для httpOnly-cookie ничего не делает (токен устанавливается бэкендом).
 */
export function setAccessToken(token: string | null) {
  if (currentStrategy === "in-memory") {
    inMemoryToken = token;
  }
}

/**
 * Очистить токен.
 */
export function clearAccessToken() {
  inMemoryToken = null;
}