import { http, HttpResponse, delay } from "msw";
import type { HttpHandler } from "msw";

import type { TasksListResponse, TaskCardResponse, TaskCardPayload } from "@/lib/api/tasks";
import type { TaskCard } from "@/entities";

const STORAGE_KEY = "mock_tasks";

// Тестовые карточки задач для student@test.ru (user-student-1)
const DEFAULT_TASKS: TaskCard[] = [
  {
    id: "task-1",
    user_id: "user-student-1",
    cohort_id: "cohort-2026",
    date: "2026-07-06",
    title: "Настроить проект Next.js",
    description: "Инициализировать проект, настроить Tailwind, shadcn/ui",
    artifact_link: "https://github.com/student/practice-app",
    updated_at: "2026-07-06T14:30:00Z",
  },
  {
    id: "task-2",
    user_id: "user-student-1",
    cohort_id: "cohort-2026",
    date: "2026-07-07",
    title: "Создать компонент Header",
    description: "Реализовать шапку с навигацией",
    artifact_link: null,
    updated_at: "2026-07-07T10:15:00Z",
  },
  {
    id: "task-3",
    user_id: "user-student-2",
    cohort_id: "cohort-2026",
    date: "2026-07-06",
    title: "Разработать API эндпоинты",
    description: "Создать REST API для управления задачами",
    artifact_link: "https://github.com/student2/practice-api",
    updated_at: "2026-07-06T16:45:00Z",
  },
  {
    id: "task-4",
    user_id: "user-student-2",
    cohort_id: "cohort-2026",
    date: "2026-07-08",
    title: "Написать тесты",
    description: "unit-тесты для сервисного слоя",
    artifact_link: null,
    updated_at: "2026-07-08T09:00:00Z",
  },
];

const PARTICIPANTS: Record<string, { user_id: string; name: string; role: string }> = {
  "user-student-1": { user_id: "user-student-1", name: "Иванов Иван", role: "Frontend" },
  "user-student-2": { user_id: "user-student-2", name: "Петров Пётр", role: "Backend" },
};

function loadTasks(): TaskCard[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
  return DEFAULT_TASKS;
}

function saveTasks(tasks: TaskCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export const tasksHandlers: HttpHandler[] = [
  // GET /api/tasks?start=...&end=... — мои задачи за период
  http.get("*/tasks", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const start = url.searchParams.get("start") ?? "";
    const end = url.searchParams.get("end") ?? "";
    const allTasks = loadTasks();
    const filtered = allTasks.filter(
      (t) => t.user_id === "user-student-1" && t.date >= start && t.date <= end,
    );
    return HttpResponse.json<TasksListResponse>({ tasks: filtered }, { status: 200 });
  }),

  // GET /api/tasks/all?cohortId=...&start=...&end=... — задачи всех участников
  http.get("*/tasks/all", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const start = url.searchParams.get("start") ?? "";
    const end = url.searchParams.get("end") ?? "";
    const allTasks = loadTasks();
    const filtered = allTasks.filter((t) => t.date >= start && t.date <= end);
    // Добавляем информацию об участниках
    return HttpResponse.json<TasksListResponse>({ tasks: filtered }, { status: 200 });
  }),

  // POST /api/tasks — создать карточку
  http.post("*/tasks", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as TaskCardPayload;
    const allTasks = loadTasks();
    const newTask: TaskCard = {
      id: `task-${Date.now()}`,
      user_id: "user-student-1",
      cohort_id: "cohort-2026",
      date: body.date,
      title: body.title,
      description: body.description,
      artifact_link: body.artifact_link,
      updated_at: new Date().toISOString(),
    };
    allTasks.push(newTask);
    saveTasks(allTasks);
    return HttpResponse.json<TaskCardResponse>({ task: newTask }, { status: 201 });
  }),

  // PATCH /api/tasks/:id — обновить карточку
  http.patch("*/tasks/:id", async ({ request, params }) => {
    await delay(300);
    const { id } = params;
    const body = (await request.json()) as Partial<TaskCardPayload>;
    const allTasks = loadTasks();
    const idx = allTasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json({ message: "Карточка не найдена" }, { status: 404 });
    }
    allTasks[idx] = {
      ...allTasks[idx],
      ...body,
      updated_at: new Date().toISOString(),
    };
    saveTasks(allTasks);
    return HttpResponse.json<TaskCardResponse>({ task: allTasks[idx] }, { status: 200 });
  }),
];

export { PARTICIPANTS };