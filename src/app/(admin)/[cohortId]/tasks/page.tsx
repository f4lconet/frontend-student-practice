"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { startOfWeek, subWeeks, addWeeks, parseISO, format } from "date-fns";

import { fetchTasks } from "@/lib/api/tasks";
import { WeekGrid } from "@/features/tasks/week-grid";
import { TaskCardDialog } from "@/features/tasks/task-card-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import type { TaskCard } from "@/entities";

const PRACTICE_START = parseISO("2026-07-01");
const PRACTICE_END = parseISO("2026-08-31");

// Информация об участниках
const PARTICIPANTS: Record<string, { name: string; role: string }> = {
  "user-student-1": { name: "Иванов Иван", role: "Frontend" },
  "user-student-2": { name: "Петров Пётр", role: "Backend" },
  "user-student-3": { name: "Сидорова Анна", role: "Аналитик" },
};

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

  const participantInfo =
    dialogTask ? PARTICIPANTS[dialogTask.userId] : undefined;

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
        practiceStart={PRACTICE_START}
        practiceEnd={PRACTICE_END}
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
        participantName={participantInfo?.name}
        participantRole={participantInfo?.role}
        onSave={() => {}}
      />
    </div>
  );
}