"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchMyApplications, fetchPrefillData } from "@/lib/api/applications";
import { fetchPublicActiveCohort } from "@/lib/api/survey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, Plus, Calendar, MessageSquare } from "lucide-react";
import type { ApplicationStatus, Application } from "@/entities";

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const statusVariants: Record<ApplicationStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CabinetApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchMyApplications(),
  });

  const prefillQuery = useQuery({
    queryKey: ["applications", "prefill"],
    queryFn: () => fetchPrefillData(),
    staleTime: 5 * 60 * 1000,
  });

  const applications: Application[] = applicationsQuery.data ?? [];
  const hasPrefill = prefillQuery.data?.data && Object.keys(prefillQuery.data.data).length > 0;

  // Получаем активную когорту для ссылки "Подать заявку"
  const { data: activeCohort } = useQuery({
    queryKey: ["public", "active-cohort"],
    queryFn: () => fetchPublicActiveCohort().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });

  const surveyHref = activeCohort ? `/survey/${activeCohort.name}` : "/survey/current";

  if (applicationsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (applicationsQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить список заявок. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Заявки на практику
          </CardTitle>
          <CardDescription>
            У вас пока нет поданных заявок
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Подайте заявку на практику, чтобы начать.
            <br />
            Заявки принимаются в период приёма активной когорты.
          </p>
          <Button
            render={<Link href={surveyHref} />}
            nativeButton={false}
          >
            <Plus className="mr-2 h-4 w-4" />
            Подать заявку
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Заявки на практику</h1>
          <p className="text-sm text-muted-foreground">
            Всего заявок: {applications.length}
          </p>
        </div>
        <Button
          render={<Link href={surveyHref} />}
          nativeButton={false}
        >
          <Plus className="mr-2 h-4 w-4" />
          Подать заявку
        </Button>
      </div>

      {hasPrefill && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>У вас есть данные из предыдущей заявки</AlertTitle>
          <AlertDescription>
            При подаче новой заявки поля будут предзаполнены вашими данными.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {app.cohortName ?? "Когорта"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(app.createdAt)}
                  </CardDescription>
                </div>
                <Badge variant={statusVariants[app.status]}>
                  {statusLabels[app.status]}
                </Badge>
              </div>
            </CardHeader>
            {app.reviewComment && (
              <CardContent>
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Комментарий администратора:
                    </p>
                    <p className="mt-0.5">{app.reviewComment}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}