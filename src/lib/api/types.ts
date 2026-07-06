export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestConfig extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Пропустить автоматическую подстановку JWT (День 3) */
  skipAuth?: boolean;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}
