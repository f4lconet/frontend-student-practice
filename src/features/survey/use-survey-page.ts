"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { fetchSurveyConfig, submitSurvey, fetchTestTask } from "@/lib/api/survey";
import type { SurveyConfigResponse } from "@/lib/api/survey";

interface UseSurveyPageOptions {
  /** Prefill-данные из предыдущей заявки (для авторизованных пользователей) */
  prefillData?: Record<string, string> | null;
  /** Флаг: отправлять ли анкету с авторизацией (true для авторизованных) */
  authenticated?: boolean;
}

/**
 * Хук для страницы анкеты /survey/[cohortSlug].
 * Управляет загрузкой конфигурации, отправкой формы и получением тестового задания.
 *
 * Поддерживает:
 * - Публичный режим (без авторизации)
 * - Авторизованный режим (с prefill-данными из предыдущей заявки)
 */
export function useSurveyPage(slug: string, options?: UseSurveyPageOptions) {
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
    mutationFn: (data: Record<string, string>) =>
      submitSurvey(slug, data, {
        skipAuth: !options?.authenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-config", slug] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
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

  const handleBackToApplications = useCallback(() => {
    router.push("/applications");
  }, [router]);

  const fields = configQuery.data?.fields ?? [];
  const cohortDetails = configQuery.data?.cohort ?? null;

  return {
    // Состояние загрузки конфигурации
    config: configQuery.data,
    isLoadingConfig: configQuery.isLoading,
    configError: configQuery.error,
    // Состояние анкеты
    fields,
    cohort: cohortDetails,
    isFieldsEmpty: fields.length === 0,
    // Prefill-данные
    prefillData: options?.prefillData ?? null,
    // Проверка доступности анкеты
    isApplicationPeriodActive: !cohortDetails
      ? null
      : isWithinDates(
          cohortDetails.application_start,
          cohortDetails.application_end,
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
    handleBackToApplications,
  };
}

function isWithinDates(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}