import { ApiError, type ApiClientOptions, type ApiRequestConfig } from "./types";
import { getAccessToken } from "./token-strategy";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

let accessTokenGetter: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

/**
 * Получить токен из зарегистрированного getter'а или из стратегии хранения.
 */
function resolveAccessToken(): string | null {
  if (accessTokenGetter) {
    return accessTokenGetter();
  }
  return getAccessToken();
}

function buildUrl(
  path: string,
  params?: ApiRequestConfig["params"],
  baseUrl = DEFAULT_BASE_URL,
): string {
  const url = new URL(path.startsWith("http") ? path : `${baseUrl}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function buildHeaders(
  config: ApiRequestConfig,
  hasBody: boolean,
  isFormData?: boolean,
): Headers {
  const headers = new Headers(config.headers);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!config.skipAuth) {
    const token = resolveAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (response.status === 204) {
    return null;
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  config: ApiRequestConfig = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const hasBody = config.body !== undefined;
  const isFormData = config.body instanceof FormData;
  const url = buildUrl(path, config.params, baseUrl);

  const fetchInit: RequestInit = {
    method: config.method,
    headers: buildHeaders(config, hasBody, isFormData),
    body: undefined,
    ...("body" in config ? {} : {}),
  };

  if (hasBody) {
    fetchInit.body = isFormData ? (config.body as FormData) : JSON.stringify(config.body);
  }

  const response = await fetch(url, fetchInit);

  const body = await parseResponseBody(response);

  if (
    response.status === 401 &&
    !config.skipUnauthorizedRedirect &&
    unauthorizedHandler
  ) {
    unauthorizedHandler();
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get<T>(path: string, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(path, { ...config, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...config, method: "PATCH", body });
  },

  delete<T>(path: string, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(path, { ...config, method: "DELETE" });
  },
};

export { DEFAULT_BASE_URL };
