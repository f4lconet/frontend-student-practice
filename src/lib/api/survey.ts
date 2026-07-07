import { apiClient } from "./client";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { TestTask } from "@/entities/test-task";

export interface SurveyConfigResponse {
  cohort: Cohort;
  fields: SurveyField[];
}

export interface SurveySubmitResponse {
  message: string;
}

/**
 * Получить конфигурацию анкеты для когорты по её slug.
 * GET /api/cohorts/:slug/survey
 */
export function fetchSurveyConfig(slug: string) {
  return apiClient.get<SurveyConfigResponse>(`/api/cohorts/${slug}/survey`);
}

/**
 * Отправить анкету (без авторизации).
 * POST /api/cohorts/:slug/survey
 */
export function submitSurvey(slug: string, data: Record<string, string>) {
  return apiClient.post<SurveySubmitResponse>(`/api/cohorts/${slug}/survey`, data, {
    skipAuth: true,
  });
}

/**
 * Получить тестовое задание когорты.
 * GET /api/cohorts/:slug/test-task
 */
export function fetchTestTask(slug: string) {
  return apiClient.get<TestTask>(`/api/cohorts/${slug}/test-task`, {
    skipAuth: true,
  });
}