"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchTestTask, updateTestTask, publishTestTask } from "@/lib/api/cohorts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, Save, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TestTaskTabProps {
  cohortId: string;
}

export function TestTaskTab({ cohortId }: TestTaskTabProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string | null>(null);
  const [isContentDirty, setIsContentDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    data: testTask,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["test-task", cohortId],
    queryFn: () => fetchTestTask(cohortId),
  });

  const saveMutation = useMutation({
    mutationFn: (newContent: string) =>
      updateTestTask(cohortId, { content: newContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-task", cohortId] });
      setIsContentDirty(false);
      setSaveError(null);
    },
    onError: () => {
      setSaveError("Ошибка при сохранении содержимого");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishTestTask(cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-task", cohortId] });
    },
    onError: () => {
      setSaveError("Ошибка при публикации тестового задания");
    },
  });

  const handleSave = () => {
    if (content === null) return;
    setSaveError(null);
    saveMutation.mutate(content);
  };

  const handlePublish = () => {
    setSaveError(null);
    publishMutation.mutate();
  };

  // Display content: use local state if set, otherwise use server data
  const displayContent = content ?? testTask?.content ?? "";

  const handleContentChange = (newValue: string) => {
    setContent(newValue);
    setIsContentDirty(true);
  };

  const isPublished =
    testTask?.published_at !== null && testTask?.published_at !== undefined;
  const publishedDate = testTask?.published_at
    ? (() => {
        try {
          return format(new Date(testTask.published_at), "d MMM yyyy HH:mm", {
            locale: ru,
          });
        } catch {
          return testTask.published_at;
        }
      })()
    : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки тестового задания
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Тестовое задание</h3>
          <p className="text-sm text-muted-foreground">
            Редактируйте содержимое тестового задания. После публикации задание
            станет доступно кандидатам, подавшим анкету.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Опубликовано
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Черновик
            </Badge>
          )}
        </div>
      </div>

      {publishedDate && (
        <p className="text-xs text-muted-foreground">
          Опубликовано: {publishedDate}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Содержимое задания</CardTitle>
          <CardDescription>
            Используйте Markdown-разметку для форматирования текста
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-task-content">Текст задания</Label>
            <Textarea
              id="test-task-content"
              value={displayContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="## Тестовое задание

Реализуйте ..."
              rows={16}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !isContentDirty}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>

            {!isPublished && (
              <Button
                variant="default"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {publishMutation.isPending
                  ? "Публикация..."
                  : "Опубликовать"}
              </Button>
            )}
          </div>

          {/* Индикатор того, что есть несохранённые изменения */}
          {isContentDirty && !saveMutation.isPending && (
            <p className="text-xs text-amber-600">
              Есть несохранённые изменения. Нажмите «Сохранить» перед
              публикацией.
            </p>
          )}
        </CardContent>
      </Card>

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}