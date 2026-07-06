import { StubPage } from "@/components/stub-page";

interface AdminApplicationsPageProps {
  params: Promise<{ cohortId: string }>;
}

export default async function AdminApplicationsPage({
  params,
}: AdminApplicationsPageProps) {
  const { cohortId } = await params;

  return (
    <StubPage
      title={`Заявки (когорта ${cohortId})`}
      day={8}
      dayTitle="Админ-панель: вкладка «Заявки»"
    />
  );
}
