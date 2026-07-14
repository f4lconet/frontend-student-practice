"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  fetchAdminApplications,
  fetchApplicationSurvey,
  approveApplication,
  rejectApplication,
  type AdminApplication,
} from "@/lib/api/applications";
import { fetchCohortRoles } from "@/lib/api/cohorts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/entities/application";
import type { CohortRole } from "@/entities/cohort-role";
import type { SurveyField } from "@/entities/survey-field";

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const statusBadgeVariants: Record<
  ApplicationStatus,
  "secondary" | "default" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: ru });
  } catch {
    return dateStr;
  }
}

function getFieldAnswerLabel(
  field: SurveyField,
  answer: string,
): string {
  if (field.type === "select" && field.options) {
    return answer;
  }
  return answer;
}

// ---- Survey Dialog ----
function SurveyDialog({
  application,
  open,
  onOpenChange,
}: {
  application: AdminApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: surveyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["application-survey", application?.id],
    queryFn: () => fetchApplicationSurvey(application!.id),
    enabled: open && !!application,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Анкета кандидата</DialogTitle>
          <DialogDescription>
            {application?.userName ?? "Загрузка..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки анкеты
            </AlertDescription>
          </Alert>
        )}

        {surveyData && (
          <div className="space-y-4 py-2">
            {surveyData.fields
              .sort((a, b) => a.order - b.order)
              .map((field) => {
                const answer = surveyData.answers[field.id] ?? "—";
                return (
                  <div key={field.id}>
                    <Label className="text-sm text-muted-foreground">
                      {field.label}
                    </Label>
                    <p className="mt-1 text-sm font-medium">
                      {getFieldAnswerLabel(field, answer)}
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Approve Dialog ----
function ApproveDialog({
  application,
  open,
  onOpenChange,
  cohortId,
}: {
  application: AdminApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const { data: roles } = useQuery({
    queryKey: ["cohort-roles", cohortId],
    queryFn: () => fetchCohortRoles(cohortId),
    enabled: open,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveApplication(application!.id, selectedRoleId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["admin-applications", cohortId],
      });
      const previous = queryClient.getQueryData<AdminApplication[]>([
        "admin-applications",
        cohortId,
      ]);
      if (previous && application) {
        queryClient.setQueryData<AdminApplication[]>(
          ["admin-applications", cohortId],
          previous.map((a) =>
            a.id === application.id
              ? { ...a, status: "approved" as const, roleId: selectedRoleId }
              : a,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["admin-applications", cohortId],
          context.previous,
        );
      }
      toast.error("Ошибка при одобрении заявки");
    },
    onSuccess: () => {
      toast.success("Заявка одобрена");
      onOpenChange(false);
      setSelectedRoleId("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-applications", cohortId],
      });
    },
  });

  const handleApprove = () => {
    if (!selectedRoleId) return;
    approveMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelectedRoleId("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Одобрить заявку</DialogTitle>
          <DialogDescription>
            {application?.userName ?? "Загрузка..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="approve-role">
              Назначить роль <span className="text-destructive">*</span>
            </Label>
            {!roles || roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала создайте роли в настройках когорты
              </p>
            ) : (
              <Select
                value={selectedRoleId}
                onValueChange={(v) => {
                  if (v) setSelectedRoleId(v);
                }}
              >
                <SelectTrigger id="approve-role">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!selectedRoleId || approveMutation.isPending}
          >
            {approveMutation.isPending ? "Одобрение..." : "Одобрить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Reject Dialog ----
function RejectDialog({
  application,
  open,
  onOpenChange,
  cohortId,
}: {
  application: AdminApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const rejectMutation = useMutation({
    mutationFn: () => rejectApplication(application!.id, comment),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["admin-applications", cohortId],
      });
      const previous = queryClient.getQueryData<AdminApplication[]>([
        "admin-applications",
        cohortId,
      ]);
      if (previous && application) {
        queryClient.setQueryData<AdminApplication[]>(
          ["admin-applications", cohortId],
          previous.map((a) =>
            a.id === application.id
              ? {
                  ...a,
                  status: "rejected" as const,
                  reviewComment: comment || null,
                }
              : a,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["admin-applications", cohortId],
          context.previous,
        );
      }
      toast.error("Ошибка при отклонении заявки");
    },
    onSuccess: () => {
      toast.success("Заявка отклонена");
      onOpenChange(false);
      setComment("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-applications", cohortId],
      });
    },
  });

  const handleReject = () => {
    rejectMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setComment("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклонить заявку</DialogTitle>
          <DialogDescription>
            {application?.userName ?? "Загрузка..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reject-comment">
              Комментарий (будет виден кандидату)
            </Label>
            <Textarea
              id="reject-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Укажите причину отклонения..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? "Отклонение..." : "Отклонить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminApplicationsPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [viewingApp, setViewingApp] = useState<AdminApplication | null>(null);
  const [approvingApp, setApprovingApp] = useState<AdminApplication | null>(
    null,
  );
  const [rejectingApp, setRejectingApp] = useState<AdminApplication | null>(
    null,
  );

  const {
    data: applications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-applications", cohortId],
    queryFn: () => fetchAdminApplications(cohortId),
  });

  const filteredApps = useMemo(() => {
    if (!applications) return [];
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = app.userName?.toLowerCase() ?? "";
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки заявок. Пожалуйста, попробуйте позже.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Заявки</h1>
        <p className="text-muted-foreground">
          Управление заявками кандидатов когорты
        </p>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ФИО..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => {
          if (v) setStatusFilter(v);
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">На рассмотрении</SelectItem>
            <SelectItem value="approved">Одобрена</SelectItem>
            <SelectItem value="rejected">Отклонена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
      {!applications || applications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет заявок</CardTitle>
            <CardDescription>
              На данную когорту ещё не подано ни одной заявки
            </CardDescription>
          </CardHeader>
        </Card>
      ) : filteredApps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ничего не найдено</CardTitle>
            <CardDescription>
              Попробуйте изменить параметры поиска или фильтра
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО кандидата</TableHead>
                <TableHead>Дата подачи</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.userName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(app.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariants[app.status as ApplicationStatus]}>
                      {statusLabels[app.status as ApplicationStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.roleId ? "Назначена" : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setViewingApp(app)}
                        title="Просмотр анкеты"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {app.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setApprovingApp(app)}
                            title="Одобрить"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setRejectingApp(app)}
                            title="Отклонить"
                          >
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}

                      {app.status === "rejected" && app.reviewComment && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Просмотр комментария"
                          onClick={() => {
                            toast.info(app.reviewComment, {
                              duration: 5000,
                              icon: <MessageSquare className="h-4 w-4" />,
                            });
                          }}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Диалоги */}
      <SurveyDialog
        application={viewingApp}
        open={viewingApp !== null}
        onOpenChange={(open) => {
          if (!open) setViewingApp(null);
        }}
      />

      <ApproveDialog
        application={approvingApp}
        open={approvingApp !== null}
        onOpenChange={(open) => {
          if (!open) setApprovingApp(null);
        }}
        cohortId={cohortId}
      />

      <RejectDialog
        application={rejectingApp}
        open={rejectingApp !== null}
        onOpenChange={(open) => {
          if (!open) setRejectingApp(null);
        }}
        cohortId={cohortId}
      />
    </div>
  );
}