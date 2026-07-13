import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";
import type {
  AdminStudentDocumentInfo,
  AdminReviewData,
} from "@/lib/api/documents";

const STORAGE_KEY = "mock_admin_documents_students";
const STORAGE_KEY_REVIEWS = "mock_admin_documents_reviews";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultStudents: AdminStudentDocumentInfo[] = [
  {
    user_id: "user-student-1",
    user_name: "Иванов Иван Иванович",
    student_fio: "Иванов Иван Иванович",
    student_data_complete: true,
    review_complete: false,
    report_file_url: "https://example.com/reports/report-ivanov.docx",
    report_admin_approved: false,
  },
  {
    user_id: "user-student-3",
    user_name: "Сидорова Анна Сергеевна",
    student_fio: "Сидорова Анна Сергеевна",
    student_data_complete: true,
    review_complete: true,
    report_file_url: null,
    report_admin_approved: true,
  },
  {
    user_id: "user-student-5",
    user_name: "Попов Дмитрий Алексеевич",
    student_fio: "Попов Дмитрий Алексеевич",
    student_data_complete: false,
    review_complete: false,
    report_file_url: null,
    report_admin_approved: false,
  },
];

const defaultReview: AdminReviewData = {
  review_activities: "Занимался разработкой фронтенда на React",
  review_characteristic: "Проявил себя как ответственный и инициативный сотрудник",
  review_employed: "да",
  review_next_practice: "Рекомендую продолжать практику в этом же направлении",
  review_employment_offer: "да",
  review_suggestions: "Улучшить знание TypeScript",
  review_grade: "5",
};

function loadStudents(cohortId: string): AdminStudentDocumentInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, AdminStudentDocumentInfo[]>;
      return all[cohortId] ?? [];
    }
  } catch {}
  return [];
}

function saveStudents(cohortId: string, students: AdminStudentDocumentInfo[]): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored
      ? (JSON.parse(stored) as Record<string, AdminStudentDocumentInfo[]>)
      : {};
    all[cohortId] = students;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function ensureStudents(cohortId: string): AdminStudentDocumentInfo[] {
  const existing = loadStudents(cohortId);
  if (existing.length > 0) return existing;
  const cohortStudents = defaultStudents.map((s) => ({ ...s }));
  saveStudents(cohortId, cohortStudents);
  return cohortStudents;
}

function loadReviews(cohortId: string): Record<string, AdminReviewData> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, Record<string, AdminReviewData>>;
      return all[cohortId] ?? {};
    }
  } catch {}
  return {};
}

function saveReview(
  cohortId: string,
  userId: string,
  data: Partial<AdminReviewData>,
): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
    const all = stored
      ? (JSON.parse(stored) as Record<string, Record<string, AdminReviewData>>)
      : {};
    if (!all[cohortId]) all[cohortId] = {};
    all[cohortId][userId] = { ...defaultReview, ...all[cohortId][userId], ...data };
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(all));
  } catch {}
}

function getReview(
  cohortId: string,
  userId: string,
): AdminReviewData {
  const reviews = loadReviews(cohortId);
  return reviews[userId] ?? defaultReview;
}

export const adminDocumentsHandlers: HttpHandler[] = [
  // GET /admin/cohorts/:cohortId/students
  http.get("*/admin/cohorts/:cohortId/students", async ({ params }) => {
    await delay(300);
    const cohortId = params.cohortId as string;
    const students = ensureStudents(cohortId);
    return HttpResponse.json(students);
  }),

  // GET /admin/cohorts/:cohortId/students/:userId/review
  http.get(
    "*/admin/cohorts/:cohortId/students/:userId/review",
    async ({ params }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const userId = params.userId as string;
      const review = getReview(cohortId, userId);
      return HttpResponse.json(review);
    },
  ),

  // PATCH /admin/cohorts/:cohortId/students/:userId/review
  http.patch(
    "*/admin/cohorts/:cohortId/students/:userId/review",
    async ({ params, request }) => {
      await delay(300);
      const cohortId = params.cohortId as string;
      const userId = params.userId as string;
      const body = (await request.json()) as Partial<AdminReviewData>;

      saveReview(cohortId, userId, body);

      // Update student review_complete flag
      const students = loadStudents(cohortId);
      const updatedReview = getReview(cohortId, userId);
      const allFieldsFilled = Object.values(updatedReview).every(
        (v) => v !== null && v !== undefined && v !== "",
      );
      const idx = students.findIndex((s) => s.user_id === userId);
      if (idx !== -1) {
        students[idx].review_complete = allFieldsFilled;
        saveStudents(cohortId, students);
      }

      return HttpResponse.json(updatedReview);
    },
  ),

  // PATCH /admin/cohorts/:cohortId/students/:userId/report-approve
  http.patch(
    "*/admin/cohorts/:cohortId/students/:userId/report-approve",
    async ({ params, request }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const userId = params.userId as string;
      const body = (await request.json()) as { approved: boolean };

      const students = loadStudents(cohortId);
      const idx = students.findIndex((s) => s.user_id === userId);
      if (idx === -1) {
        return HttpResponse.json(
          { message: "Студент не найден" },
          { status: 404 },
        );
      }

      students[idx].report_admin_approved = body.approved;
      saveStudents(cohortId, students);

      return HttpResponse.json({ report_admin_approved: body.approved });
    },
  ),
];