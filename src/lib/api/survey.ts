import { apiClient } from "./client";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { TestTask } from "@/entities/test-task";
import type { ApplicationStatus } from "@/entities";

export interface SurveyConfigResponse {
  cohort: Cohort;
  fields: SurveyField[];
}

export interface SurveySubmitResponse {
  message: string;
  application_id?: string;
}

/**
 * Получить конфигурацию анкеты для когорты по её slug.
 * GET /api/cohorts/:slug/survey
 */
export function fetchSurveyConfig(slug: string) {
  return apiClient.get<SurveyConfigResponse>(`/cohorts/${slug}/survey`);
}

/**
 * Отправить анкету.
 * POST /api/cohorts/:slug/survey
 *
 * Если не передан skipAuth: true — будет авторизованный запрос (для авторизованных пользователей).
 * Для публичной анкеты (без регистрации) — передаём skipAuth: true.
 */
export function submitSurvey(
  slug: string,
  data: Record<string, string>,
  options?: { skipAuth?: boolean },
) {
  return apiClient.post<SurveySubmitResponse>(
    `/cohorts/${slug}/survey`,
    data,
    { skipAuth: options?.skipAuth ?? false },
  );
}

/**
 * Получить тестовое задание когорты.
 * GET /api/cohorts/:slug/test-task
 */
export function fetchTestTask(slug: string) {
  return apiClient.get<TestTask>(`/cohorts/${slug}/test-task`, {
    skipAuth: true,
  });
}
