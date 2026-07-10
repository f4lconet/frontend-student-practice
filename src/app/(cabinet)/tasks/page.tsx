"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startOfWeek,
  subWeeks,
  addWeeks,
  parseISO,
  format,
} from "date-fns";
import { ru } from "date-fns/locale";

import { useAuth } from "@/providers/auth-provider";
import { fetchMyTasks, fetchAllTasks, createTask, updateTask } from "@/lib/api/tasks";
import { WeekGrid } from "@/features/tasks/week-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, User } from "lucide-react";
import type { TaskCard } from "@/entities";

const MOCK_COHORT_ID = "cohort-2026";
const PRACTICE_START = parseISO("2026-07-01");
const PRACTICE_END = parseISO("2026-08-31");

// Информация об участниках (в реальном проекте приходит с бэка)
const PARTICIPANTS: Record<string, { name: string; role: string }> = {
  "user-student-1": { name: "Иванов Иван", role: "Frontend" },
  "user-student-2": { name: "Петров Пётр", role: "Backend" },
};

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

  const weekEnd = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 4); // пн-пт (5 будних дней)
    return format(d, "yyyy-MM-dd");
  }, [currentWeekStart]);

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Загрузка задач
  const myTasksQuery = useQuery({
    queryKey: ["tasks", "my", weekStartStr, weekEnd],
    queryFn: () => fetchMyTasks(weekStartStr, weekEnd),
    enabled: !showAll,
  });

  const allTasksQuery = useQuery({
    queryKey: ["tasks", "all", weekStartStr, weekEnd],
    queryFn: () => fetchAllTasks(MOCK_COHORT_ID, weekStartStr, weekEnd),
    enabled: showAll,
  });

  const tasks = showAll ? (allTasksQuery.data?.tasks ?? []) : (myTasksQuery.data?.tasks ?? []);
  const isLoading = showAll ? allTasksQuery.isLoading : myTasksQuery.isLoading;
  const error = showAll ? allTasksQuery.error : myTasksQuery.error;

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data: { date: string; title: string; description: string; artifact_link: string | null }) =>
      createTask(data),
    onSuccess: () => {
      toast.success("Задача создана");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при создании задачи"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description: string; artifact_link: string | null }) =>
      updateTask(data.id, {
        title: data.title,
        description: data.description,
        artifact_link: data.artifact_link,
      }),
    onSuccess: () => {
      toast.success("Задача обновлена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Ошибка при обновлении задачи"),
  });

  // Навигация по неделям
  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  // Клик по ячейке
  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null) => {
      if (showAll && task && task.user_id !== userId) {
        // Чужая задача — readOnly
        setDialogTask(task);
        setDialogDate(date);
        setDialogOpen(true);
        return;
      }
      if (showAll && !task) {
        // В режиме "показать всех" нельзя создавать задачи
        return;
      }
      setDialogTask(task);
      setDialogDate(date);
      setDialogOpen(true);
    },
    [showAll, userId],
  );

  // Сохранение из диалога
  const handleSave = useCallback(
    (data: { title: string; description: string; artifact_link: string | null }) => {
      if (dialogTask) {
        updateMutation.mutate({ id: dialogTask.id, ...data });
      } else if (dialogDate) {
        createMutation.mutate({ date: dialogDate, ...data });
      }
    },
    [dialogTask, dialogDate, createMutation, updateMutation],
  );

  // Чекбокс
  const handleShowAllChange = useCallback(
    (checked: boolean) => {
      setShowAll(checked);
    },
    [],
  );

  const isDialogReadOnly =
    showAll && dialogTask !== null && dialogTask.user_id !== userId;

  const participantInfo =
    dialogTask && dialogTask.user_id !== userId
      ? PARTICIPANTS[dialogTask.user_id]
      : undefined;

  // ========== Состояния ==========

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
            Недельная сетка задач практики
          </p>
        </div>

        {/* Чекбокс "Показать всех" */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-all"
            checked={showAll}
            onCheckedChange={(checked) => handleShowAllChange(checked === true)}
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
        practiceStart={PRACTICE_START}
        practiceEnd={PRACTICE_END}
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
        participantName={participantInfo?.name}
        participantRole={participantInfo?.role}
        onSave={handleSave}
      />
    </div>
  );
}