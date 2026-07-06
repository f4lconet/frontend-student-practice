import { StubPage } from "@/components/stub-page";

interface AdminDocumentsPageProps {
  params: Promise<{ cohortId: string }>;
}

export default async function AdminDocumentsPage({
  params,
}: AdminDocumentsPageProps) {
  const { cohortId } = await params;

  return (
    <StubPage
      title={`Документы (когорта ${cohortId})`}
      day={9}
      dayTitle="Админ-панель: вкладка «Документы»"
    />
  );
}
