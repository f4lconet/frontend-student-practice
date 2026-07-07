"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { fetchSurveyConfig, submitSurvey, fetchTestTask } from "@/lib/api/survey";
import type { SurveyConfigResponse } from "@/lib/api/survey";

/**
 * Хук для страницы публичной анкеты /survey/[cohortSlug].
 * Управляет загрузкой конфигурации, отправкой формы и получением тестового задания.
 */
export function useSurveyPage(slug: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Загрузка конфигурации анкеты
  const configQuery = useQuery<SurveyConfigResponse>({
    queryKey: ["survey-config", slug],
    queryFn: () => fetchSurveyConfig(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Отправка анкеты
  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) => submitSurvey(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-config", slug] });
      toast.success("Анкета успешно отправлена!");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Ошибка при отправке анкеты");
    },
  });

  const isSubmitted = submitMutation.isSuccess;

  // 3. Загрузка тестового задания (только после отправки анкеты)
  const testTaskQuery = useQuery({
    queryKey: ["test-task", slug],
    queryFn: () => fetchTestTask(slug),
    enabled: isSubmitted,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const handleSubmit = useCallback(
    (data: Record<string, string>) => {
      submitMutation.mutate(data);
    },
    [submitMutation],
  );

  const handleBackToHome = useCallback(() => {
    router.push("/");
  }, [router]);

  return {
    // Состояние загрузки конфигурации
    config: configQuery.data,
    isLoadingConfig: configQuery.isLoading,
    configError: configQuery.error,
    // Состояние анкеты
    fields: configQuery.data?.fields ?? [],
    cohort: configQuery.data?.cohort ?? null,
    isFieldsEmpty: (configQuery.data?.fields?.length ?? 0) === 0,
    // Проверка доступности анкеты
    isApplicationPeriodActive: !configQuery.data?.cohort
      ? null
      : isWithinDates(
          configQuery.data.cohort.application_start,
          configQuery.data.cohort.application_end,
        ),
    // Отправка
    isSubmitting: submitMutation.isPending,
    isSubmitted,
    submitError: submitMutation.error,
    handleSubmit,
    // Тестовое задание
    testTask: testTaskQuery.data,
    isLoadingTestTask: testTaskQuery.isLoading,
    testTaskError: testTaskQuery.error,
    // Навигация
    handleBackToHome,
  };
}

function isWithinDates(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}