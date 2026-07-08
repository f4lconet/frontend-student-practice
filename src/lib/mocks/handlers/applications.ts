import { http, HttpResponse } from "msw";
import type { HttpHandler } from "msw";

import type { ApplicationsListResponse, PrefillDataResponse } from "@/lib/api/applications";
import type { Application } from "@/entities";

const STORAGE_KEY_APPLICATIONS = "mock_applications";

/** Получить заявки из localStorage */
function loadApplications(): Application[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/** Сохранить заявки в localStorage */
function saveApplications(apps: Application[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
}

/** Предзаполненные данные для повторной подачи */
const MOCK_PREFILL: Record<string, string> = {
  fio: "Иванов Иван Иванович",
  email: "student@test.ru",
  phone: "+7 (999) 123-45-67",
  university: "УрФУ им. Б.Н. Ельцина",
  direction: "Программная инженерия",
  course: "3",
};

/** Тестовые заявки для student@test.ru */
const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    user_id: "user-student-1",
    cohort_id: "cohort-2026",
    cohort_name: "2026",
    status: "approved",
    created_at: "2026-03-01T10:00:00Z",
    review_comment: null,
    role_id: "role-frontend",
  },
  {
    id: "app-2",
    user_id: "user-student-1",
    cohort_id: "cohort-2025",
    cohort_name: "2025",
    status: "rejected",
    created_at: "2025-02-15T10:00:00Z",
    review_comment: "Недостаточно опыта в разработке на указанном стеке",
    role_id: null,
  },
];

/** Инициализировать тестовые заявки при первом запуске */
function ensureMockApplications(): Application[] {
  if (typeof window === "undefined") return MOCK_APPLICATIONS;

  const stored = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
  if (!stored) {
    saveApplications(MOCK_APPLICATIONS);
    return MOCK_APPLICATIONS;
  }

  return loadApplications();
}

export const applicationsHandlers: HttpHandler[] = [
  // GET /api/applications
  http.get("*/api/applications", async ({ request }) => {
    const users = ensureMockApplications();

    return HttpResponse.json<ApplicationsListResponse>(
      { applications: users },
      { status: 200 },
    );
  }),

  // GET /api/applications/prefill
  http.get("*/api/applications/prefill", async () => {
    return HttpResponse.json<PrefillDataResponse>(
      { data: MOCK_PREFILL },
      { status: 200 },
    );
  }),
];