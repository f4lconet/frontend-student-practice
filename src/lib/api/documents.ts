import { apiClient } from "./client";

export interface StudentDocumentData {
  id: string;
  userId: string;
  cohortId: string;
  studentFio: string | null;
  group: string | null;
  directionCode: string | null;
  directionName: string | null;
  programName: string | null;
  specialty: string | null;
  practiceTopic: string | null;
  mainStageTasks: string | null;
  reviewActivities: string | null;
  reviewCharacteristic: string | null;
  reviewEmployed: string | null;
  reviewNextPractice: string | null;
  reviewEmploymentOffer: string | null;
  reviewSuggestions: string | null;
  reviewGrade: string | null;
  reportFileUrl: string | null;
  reportAdminApproved: boolean;
}

export interface AdminStudentDocumentInfo {
  userId: string;
  userName: string;
  studentFio: string | null;
  studentDataComplete: boolean;
  reviewComplete: boolean;
  reportFileUrl: string | null;
  reportAdminApproved: boolean;
}

// ---- Student-facing API ----

/**
 * Получить или создать документы для заявки.
 * GET /api/documents/my?applicationId=...&cohortId=...
 */
export function fetchMyDocuments(applicationId: string, cohortId: string) {
  return apiClient.get<StudentDocumentData>("/documents/my", {
    params: { applicationId, cohortId },
  });
}

/**
 * Обновить поля документов.
 * PATCH /api/documents/my?cohortId=...
 */
export function updateMyDocuments(cohortId: string, data: Partial<StudentDocumentData>) {
  return apiClient.patch<StudentDocumentData>(`/documents/my?cohortId=${cohortId}`, data);
}

/**
 * Загрузить отчёт.
 * POST /api/documents/my/report?cohortId=...
 */
export function uploadReport(cohortId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{ fileUrl: string }>(
    `/documents/my/report?cohortId=${cohortId}`,
    formData,
    { headers: {} },
  );
}

/**
 * Сгенерировать документ.
 * GET /api/documents/my/:type/generate?cohortId=...
 * Ответ — бинарный .docx файл.
 */
export function generateDocument(type: "individual-task" | "title-page" | "review", cohortId: string) {
  return apiClient.get<Blob>(`/documents/my/${type}/generate?cohortId=${cohortId}`, {
    skipAuth: false,
  });
}

// ---- Admin API ----

/**
 * Получить сводку по документам практикантов когорты.
 * GET /api/admin/cohorts/:cohortId/documents-overview
 */
export function fetchAdminDocumentsOverview(cohortId: string): Promise<AdminStudentDocumentInfo[]> {
  return apiClient.get<AdminStudentDocumentInfo[]>(
    `/admin/cohorts/${cohortId}/documents-overview`,
  );
}

/**
 * Заполнить отзыв (админ).
 * PATCH /api/admin/documents/:userId/:cohortId/review
 * Тело запроса: review_* поля (см. IMPORTANT — тело не описано в спецификации)
 */
export function saveAdminReview(
  userId: string,
  cohortId: string,
  data: {
    reviewActivities?: string;
    reviewCharacteristic?: string;
    reviewEmployed?: string;
    reviewNextPractice?: string;
    reviewEmploymentOffer?: string;
    reviewSuggestions?: string;
    reviewGrade?: string;
  },
): Promise<void> {
  return apiClient.patch<void>(
    `/admin/documents/${userId}/${cohortId}/review`,
    data,
  );
}

/**
 * Подтвердить отчёт (админ).
 * PATCH /api/admin/documents/:userId/:cohortId/approve-report
 */
export function approveReport(
  userId: string,
  cohortId: string,
  approved: boolean,
): Promise<void> {
  return apiClient.patch<void>(
    `/admin/documents/${userId}/${cohortId}/approve-report`,
    { approved },
  );
}