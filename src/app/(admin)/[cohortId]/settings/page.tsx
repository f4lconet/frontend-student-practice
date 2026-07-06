import { StubPage } from "@/components/stub-page";

interface AdminSettingsPageProps {
  params: Promise<{ cohortId: string }>;
}

export default async function AdminSettingsPage({
  params,
}: AdminSettingsPageProps) {
  const { cohortId } = await params;

  return (
    <StubPage
      title={`Управление когортой (когорта ${cohortId})`}
      day={7}
      dayTitle="Админ-панель: выбор когорты и управление когортами"
    />
  );
}
