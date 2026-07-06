import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Практика</CardTitle>
          <CardDescription>
            Сервис для организации приёма студентов на практику
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/survey/2026" />} nativeButton={false}>
            Публичная анкета
          </Button>
          <Button
            variant="outline"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Вход
          </Button>
          <Button
            variant="outline"
            render={<Link href="/applications" />}
            nativeButton={false}
          >
            Личный кабинет
          </Button>
          <Button
            variant="outline"
            render={<Link href="/cohorts" />}
            nativeButton={false}
          >
            Админ-панель
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
