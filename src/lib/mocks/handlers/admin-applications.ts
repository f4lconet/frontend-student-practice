import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";
import type { AdminApplication } from "@/lib/api/applications";
import type { SurveyField } from "@/entities/survey-field";

/**
 * Mock-данные для админ-панели «Заявки» (День 8).
 */

const STORAGE_KEY = "mock_admin_applications";

// Survey fields (same as admin-cohorts defaults)
const surveyFields: SurveyField[] = [
  {
    id: "sf-1",
    cohort_id: "cohort-2026",
    label: "ФИО",
    type: "text",
    options: null,
    order: 1,
  },
  {
    id: "sf-2",
    cohort_id: "cohort-2026",
    label: "Группа",
    type: "text",
    options: null,
    order: 2,
  },
  {
    id: "sf-3",
    cohort_id: "cohort-2026",
    label: "Курс",
    type: "select",
    options: ["1", "2", "3", "4"],
    order: 3,
  },
  {
    id: "sf-4",
    cohort_id: "cohort-2026",
    label: "Желаемая роль",
    type: "select",
    options: ["Frontend", "Backend", "Аналитик", "DevOps", "QA"],
    order: 4,
  },
  {
    id: "sf-5",
    cohort_id: "cohort-2026",
    label: "Стек технологий",
    type: "text",
    options: null,
    order: 5,
  },
];

const defaultApplications: AdminApplication[] = [
  {
    id: "app-2026-1",
    user_id: "user-student-1",
    user_name: "Иванов Иван Иванович",
    cohort_id: "cohort-2026",
    cohort_name: "2026",
    status: "pending",
    created_at: "2026-03-01T10:00:00Z",
    review_comment: null,
    role_id: null,
    survey_data: {
      "sf-1": "Иванов Иван Иванович",
      "sf-2": "РИ-123456",
      "sf-3": "3",
      "sf-4": "Frontend",
      "sf-5": "React, TypeScript, Node.js",
    },
  },
  {
    id: "app-2026-2",
    user_id: "user-student-2",
    user_name: "Петров Пётр Петрович",
    cohort_id: "cohort-2026",
    cohort_name: "2026",
    status: "pending",
    created_at: "2026-03-05T14:30:00Z",
    review_comment: null,
    role_id: null,
    survey_data: {
      "sf-1": "Петров Пётр Петрович",
      "sf-2": "РИ-654321",
      "sf-3": "4",
      "sf-4": "Backend",
      "sf-5": "Python, Django, PostgreSQL",
    },
  },
  {
    id: "app-2026-3",
    user_id: "user-student-3",
    user_name: "Сидорова Анна Сергеевна",
    cohort_id: "cohort-2026",
    cohort_name: "2026",
    status: "approved",
    created_at: "2026-02-20T09:15:00Z",
    review_comment: null,
    role_id: "role-1",
    survey_data: {
      "sf-1": "Сидорова Анна Сергеевна",
      "sf-2": "РИ-789012",
      "sf-3": "3",
      "sf-4": "Аналитик",
      "sf-5": "SQL, Excel, Tableau",
    },
  },
  {
    id: "app-2026-4",
    user_id: "user-student-4",
    user_name: "Кузнецов Алексей Дмитриевич",
    cohort_id: "cohort-2026",
    cohort_name: "2026",
    status: "rejected",
    created_at: "2026-01-15T16:45:00Z",
    review_comment: "Недостаточно опыта в разработке",
    role_id: null,
    survey_data: {
      "sf-1": "Кузнецов Алексей Дмитриевич",
      "sf-2": "РИ-345678",
      "sf-3": "2",
      "sf-4": "Frontend",
      "sf-5": "HTML, CSS, немного JS",
    },
  },
];

function loadApplications(cohortId: string): AdminApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, AdminApplication[]>;
      return all[cohortId] ?? [];
    }
  } catch {}
  return [];
}

function saveApplications(
  cohortId: string,
  apps: AdminApplication[],
): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored
      ? (JSON.parse(stored) as Record<string, AdminApplication[]>)
      : {};
    all[cohortId] = apps;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function ensureApplications(cohortId: string): AdminApplication[] {
  const existing = loadApplications(cohortId);
  if (existing.length > 0) return existing;
  const cohortApps = defaultApplications.filter(
    (a) => a.cohort_id === cohortId,
  );
  saveApplications(cohortId, cohortApps);
  return cohortApps;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const adminApplicationsHandlers: HttpHandler[] = [
  // GET /admin/cohorts/:cohortId/applications
  http.get("*/admin/cohorts/:cohortId/applications", async ({ params }) => {
    await delay(300);
    const cohortId = params.cohortId as string;
    const apps = ensureApplications(cohortId);
    return HttpResponse.json(apps);
  }),

  // GET /admin/applications/:applicationId/survey
  http.get(
    "*/admin/applications/:applicationId/survey",
    async ({ params }) => {
      await delay(200);
      const applicationId = params.applicationId as string;

      // Find application in any cohort
      let foundApp: AdminApplication | null = null;
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const all = JSON.parse(
              stored,
            ) as Record<string, AdminApplication[]>;
            for (const apps of Object.values(all)) {
              const app = apps.find((a) => a.id === applicationId);
              if (app) {
                foundApp = app;
                break;
              }
            }
          }
        } catch {}
      }

      if (!foundApp) {
        // Fallback to default data
        foundApp =
          defaultApplications.find((a) => a.id === applicationId) ?? null;
      }

      if (!foundApp) {
        return HttpResponse.json(
          { message: "Заявка не найдена" },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        fields: surveyFields.map((f) => ({
          ...f,
          cohort_id: foundApp!.cohort_id,
        })),
        answers: foundApp.survey_data ?? {},
      });
    },
  ),

  // PATCH /admin/applications/:applicationId/approve
  http.patch(
    "*/admin/applications/:applicationId/approve",
    async ({ params, request }) => {
      await delay(300);
      const applicationId = params.applicationId as string;
      const body = (await request.json()) as { role_id: string };

      if (!body.role_id) {
        return HttpResponse.json(
          { message: "Необходимо указать роль" },
          { status: 400 },
        );
      }

      let updatedApp: AdminApplication | null = null;

      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const all = JSON.parse(
              stored,
            ) as Record<string, AdminApplication[]>;
            for (const cohortId of Object.keys(all)) {
              const idx = all[cohortId].findIndex(
                (a) => a.id === applicationId,
              );
              if (idx !== -1) {
                all[cohortId][idx] = {
                  ...all[cohortId][idx],
                  status: "approved",
                  role_id: body.role_id,
                };
                updatedApp = all[cohortId][idx];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
                break;
              }
            }
          }
        } catch {}
      }

      if (!updatedApp) {
        // Fallback: update default
        const idx = defaultApplications.findIndex(
          (a) => a.id === applicationId,
        );
        if (idx === -1) {
          return HttpResponse.json(
            { message: "Заявка не найдена" },
            { status: 404 },
          );
        }
        defaultApplications[idx] = {
          ...defaultApplications[idx],
          status: "approved",
          role_id: body.role_id,
        };
        updatedApp = defaultApplications[idx];
      }

      return HttpResponse.json(updatedApp);
    },
  ),

  // PATCH /admin/applications/:applicationId/reject
  http.patch(
    "*/admin/applications/:applicationId/reject",
    async ({ params, request }) => {
      await delay(300);
      const applicationId = params.applicationId as string;
      const body = (await request.json()) as { review_comment: string };

      let updatedApp: AdminApplication | null = null;

      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const all = JSON.parse(
              stored,
            ) as Record<string, AdminApplication[]>;
            for (const cohortId of Object.keys(all)) {
              const idx = all[cohortId].findIndex(
                (a) => a.id === applicationId,
              );
              if (idx !== -1) {
                all[cohortId][idx] = {
                  ...all[cohortId][idx],
                  status: "rejected",
                  review_comment: body.review_comment ?? null,
                };
                updatedApp = all[cohortId][idx];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
                break;
              }
            }
          }
        } catch {}
      }

      if (!updatedApp) {
        const idx = defaultApplications.findIndex(
          (a) => a.id === applicationId,
        );
        if (idx === -1) {
          return HttpResponse.json(
            { message: "Заявка не найдена" },
            { status: 404 },
          );
        }
        defaultApplications[idx] = {
          ...defaultApplications[idx],
          status: "rejected",
          review_comment: body.review_comment ?? null,
        };
        updatedApp = defaultApplications[idx];
      }

      return HttpResponse.json(updatedApp);
    },
  ),
];