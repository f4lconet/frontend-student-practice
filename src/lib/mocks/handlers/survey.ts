import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";
import type { SurveyField } from "@/entities/survey-field";
import type { Cohort } from "@/entities/cohort";
import type { TestTask } from "@/entities/test-task";

/**
 * Mock-данные для публичной анкеты.
 *
 * Создано две когорты:
 * - "2026" — активна, приём заявок открыт, тестовое задание опубликовано
 * - "2025" — архивная, приём заявок закрыт (проверка unavailable-кейса)
 */

const now = new Date();
const fmt = (d: Date) => d.toISOString();

const activeCohort: Cohort = {
  id: "cohort-2026",
  name: "2026",
  application_start: fmt(new Date(now.getFullYear(), 0, 1)),
  application_end: fmt(new Date(now.getFullYear(), 11, 31)),
  practice_start: fmt(new Date(now.getFullYear() + 1, 5, 1)),
  practice_end: fmt(new Date(now.getFullYear() + 1, 7, 31)),
};

const pastCohort: Cohort = {
  id: "cohort-2025",
  name: "2025",
  application_start: fmt(new Date(now.getFullYear() - 1, 0, 1)),
  application_end: fmt(new Date(now.getFullYear() - 1, 5, 1)),
  practice_start: fmt(new Date(now.getFullYear() - 1, 5, 1)),
  practice_end: fmt(new Date(now.getFullYear() - 1, 7, 31)),
};

const surveyFields: SurveyField[] = [
  {
    id: "sf-1",
    cohort_id: activeCohort.id,
    label: "ФИО",
    type: "text",
    options: null,
    order: 1,
  },
  {
    id: "sf-2",
    cohort_id: activeCohort.id,
    label: "Группа",
    type: "text",
    options: null,
    order: 2,
  },
  {
    id: "sf-3",
    cohort_id: activeCohort.id,
    label: "Курс",
    type: "select",
    options: ["1", "2", "3", "4"],
    order: 3,
  },
  {
    id: "sf-4",
    cohort_id: activeCohort.id,
    label: "Желаемая роль",
    type: "select",
    options: ["Frontend", "Backend", "Аналитик", "DevOps", "QA"],
    order: 4,
  },
  {
    id: "sf-5",
    cohort_id: activeCohort.id,
    label: "Стек технологий",
    type: "text",
    options: null,
    order: 5,
  },
  {
    id: "sf-6",
    cohort_id: activeCohort.id,
    label: "Расскажите о себе",
    type: "text",
    options: null,
    order: 6,
  },
  {
    id: "sf-7",
    cohort_id: activeCohort.id,
    label: "Откуда узнали о практике",
    type: "select",
    options: ["От преподавателя", "Соцсети", "От знакомых", "Другое"],
    order: 7,
  },
  {
    id: "sf-8",
    cohort_id: activeCohort.id,
    label: "Контактный телефон",
    type: "text",
    options: null,
    order: 8,
  },
];

const publishedTestTask: TestTask = {
  id: "tt-2026",
  cohort_id: activeCohort.id,
  content:
    "## Тестовое задание\n\n" +
    "Реализуйте небольшое веб-приложение на выбранном стеке:\n\n" +
    "1. Создайте простое CRUD-приложение для управления списком задач (Todo List).\n" +
    "2. Используйте выбранный язык программирования и фреймворк.\n" +
    "3. Код должен быть опубликован на GitHub.\n" +
    "4. В README опишите, как запустить проект.\n\n" +
    "**Срок сдачи:** через 2 недели после публикации задания.",
  published_at: new Date().toISOString(),
};

const unpublishedTestTask: TestTask = {
  id: "tt-2026-draft",
  cohort_id: activeCohort.id,
  content:
    "## Тестовое задание\n\nЗадание пока не опубликовано.",
  published_at: null,
};

// Хранилище отправленных анкет (в памяти)
const submittedSurveys: Map<string, { cohortSlug: string; data: Record<string, string> }> = new Map();

const cohortSlugToId: Record<string, string> = {
  "2026": activeCohort.id,
  "2025": pastCohort.id,
};

const cohorts: Record<string, Cohort> = {
  "2026": activeCohort,
  "2025": pastCohort,
};

export const surveyHandlers: HttpHandler[] = [
  // GET /api/cohorts/:slug/survey — конфигурация анкеты + информация о когорте
  http.get("*/api/cohorts/:slug/survey", async ({ params }) => {
    await delay(400);

    const slug = params.slug as string;
    const cohort = cohorts[slug];

    if (!cohort) {
      return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
    }

    const now = new Date();
    const appStart = new Date(cohort.application_start);
    const appEnd = new Date(cohort.application_end);
    const isWithinApplicationPeriod = now >= appStart && now <= appEnd;

    if (!isWithinApplicationPeriod) {
      return HttpResponse.json(
        {
          message: "Приём заявок на данную когорту закрыт",
          cohort,
          fields: [],
        },
        { status: 200 },
      );
    }

    return HttpResponse.json({
      cohort,
      fields: surveyFields.filter((f) => f.cohort_id === cohortSlugToId[slug]),
    });
  }),

  // POST /api/cohorts/:slug/survey — отправка анкеты
  http.post("*/api/cohorts/:slug/survey", async ({ request, params }) => {
    await delay(600);

    const slug = params.slug as string;
    const cohort = cohorts[slug];

    if (!cohort) {
      return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
    }

    const now = new Date();
    const appStart = new Date(cohort.application_start);
    const appEnd = new Date(cohort.application_end);
    const isWithinApplicationPeriod = now >= appStart && now <= appEnd;

    if (!isWithinApplicationPeriod) {
      return HttpResponse.json(
        { message: "Приём заявок на данную когорту закрыт" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, string>;
    submittedSurveys.set(`anon-${Date.now()}`, { cohortSlug: slug, data: body });

    return HttpResponse.json(
      { message: "Анкета успешно отправлена" },
      { status: 201 },
    );
  }),

  // GET /api/cohorts/:slug/test-task — получение тестового задания
  http.get("*/api/cohorts/:slug/test-task", async ({ params }) => {
    await delay(300);

    const slug = params.slug as string;

    if (slug === "2026") {
      return HttpResponse.json(publishedTestTask);
    }

    if (slug === "2025") {
      return HttpResponse.json(unpublishedTestTask);
    }

    return HttpResponse.json({ message: "Когорта не найдена" }, { status: 404 });
  }),
];