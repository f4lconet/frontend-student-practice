import { apiClient } from "./client";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { CohortRole } from "@/entities/cohort-role";
import type { TestTask } from "@/entities/test-task";

// ---- Cohorts ----

export function fetchCohorts(): Promise<Cohort[]> {
  return apiClient.get<Cohort[]>("/admin/cohorts");
}

export function fetchCohort(id: string): Promise<Cohort> {
  return apiClient.get<Cohort>(`/admin/cohorts/${id}`);
}

export function createCohort(data: Omit<Cohort, "id">): Promise<Cohort> {
  return apiClient.post<Cohort>("/admin/cohorts", data);
}

export function updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort> {
  return apiClient.patch<Cohort>(`/admin/cohorts/${id}`, data);
}

export function deleteCohort(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/cohorts/${id}`);
}

// ---- Survey Fields ----

export function fetchSurveyFields(cohortId: string): Promise<SurveyField[]> {
  return apiClient.get<SurveyField[]>(`/admin/cohorts/${cohortId}/survey-fields`);
}

export function createSurveyField(
  cohortId: string,
  data: Omit<SurveyField, "id" | "cohort_id" | "order"> & { order?: number },
): Promise<SurveyField> {
  return apiClient.post<SurveyField>(`/admin/cohorts/${cohortId}/survey-fields`, data);
}

export function updateSurveyField(
  cohortId: string,
  fieldId: string,
  data: Partial<Omit<SurveyField, "id" | "cohort_id">>,
): Promise<SurveyField> {
  return apiClient.patch<SurveyField>(
    `/admin/cohorts/${cohortId}/survey-fields/${fieldId}`,
    data,
  );
}

export function deleteSurveyField(cohortId: string, fieldId: string): Promise<void> {
  return apiClient.delete<void>(
    `/admin/cohorts/${cohortId}/survey-fields/${fieldId}`,
  );
}

export function reorderSurveyFields(
  cohortId: string,
  fieldIds: string[],
): Promise<SurveyField[]> {
  return apiClient.patch<SurveyField[]>(
    `/admin/cohorts/${cohortId}/survey-fields/reorder`,
    { fieldIds },
  );
}

// ---- Cohort Roles ----

export function fetchCohortRoles(cohortId: string): Promise<CohortRole[]> {
  return apiClient.get<CohortRole[]>(`/admin/cohorts/${cohortId}/roles`);
}

export function createCohortRole(
  cohortId: string,
  data: Omit<CohortRole, "id" | "cohort_id">,
): Promise<CohortRole> {
  return apiClient.post<CohortRole>(`/admin/cohorts/${cohortId}/roles`, data);
}

export function deleteCohortRole(cohortId: string, roleId: string): Promise<void> {
  return apiClient.delete<void>(`/admin/cohorts/${cohortId}/roles/${roleId}`);
}

// ---- Test Task ----

export function fetchTestTask(cohortId: string): Promise<TestTask> {
  return apiClient.get<TestTask>(`/admin/cohorts/${cohortId}/test-task`);
}

export function updateTestTask(
  cohortId: string,
  data: Partial<Pick<TestTask, "content">>,
): Promise<TestTask> {
  return apiClient.patch<TestTask>(`/admin/cohorts/${cohortId}/test-task`, data);
}

export function publishTestTask(cohortId: string): Promise<TestTask> {
  return apiClient.post<TestTask>(`/admin/cohorts/${cohortId}/test-task/publish`);
}