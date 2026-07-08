import { apiClient } from "./client";
import type { Application } from "@/entities";

export interface ApplicationsListResponse {
  applications: Application[];
}

export interface PrefillDataResponse {
  data: Record<string, string>;
}

/**
 * Получить список всех заявок текущего пользователя.
 * GET /api/applications
 */
export function fetchApplications() {
  return apiClient.get<ApplicationsListResponse>("/applications");
}

/**
 * Получить prefill-данные из последней заявки для повторной подачи.
 * GET /api/applications/prefill
 */
export function fetchPrefillData() {
  return apiClient.get<PrefillDataResponse>("/applications/prefill");
}
