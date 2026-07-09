import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";

import type {
  StudentDocumentDataResponse,
  DocumentStatusResponse,
  GenerateDocumentResponse,
  UploadReportResponse,
} from "@/lib/api/documents";
import type { StudentDocumentData } from "@/entities";

const STORAGE_KEY_DOC_DATA = "mock_doc_data";
const STORAGE_KEY_DOC_REPORT = "mock_doc_report";

const DEFAULT_DOC_DATA: StudentDocumentData = {
  id: "doc-data-1",
  user_id: "user-student-1",
  cohort_id: "cohort-2026",
  student_fio: "Иванов Иван Иванович",
  group: "РИ-390001",
  direction_code: "09.03.04",
  direction_name: "Программная инженерия",
  program_name: "Разработка и сопровождение программного обеспечения",
  specialty: "Программист",
  practice_topic: "Разработка веб-приложения для организации практики студентов",
  main_stage_tasks:
    "1. Анализ требований к системе\n2. Проектирование архитектуры\n3. Разработка фронтенда\n4. Разработка бэкенда\n5. Тестирование и отладка",
  review_activities: "Участвовал в разработке фронтенда на React",
  review_characteristic: "Показал высокий уровень самостоятельности",
  review_employed: "Стажёр",
  review_next_practice: "Рекомендуется для участия в следующей практике",
  review_employment_offer: "Да, предложена должность стажёра",
  review_suggestions: "Хорошо бы углубить знание TypeScript",
  review_grade: "Отлично",
  report_file_url: null,
  report_admin_approved: false,
};

function loadDocData(): StudentDocumentData {
  if (typeof window === "undefined") return DEFAULT_DOC_DATA;
  const stored = localStorage.getItem(STORAGE_KEY_DOC_DATA);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY_DOC_DATA, JSON.stringify(DEFAULT_DOC_DATA));
  return DEFAULT_DOC_DATA;
}

function saveDocData(data: StudentDocumentData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_DOC_DATA, JSON.stringify(data));
}

function loadReportFileName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_DOC_REPORT);
}

function saveReportFileName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_DOC_REPORT, name);
}

export const documentsHandlers: HttpHandler[] = [
  // GET /api/documents/data
  http.get("*/documents/data", async () => {
    await delay(200);
    const data = loadDocData();
    return HttpResponse.json<StudentDocumentDataResponse>({ data }, { status: 200 });
  }),

  // PATCH /api/documents/data
  http.patch("*/documents/data", async ({ request }) => {
    await delay(300);
    const patch = (await request.json()) as Partial<StudentDocumentData>;
    const current = loadDocData();
    const updated = { ...current, ...patch };
    saveDocData(updated);
    return HttpResponse.json<StudentDocumentDataResponse>({ data: updated }, { status: 200 });
  }),

  // GET /api/documents/status
  http.get("*/documents/status", async () => {
    await delay(150);
    const data = loadDocData();
    const reportFileName = loadReportFileName();

    // ИЗ готова: все поля студента заполнены
    const izRequired = [
      data.student_fio,
      data.group,
      data.direction_code,
      data.direction_name,
      data.program_name,
      data.practice_topic,
      data.main_stage_tasks,
    ];
    const izReady = izRequired.every((v) => v && v.trim().length > 0);

    // Отзыв готов: все review_* поля заполнены админом
    const reviewFields = [
      data.review_activities,
      data.review_characteristic,
      data.review_employed,
      data.review_next_practice,
      data.review_employment_offer,
      data.review_suggestions,
      data.review_grade,
    ];
    const reviewReady = reviewFields.every((v) => v && v.trim().length > 0);

    // Титульный лист готов: загружен отчёт И report_admin_approved === true
    const titlePageReady = !!reportFileName && data.report_admin_approved;

    return HttpResponse.json<DocumentStatusResponse>(
      {
        iz_ready: izReady,
        review_ready: reviewReady,
        title_page_ready: titlePageReady,
      },
      { status: 200 },
    );
  }),

  // POST /api/documents/generate
  http.post("*/documents/generate", async ({ request }) => {
    await delay(1500);
    const body = (await request.json()) as { type: string };
    const typeNames: Record<string, string> = {
      iz: "Индивидуальное задание",
      review: "Отзыв о практике",
      "title-page": "Титульный лист отчёта",
    };

    return HttpResponse.json<GenerateDocumentResponse>(
      {
        download_url: `/mock-documents/${body.type}-${Date.now()}.docx`,
      },
      { status: 200 },
    );
  }),

  // POST /api/documents/report
  http.post("*/documents/report", async ({ request }) => {
    await delay(800);
    const file = (await request.formData())?.get("file") as File | null;
    const fileName = file?.name ?? `report-${Date.now()}.docx`;
    saveReportFileName(fileName);

    return HttpResponse.json<UploadReportResponse>(
      {
        file_url: `/mock-reports/${fileName}`,
      },
      { status: 200 },
    );
  }),
];