import { apiClient } from "./client";
import type { Application } from "@/entities";
import type { SurveyField } from "@/entities/survey-field";

export interface ApplicationsListResponse {
  applications: Application[];
}

export interface PrefillDataResponse {
  data: Record<string, string>;
}

export interface AdminApplication extends Application {
  user_name?: string;
  survey_data?: Record<string, string>;
}

export interface AdminApplicationsResponse {
  applications: AdminApplication[];
}

export interface ApplicationSurveyResponse {
  fields: SurveyField[];
  answers: Record<string, string>;
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

// ---- Admin API ----

/**
 * Получить список заявок для когорты (админ).
 * GET /api/admin/cohorts/:cohortId/applications
 */
export function fetchAdminApplications(
  cohortId: string,
): Promise<AdminApplication[]> {
  return apiClient.get<AdminApplication[]>(
    `/admin/cohorts/${cohortId}/applications`,
  );
}

/**
 * Получить анкету заявки (админ, read-only).
 * GET /api/admin/applications/:applicationId/survey
 */
export function fetchApplicationSurvey(
  applicationId: string,
): Promise<ApplicationSurveyResponse> {
  return apiClient.get<ApplicationSurveyResponse>(
    `/admin/applications/${applicationId}/survey`,
  );
}

/**
 * Одобрить заявку с назначением роли.
 * PATCH /api/admin/applications/:applicationId/approve
 */
export function approveApplication(
  applicationId: string,
  roleId: string,
): Promise<Application> {
  return apiClient.patch<Application>(
    `/admin/applications/${applicationId}/approve`,
    { role_id: roleId },
  );
}

/**
 * Отклонить заявку с комментарием.
 * PATCH /api/admin/applications/:applicationId/reject
 */
export function rejectApplication(
  applicationId: string,
  comment: string,
): Promise<Application> {
  return apiClient.patch<Application>(
    `/admin/applications/${applicationId}/reject`,
    { review_comment: comment },
  );
}