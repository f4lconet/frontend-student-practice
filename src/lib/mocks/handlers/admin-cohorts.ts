import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";
import type { Cohort } from "@/entities/cohort";
import type { SurveyField } from "@/entities/survey-field";
import type { CohortRole } from "@/entities/cohort-role";
import type { TestTask } from "@/entities/test-task";

// ---- Mock data ----

const now = new Date();
const fmt = (d: Date) => d.toISOString();

const cohorts: Cohort[] = [
  {
    id: "cohort-2025",
    name: "2025",
    application_start: fmt(new Date(2025, 0, 1)),
    application_end: fmt(new Date(2025, 5, 1)),
    practice_start: fmt(new Date(2025, 5, 1)),
    practice_end: fmt(new Date(2025, 7, 31)),
  },
  {
    id: "cohort-2026",
    name: "2026",
    application_start: fmt(new Date(2026, 0, 1)),
    application_end: fmt(new Date(2026, 11, 31)),
    practice_start: fmt(new Date(2027, 5, 1)),
    practice_end: fmt(new Date(2027, 7, 31)),
  },
];

const defaultSurveyFields: SurveyField[] = [
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
  {
    id: "sf-6",
    cohort_id: "cohort-2026",
    label: "Расскажите о себе",
    type: "text",
    options: null,
    order: 6,
  },
  {
    id: "sf-7",
    cohort_id: "cohort-2026",
    label: "Откуда узнали о практике",
    type: "select",
    options: ["От преподавателя", "Соцсети", "От знакомых", "Другое"],
    order: 7,
  },
  {
    id: "sf-8",
    cohort_id: "cohort-2026",
    label: "Контактный телефон",
    type: "text",
    options: null,
    order: 8,
  },
];

// Survey fields per cohort (cloned from defaults for new cohorts)
const surveyFieldsByCohort: Record<string, SurveyField[]> = {
  "cohort-2026": [...defaultSurveyFields.map((f) => ({ ...f }))],
  "cohort-2025": [
    {
      id: "sf-cohort-2025-1",
      cohort_id: "cohort-2025",
      label: "ФИО",
      type: "text",
      options: null,
      order: 1,
    },
    {
      id: "sf-cohort-2025-2",
      cohort_id: "cohort-2025",
      label: "Группа",
      type: "text",
      options: null,
      order: 2,
    },
  ],
};

const rolesByCohort: Record<string, CohortRole[]> = {
  "cohort-2026": [
    { id: "role-1", cohort_id: "cohort-2026", name: "Frontend" },
    { id: "role-2", cohort_id: "cohort-2026", name: "Backend" },
    { id: "role-3", cohort_id: "cohort-2026", name: "Аналитик" },
  ],
  "cohort-2025": [
    { id: "role-cohort-2025-1", cohort_id: "cohort-2025", name: "Frontend" },
    { id: "role-cohort-2025-2", cohort_id: "cohort-2025", name: "Backend" },
  ],
};

const testTasksByCohort: Record<string, TestTask> = {
  "cohort-2026": {
    id: "tt-2026",
    cohort_id: "cohort-2026",
    content:
      "## Тестовое задание\n\nРеализуйте небольшое веб-приложение на выбранном стеке:\n\n1. Создайте простое CRUD-приложение.\n2. Используйте выбранный язык программирования и фреймворк.\n3. Код опубликуйте на GitHub.\n4. В README опишите запуск.",
    published_at: now.toISOString(),
  },
  "cohort-2025": {
    id: "tt-2025",
    cohort_id: "cohort-2025",
    content: "## Тестовое задание\n\nЗадание пока не опубликовано.",
    published_at: null,
  },
};

// Helpers
function copySurveyFields(sourceCohortId: string, targetCohortId: string): SurveyField[] {
  const source = surveyFieldsByCohort[sourceCohortId];
  if (!source || source.length === 0) return [];

  return source.map((f, i) => ({
    ...f,
    id: `sf-${targetCohortId}-${i + 1}`,
    cohort_id: targetCohortId,
  }));
}

function getLastCohortId(): string | null {
  if (cohorts.length === 0) return null;
  return cohorts[cohorts.length - 1]?.id ?? null;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const adminCohortsHandlers: HttpHandler[] = [
  // ---- Cohorts CRUD ----

  // GET /admin/cohorts
  http.get("*/admin/cohorts", async () => {
    await delay(300);
    return HttpResponse.json(cohorts);
  }),

  // GET /admin/cohorts/:id
  http.get("*/admin/cohorts/:id", async ({ params }) => {
    await delay(200);
    const cohort = cohorts.find((c) => c.id === params.id);
    if (!cohort) {
      return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
    }
    return HttpResponse.json(cohort);
  }),

  // POST /admin/cohorts — создать когорту
  http.post("*/admin/cohorts", async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Omit<Cohort, "id">;
    const newId = generateId("cohort");
    const newCohort: Cohort = { id: newId, ...body };
    cohorts.push(newCohort);

    // Копировать поля анкеты из последней существующей когорты
    const lastCohortId = getLastCohortId();
    if (lastCohortId && lastCohortId !== newId) {
      const prevCohort = cohorts.slice(-2, -1)[0];
      if (prevCohort) {
        surveyFieldsByCohort[newId] = copySurveyFields(prevCohort.id, newId);
      } else {
        surveyFieldsByCohort[newId] = [];
      }
    } else {
      surveyFieldsByCohort[newId] = [];
    }

    rolesByCohort[newId] = [];
    testTasksByCohort[newId] = {
      id: generateId("tt"),
      cohort_id: newId,
      content: "",
      published_at: null,
    };

    return HttpResponse.json(newCohort, { status: 201 });
  }),

  // PATCH /admin/cohorts/:id
  http.patch("*/admin/cohorts/:id", async ({ params, request }) => {
    await delay(300);
    const idx = cohorts.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
    }
    const body = (await request.json()) as Partial<Cohort>;
    cohorts[idx] = { ...cohorts[idx], ...body };
    return HttpResponse.json(cohorts[idx]);
  }),

  // DELETE /admin/cohorts/:id
  http.delete("*/admin/cohorts/:id", async ({ params }) => {
    await delay(300);
    const idx = cohorts.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
    }
    cohorts.splice(idx, 1);
    delete surveyFieldsByCohort[params.id as string];
    delete rolesByCohort[params.id as string];
    delete testTasksByCohort[params.id as string];
    return HttpResponse.json(null, { status: 204 });
  }),

  // ---- Survey Fields CRUD ----

  // GET /admin/cohorts/:cohortId/survey-fields
  http.get("*/admin/cohorts/:cohortId/survey-fields", async ({ params }) => {
    await delay(200);
    const fields = surveyFieldsByCohort[params.cohortId as string] ?? [];
    return HttpResponse.json(fields);
  }),

  // POST /admin/cohorts/:cohortId/survey-fields
  http.post("*/admin/cohorts/:cohortId/survey-fields", async ({ params, request }) => {
    await delay(300);
    const body = (await request.json()) as Omit<SurveyField, "id" | "cohort_id">;
    const cohortId = params.cohortId as string;
    const fields = surveyFieldsByCohort[cohortId] ?? [];
    const maxOrder = fields.reduce((max, f) => Math.max(max, f.order), 0);
    const newField: SurveyField = {
      id: generateId("sf"),
      cohort_id: cohortId,
      ...body,
      order: body.order ?? maxOrder + 1,
    };
    fields.push(newField);
    surveyFieldsByCohort[cohortId] = fields;
    return HttpResponse.json(newField, { status: 201 });
  }),

  // PATCH /admin/cohorts/:cohortId/survey-fields/:fieldId
  http.patch(
    "*/admin/cohorts/:cohortId/survey-fields/:fieldId",
    async ({ params, request }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const fieldId = params.fieldId as string;
      const fields = surveyFieldsByCohort[cohortId] ?? [];
      const idx = fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) {
        return HttpResponse.json({ message: "Поле не найдено" }, { status: 404 });
      }
      const body = (await request.json()) as Partial<Omit<SurveyField, "id" | "cohort_id">>;
      fields[idx] = { ...fields[idx], ...body };
      return HttpResponse.json(fields[idx]);
    },
  ),

  // DELETE /admin/cohorts/:cohortId/survey-fields/:fieldId
  http.delete(
    "*/admin/cohorts/:cohortId/survey-fields/:fieldId",
    async ({ params }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const fieldId = params.fieldId as string;
      const fields = surveyFieldsByCohort[cohortId] ?? [];
      const idx = fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) {
        return HttpResponse.json({ message: "Поле не найдено" }, { status: 404 });
      }
      fields.splice(idx, 1);
      // Re-order remaining fields
      fields.forEach((f, i) => {
        f.order = i + 1;
      });
      return HttpResponse.json(null, { status: 204 });
    },
  ),

  // PATCH /admin/cohorts/:cohortId/survey-fields/reorder
  http.patch(
    "*/admin/cohorts/:cohortId/survey-fields/reorder",
    async ({ params, request }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const body = (await request.json()) as { fieldIds: string[] };
      const fields = surveyFieldsByCohort[cohortId] ?? [];
      const reordered: SurveyField[] = [];
      for (let i = 0; i < body.fieldIds.length; i++) {
        const field = fields.find((f) => f.id === body.fieldIds[i]);
        if (field) {
          reordered.push({ ...field, order: i + 1 });
        }
      }
      // Add any fields not in the reorder list
      fields.forEach((f) => {
        if (!reordered.find((r) => r.id === f.id)) {
          reordered.push({ ...f, order: reordered.length + 1 });
        }
      });
      surveyFieldsByCohort[cohortId] = reordered;
      return HttpResponse.json(reordered);
    },
  ),

  // ---- Cohort Roles CRUD ----

  // GET /admin/cohorts/:cohortId/roles
  http.get("*/admin/cohorts/:cohortId/roles", async ({ params }) => {
    await delay(200);
    const roles = rolesByCohort[params.cohortId as string] ?? [];
    return HttpResponse.json(roles);
  }),

  // POST /admin/cohorts/:cohortId/roles
  http.post("*/admin/cohorts/:cohortId/roles", async ({ params, request }) => {
    await delay(300);
    const cohortId = params.cohortId as string;
    const body = (await request.json()) as Omit<CohortRole, "id" | "cohort_id">;
    const newRole: CohortRole = {
      id: generateId("role"),
      cohort_id: cohortId,
      name: body.name,
    };
    const roles = rolesByCohort[cohortId] ?? [];
    roles.push(newRole);
    rolesByCohort[cohortId] = roles;
    return HttpResponse.json(newRole, { status: 201 });
  }),

  // DELETE /admin/cohorts/:cohortId/roles/:roleId
  http.delete(
    "*/admin/cohorts/:cohortId/roles/:roleId",
    async ({ params }) => {
      await delay(200);
      const cohortId = params.cohortId as string;
      const roleId = params.roleId as string;
      const roles = rolesByCohort[cohortId] ?? [];
      const idx = roles.findIndex((r) => r.id === roleId);
      if (idx === -1) {
        return HttpResponse.json({ message: "Роль не найдена" }, { status: 404 });
      }
      roles.splice(idx, 1);
      return HttpResponse.json(null, { status: 204 });
    },
  ),

  // ---- Test Task ----

  // GET /admin/cohorts/:cohortId/test-task
  http.get("*/admin/cohorts/:cohortId/test-task", async ({ params }) => {
    await delay(200);
    const tt = testTasksByCohort[params.cohortId as string];
    if (!tt) {
      return HttpResponse.json(
        { message: "Тестовое задание не найдено" },
        { status: 404 },
      );
    }
    return HttpResponse.json(tt);
  }),

  // PATCH /admin/cohorts/:cohortId/test-task
  http.patch("*/admin/cohorts/:cohortId/test-task", async ({ params, request }) => {
    await delay(300);
    const cohortId = params.cohortId as string;
    const tt = testTasksByCohort[cohortId];
    if (!tt) {
      return HttpResponse.json(
        { message: "Тестовое задание не найдено" },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<Pick<TestTask, "content">>;
    if (body.content !== undefined) {
      tt.content = body.content;
    }
    return HttpResponse.json(tt);
  }),

  // POST /admin/cohorts/:cohortId/test-task/publish
  http.post("*/admin/cohorts/:cohortId/test-task/publish", async ({ params }) => {
    await delay(300);
    const cohortId = params.cohortId as string;
    const tt = testTasksByCohort[cohortId];
    if (!tt) {
      return HttpResponse.json(
        { message: "Тестовое задание не найдено" },
        { status: 404 },
      );
    }
    tt.published_at = new Date().toISOString();
    return HttpResponse.json(tt);
  }),
];