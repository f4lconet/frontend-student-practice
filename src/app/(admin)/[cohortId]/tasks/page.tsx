import { StubPage } from "@/components/stub-page";

interface AdminTasksPageProps {
  params: Promise<{ cohortId: string }>;
}

export default async function AdminTasksPage({
  params,
}: AdminTasksPageProps) {
  const { cohortId } = await params;

  return (
    <StubPage
      title={`Задачи (когорта ${cohortId})`}
      day={10}
      dayTitle="Админ-панель: вкладка «Задачи»"
    />
  );
}
