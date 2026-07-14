"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { fetchPublicActiveCohort, fetchPublicSurveyFields, submitApplication } from "@/lib/api/survey";
import type { SurveyConfigResponse } from "@/lib/api/survey";
import type { Application } from "@/entities";
import type { TestTask } from "@/entities/test-task";

interface UseSurveyPageOptions {
  prefillData?: Record<string, string> | null;
}

/**
 * Хук для страницы анкеты /survey/[cohortSlug].
 */
export function useSurveyPage(slug: string, options?: UseSurveyPageOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Загрузка конфигурации анкеты — получаем активную когорту и её поля
  const activeCohortQuery = useQuery({
    queryKey: ["public", "active-cohort"],
    queryFn: () => fetchPublicActiveCohort(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const cohort = activeCohortQuery.data ?? null;

  const fieldsQuery = useQuery({
    queryKey: ["public", "survey-fields", cohort?.id],
    queryFn: () => fetchPublicSurveyFields(cohort!.id),
    enabled: !!cohort,
    staleTime: 5 * 60 * 1000,
  });

  const fields = fieldsQuery.data ?? [];

  // 2. Отправка заявки
  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) => {
      if (!cohort) throw new Error("No active cohort");
      const answers = Object.entries(data).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      return submitApplication({ cohortId: cohort.id, roleId: "", answers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Анкета успешно отправлена!");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Ошибка при отправке анкеты");
    },
  });

  const isSubmitted = submitMutation.isSuccess;

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

  const isLoadingConfig = activeCohortQuery.isLoading || fieldsQuery.isLoading;
  const configError = activeCohortQuery.error ?? fieldsQuery.error;
  const isFieldsEmpty = fields.length === 0;

  return {
    fields,
    cohort,
    isLoadingConfig,
    configError,
    isFieldsEmpty,
    isApplicationPeriodActive: !cohort ? null : isWithinDates(cohort.applicationStart, cohort.applicationEnd),
    isSubmitting: submitMutation.isPending,
    isSubmitted,
    submitError: submitMutation.error,
    handleSubmit,
    testTask: null as TestTask | null,
    isLoadingTestTask: false,
    testTaskError: null,
    handleBackToHome,
    handleBackToApplications,
  };
}

function isWithinDates(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}