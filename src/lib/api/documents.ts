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
export function saveDocumentData(
  data: Partial<StudentDocumentData>,
) {
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
    // Не устанавливаем Content-Type — браузер сам выставит multipart/form-data
    headers: {},
  });
}