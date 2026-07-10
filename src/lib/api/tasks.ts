import { apiClient } from "./client";
import type { TaskCard } from "@/entities";

export interface TasksListResponse {
  tasks: TaskCard[];
}

export interface TaskCardResponse {
  task: TaskCard;
}

export interface TaskCardPayload {
  date: string;
  title: string;
  description: string;
  artifact_link: string | null;
}

/**
 * Получить карточки задач текущего пользователя за диапазон дат.
 * GET /api/tasks?start=...&end=...
 */
export function fetchMyTasks(start: string, end: string) {
  return apiClient.get<TasksListResponse>("/tasks", {
    params: { start, end },
  });
}

/**
 * Получить карточки задач всех участников когорты за диапазон дат.
 * GET /api/tasks/all?start=...&end=...
 */
export function fetchAllTasks(cohortId: string, start: string, end: string) {
  return apiClient.get<TasksListResponse>(`/tasks/all`, {
    params: { cohortId, start, end },
  });
}

/**
 * Создать новую карточку задачи.
 * POST /api/tasks
 */
export function createTask(data: TaskCardPayload) {
  return apiClient.post<TaskCardResponse>("/tasks", data);
}

/**
 * Обновить карточку задачи.
 * PATCH /api/tasks/:id
 */
export function updateTask(id: string, data: Partial<TaskCardPayload>) {
  return apiClient.patch<TaskCardResponse>(`/tasks/${id}`, data);
}