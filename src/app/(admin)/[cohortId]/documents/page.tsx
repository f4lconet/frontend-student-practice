"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchAdminStudents,
  fetchStudentReview,
  saveStudentReview,
  approveStudentReport,
  type AdminStudentDocumentInfo,
  type AdminReviewData,
} from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
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
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Готов
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      Не готов
    </Badge>
  );
}

// ---- Review Dialog ----
function ReviewDialog({
  student,
  cohortId,
  open,
  onOpenChange,
}: {
  student: AdminStudentDocumentInfo | null;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<AdminReviewData>({
    review_activities: "",
    review_characteristic: "",
    review_employed: "",
    review_next_practice: "",
    review_employment_offer: "",
    review_suggestions: "",
    review_grade: "",
  });

  const { isLoading } = useQuery({
    queryKey: ["student-review", cohortId, student?.user_id],
    queryFn: () => fetchStudentReview(cohortId, student!.user_id),
    enabled: open && !!student,
    select: (data) => {
      setFormData(data);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: AdminReviewData) =>
      saveStudentReview(cohortId, student!.user_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-students", cohortId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-review", cohortId, student?.user_id],
      });
      toast.success("Отзыв сохранён");
    },
    onError: () => {
      toast.error("Ошибка при сохранении отзыва");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateField = (field: keyof AdminReviewData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isAllFilled = Object.values(formData).every(
    (v) => v !== null && v !== undefined && v !== "",
  );

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отзыв о практике</DialogTitle>
          <DialogDescription>
            {student.user_name} — заполните все поля для формирования документа
            «Отзыв»
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* review_activities */}
            <div className="space-y-2">
              <Label htmlFor="review_activities">
                Виды и объём работ, выполненных студентом
              </Label>
              <Textarea
                id="review_activities"
                value={formData.review_activities}
                onChange={(e) =>
                  updateField("review_activities", e.target.value)
                }
                rows={3}
              />
            </div>

            {/* review_characteristic */}
            <div className="space-y-2">
              <Label htmlFor="review_characteristic">
                Характеристика работы студента
              </Label>
              <Textarea
                id="review_characteristic"
                value={formData.review_characteristic}
                onChange={(e) =>
                  updateField("review_characteristic", e.target.value)
                }
                rows={3}
              />
            </div>

            {/* review_employed */}
            <div className="space-y-2">
              <Label>Трудоустройство</Label>
              <Select
                value={formData.review_employed}
                onValueChange={(v) => {
                  if (v) updateField("review_employed", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="да">
                    Да — рекомендую к трудоустройству
                  </SelectItem>
                  <SelectItem value="нет">Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* review_next_practice */}
            <div className="space-y-2">
              <Label htmlFor="review_next_practice">
                Рекомендации по следующей практике
              </Label>
              <Textarea
                id="review_next_practice"
                value={formData.review_next_practice}
                onChange={(e) =>
                  updateField("review_next_practice", e.target.value)
                }
                rows={2}
              />
            </div>

            {/* review_employment_offer */}
            <div className="space-y-2">
              <Label>Предложение о работе</Label>
              <Select
                value={formData.review_employment_offer}
                onValueChange={(v) => {
                  if (v) updateField("review_employment_offer", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="да">Да</SelectItem>
                  <SelectItem value="нет">Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* review_suggestions */}
            <div className="space-y-2">
              <Label htmlFor="review_suggestions">
                Замечания и предложения
              </Label>
              <Textarea
                id="review_suggestions"
                value={formData.review_suggestions}
                onChange={(e) =>
                  updateField("review_suggestions", e.target.value)
                }
                rows={2}
              />
            </div>

            {/* review_grade */}
            <div className="space-y-2">
              <Label htmlFor="review_grade">Оценка</Label>
              <Select
                value={formData.review_grade}
                onValueChange={(v) => {
                  if (v) updateField("review_grade", v);
                }}
              >
                <SelectTrigger id="review_grade" className="w-32">
                  <SelectValue placeholder="Оценка" />
                </SelectTrigger>
                <SelectContent>
                  {["2", "3", "4", "5"].map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAllFilled && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Все поля отзыва заполнены. Студент сможет сформировать
                  документ «Отзыв».
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !isAllFilled}
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Report Dialog ----
function ReportDialog({
  student,
  cohortId,
  open,
  onOpenChange,
}: {
  student: AdminStudentDocumentInfo | null;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [approved, setApproved] = useState(
    () => student?.report_admin_approved ?? false,
  );

  const approveMutation = useMutation({
    mutationFn: (value: boolean) =>
      approveStudentReport(cohortId, student!.user_id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-students", cohortId],
      });
      toast.success("Статус обновлён");
    },
    onError: () => {
      toast.error("Ошибка при обновлении статуса");
    },
  });

  const handleToggleApproval = (value: boolean) => {
    setApproved(value);
    approveMutation.mutate(value);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отчёт о практике</DialogTitle>
          <DialogDescription>{student.user_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Просмотр отчёта */}
          <div className="space-y-2">
            <Label>Файл отчёта</Label>
            {student.report_file_url ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a
                  href={student.report_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Скачать / Открыть отчёт
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Студент ещё не загрузил отчёт
              </p>
            )}
          </div>

          {/* Переключатель допуска к титульному листу */}
          <div className="space-y-2">
            <Label>Допуск к скачиванию титульного листа</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={approved}
                onCheckedChange={handleToggleApproval}
                disabled={approveMutation.isPending}
              />
              <span className="text-sm">
                {approved ? "Допущен" : "Не допущен"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Включите, чтобы студент мог скачать титульный лист отчёта
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDocumentsPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  // Dialogs
  const [reviewStudent, setReviewStudent] =
    useState<AdminStudentDocumentInfo | null>(null);
  const [reportStudent, setReportStudent] =
    useState<AdminStudentDocumentInfo | null>(null);

  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-students", cohortId],
    queryFn: () => fetchAdminStudents(cohortId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки данных практикантов
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Документы</h1>
        <p className="text-muted-foreground">
          Управление документами практикантов когорты
        </p>
      </div>

      {!students || students.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет практикантов</CardTitle>
            <CardDescription>
              В данной когорте нет практикантов с одобренными заявками
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО практиканта</TableHead>
                <TableHead className="text-center">ИЗ</TableHead>
                <TableHead className="text-center">Отзыв</TableHead>
                <TableHead className="text-center">Титульный лист</TableHead>
                <TableHead className="text-center">Отчёт</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.user_id}>
                  <TableCell className="font-medium">
                    {student.user_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge ready={student.student_data_complete} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge ready={student.review_complete} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge
                      ready={
                        student.report_file_url !== null &&
                        student.report_admin_approved
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {student.report_file_url ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Загружен
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Нет
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewStudent(student)}
                      >
                        Отзыв
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportStudent(student)}
                      >
                        Отчёт
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Диалоги */}
      {reviewStudent !== null && (
        <ReviewDialog
          key={reviewStudent.user_id}
          student={reviewStudent}
          cohortId={cohortId}
          open={true}
          onOpenChange={(open) => {
            if (!open) setReviewStudent(null);
          }}
        />
      )}

      {reportStudent !== null && (
        <ReportDialog
          key={reportStudent.user_id}
          student={reportStudent}
          cohortId={cohortId}
          open={true}
          onOpenChange={(open) => {
            if (!open) setReportStudent(null);
          }}
        />
      )}
    </div>
  );
}