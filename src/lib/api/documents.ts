import { apiClient } from "./client";
import type { StudentDocumentData } from "@/entities";

export interface StudentDocumentDataResponse {
  data: StudentDocumentData;
}

export interface DocumentStatusResponse {
  iz_ready: boolean;
  review_ready: boolean;
  title_page_ready: boolean;
}

export interface GenerateDocumentResponse {
  download_url: string;
}

export interface UploadReportResponse {
  file_url: string;
}

// ---- Student-facing API ----

/**
 * Получить данные документов текущего пользователя для активной когорты.
 * GET /api/documents/data
 */
export function fetchDocumentData() {
  return apiClient.get<StudentDocumentDataResponse>("/documents/data");
}

/**
 * Сохранить данные документов.
 * PATCH /api/documents/data
 */
export function saveDocumentData(data: Partial<StudentDocumentData>) {
  return apiClient.patch<StudentDocumentDataResponse>("/documents/data", data);
}

/**
 * Получить статусы готовности документов (ИЗ, Отзыв, Титульный лист).
 * GET /api/documents/status
 */
export function fetchDocumentStatus() {
  return apiClient.get<DocumentStatusResponse>("/documents/status");
}

/**
 * Сформировать документ (ИЗ, Отзыв или Титульный лист).
 * POST /api/documents/generate
 */
export function generateDocument(type: "iz" | "review" | "title-page") {
  return apiClient.post<GenerateDocumentResponse>("/documents/generate", {
    type,
  });
}

/**
 * Загрузить файл отчёта.
 * POST /api/documents/report
 */
export function uploadReport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post<UploadReportResponse>("/documents/report", formData, {
    headers: {},
  });
}

// ---- Admin API ----

export interface AdminStudentDocumentInfo {
  user_id: string;
  user_name: string;
  student_fio: string | null;
  /** Все поля student_* заполнены */
  student_data_complete: boolean;
  /** Все review_* поля заполнены */
  review_complete: boolean;
  report_file_url: string | null;
  report_admin_approved: boolean;
}

export interface AdminReviewData {
  review_activities: string;
  review_characteristic: string;
  review_employed: string;
  review_next_practice: string;
  review_employment_offer: string;
  review_suggestions: string;
  review_grade: string;
}

/**
 * Получить список практикантов когорты с одобренными заявками и статусами документов.
 * GET /admin/cohorts/:cohortId/students
 */
export function fetchAdminStudents(
  cohortId: string,
): Promise<AdminStudentDocumentInfo[]> {
  return apiClient.get<AdminStudentDocumentInfo[]>(
    `/admin/cohorts/${cohortId}/students`,
  );
}

/**
 * Получить данные отзыва по студенту.
 * GET /admin/cohorts/:cohortId/students/:userId/review
 */
export function fetchStudentReview(
  cohortId: string,
  userId: string,
): Promise<AdminReviewData> {
  return apiClient.get<AdminReviewData>(
    `/admin/cohorts/${cohortId}/students/${userId}/review`,
  );
}

/**
 * Сохранить отзыв по студенту.
 * PATCH /admin/cohorts/:cohortId/students/:userId/review
 */
export function saveStudentReview(
  cohortId: string,
  userId: string,
  data: Partial<AdminReviewData>,
): Promise<AdminReviewData> {
  return apiClient.patch<AdminReviewData>(
    `/admin/cohorts/${cohortId}/students/${userId}/review`,
    data,
  );
}

/**
 * Установить статус report_admin_approved.
 * PATCH /admin/cohorts/:cohortId/students/:userId/report-approve
 */
export function approveStudentReport(
  cohortId: string,
  userId: string,
  approved: boolean,
): Promise<{ report_admin_approved: boolean }> {
  return apiClient.patch<{ report_admin_approved: boolean }>(
    `/admin/cohorts/${cohortId}/students/${userId}/report-approve`,
    { approved },
  );
}