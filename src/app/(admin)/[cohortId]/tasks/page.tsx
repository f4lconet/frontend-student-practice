"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { startOfWeek, subWeeks, addWeeks, parseISO, format } from "date-fns";

import { fetchTasks } from "@/lib/api/tasks";
import { fetchCohort } from "@/lib/api/cohorts";
import { WeekGrid } from "@/features/tasks/week-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import type { TaskCard } from "@/entities";

export default function AdminTasksPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<TaskCard | null>(null);
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const weekEnd = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 4);
    return format(d, "yyyy-MM-dd");
  }, [currentWeekStart]);

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Загружаем данные когорты, чтобы получить реальные даты практики
  const { data: cohort } = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: () => fetchCohort(cohortId),
    enabled: !!cohortId,
  });

  const practiceStart = cohort ? parseISO(cohort.practiceStart) : new Date();
  const practiceEnd = cohort ? parseISO(cohort.practiceEnd) : new Date();

  // Админ всегда видит всех участников
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-tasks", cohortId, weekStartStr],
    queryFn: () => fetchTasks({ cohortId, weekStart: weekStartStr, all: true }),
    enabled: !!cohortId,
  });

  const workdays = data?.workdays ?? [];
  const tasks = workdays.flatMap((wd: { date: string; tasks: TaskCard[] }) => wd.tasks);

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  // Клик по ячейке — всегда readOnly для админа
  const handleCellClick = useCallback(
    (date: string, task: TaskCard | null) => {
      if (!task) return; // Админ не может создавать задачи
      setDialogTask(task);
      setDialogDate(date);
      setDialogOpen(true);
    },
    [],
  );

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
        <AlertDescription>
          Не удалось загрузить задачи. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
        <p className="text-sm text-muted-foreground">
          Просмотр задач всех участников когорты
        </p>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Отображаются задачи всех участников когорты. Карточки — только для
          просмотра.
        </AlertDescription>
      </Alert>

      <WeekGrid
        currentWeekStart={currentWeekStart}
        practiceStart={practiceStart}
        practiceEnd={practiceEnd}
        tasks={tasks}
        userId=""
        showAll={true}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCellClick={handleCellClick}
      />

      <TaskCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={dialogTask}
        date={dialogDate}
        readOnly={true}
        onSave={() => {}}
      />
    </div>
  );
}