"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startOfWeek,
  subWeeks,
  addWeeks,
  format,
} from "date-fns";

import { useAuth } from "@/providers/auth-provider";
import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { fetchDashboard } from "@/lib/api/dashboard";
import { fetchCohort } from "@/lib/api/cohorts";
import { WeekGrid } from "@/features/tasks/week-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import type { TaskCard } from "@/entities";

export default function CabinetTasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [showAll, setShowAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<TaskCard | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Получаем cohortId из dashboard
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const cohortId = dashboard?.applications?.[0]?.cohortId ?? "";

  // Загружаем данные когорты, чтобы получить реальные даты практики
  const { data: cohort } = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: () => fetchCohort(cohortId),
    enabled: !!cohortId,
  });

  const practiceStart = cohort ? new Date(cohort.practiceStart) : new Date();
  const practiceEnd = cohort ? new Date(cohort.practiceEnd) : new Date();

  // Загрузка задач
  const tasksQuery = useQuery({
    queryKey: ["tasks", cohortId, weekStartStr, showAll],
    queryFn: () => fetchTasks({ cohortId, weekStart: weekStartStr, all: showAll }),
    enabled: !!cohortId,
  });

  const workdays = tasksQuery.data?.workdays ?? [];
  const tasks = workdays.flatMap((wd) => wd.tasks);
  const isLoading = tasksQuery.isLoading;
  const error = tasksQuery.error;

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data: { date: string; title: string; description?: string; artifactLink?: string }) =>
      createTask({ cohortId, ...data }),
    onSuccess: () => {
      toast.success("Задача создана");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при создании задачи"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description?: string; artifactLink?: string }) =>
      updateTask(data.id, { title: data.title, description: data.description, artifactLink: data.artifactLink }),
    onSuccess: () => {
      toast.success("Задача обновлена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при обновлении задачи"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success("Задача удалена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при удалении задачи"),
  });

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null) => {
      setDialogTask(task);
      setDialogDate(date);
      setDialogOpen(true);
    },
    [],
  );

  const handleSave = useCallback(
    (data: { title: string; description: string; artifactLink: string | null }) => {
      // Преобразуем null → undefined для совместимости с API
      if (dialogTask) {
        updateMutation.mutate({
          id: dialogTask.id,
          ...data,
          artifactLink: data.artifactLink ?? undefined,
        });
      } else if (dialogDate) {
        createMutation.mutate({
          date: dialogDate,
          ...data,
          artifactLink: data.artifactLink ?? undefined,
        });
      }
    },
    [dialogTask, dialogDate, createMutation, updateMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const isDialogReadOnly =
    showAll && dialogTask !== null && dialogTask.userId !== userId;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить задачи. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
          <p className="text-sm text-muted-foreground">
            {tasksQuery.data?.cohortName ?? "Недельная сетка задач"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-all"
            checked={showAll}
            onCheckedChange={(checked) => setShowAll(checked === true)}
          />
          <Label htmlFor="show-all" className="cursor-pointer text-sm">
            Показать всех
          </Label>
        </div>
      </div>

      {showAll && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>Режим просмотра всех участников</AlertTitle>
          <AlertDescription>
            Отображаются задачи всех участников когорты. Чужие карточки — только
            для просмотра.
          </AlertDescription>
        </Alert>
      )}

      <WeekGrid
        currentWeekStart={currentWeekStart}
        practiceStart={practiceStart}
        practiceEnd={practiceEnd}
        tasks={tasks}
        userId={userId}
        showAll={showAll}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCellClick={handleCellClick}
      />

      <TaskCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        date={dialogDate}
        readOnly={isDialogReadOnly}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}