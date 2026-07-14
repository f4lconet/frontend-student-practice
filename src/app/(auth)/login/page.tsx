"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import { ApiError } from "@/lib/api";
import { resendVerification } from "@/lib/api/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsPending(true);
    form.clearErrors();
    setUnverifiedEmail(null);

    try {
      const user = await login(data.email, data.password);

      toast.success("Вы успешно вошли в систему");

      // Редирект по роли
      if (user.role === "ADMIN") {
        router.push("/cohorts");
      } else {
        router.push("/applications");
      }

      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 && error.body && typeof error.body === "object" && "error" in error.body) {
          const errBody = error.body as { error?: { code?: string } };
          if (errBody.error?.code === "AUTHENTICATION_ERROR") {
            // Email не подтверждён
            setUnverifiedEmail(data.email);
            form.setError("root", {
              message: "Пожалуйста, подтвердите email перед входом. Проверьте почту.",
            });
          } else {
            form.setError("password", {
              message: "Неверный email или пароль",
            });
          }
        } else {
          form.setError("root", {
            message: error.message,
          });
          toast.error(error.message);
        }
      } else {
        form.setError("root", {
          message: "Произошла ошибка при входе. Попробуйте позже.",
        });
        toast.error("Произошла ошибка при входе");
      }
    } finally {
      setIsPending(false);
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await resendVerification(unverifiedEmail);
      toast.success("Письмо отправлено повторно. Проверьте почту.");
    } catch {
      toast.error("Ошибка при отправке письма");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Вход</CardTitle>
          <CardDescription>
            Введите email и пароль для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        autoComplete="current-password"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {unverifiedEmail && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="mb-2 text-amber-800">
                    Почта не подтверждена. Проверьте папку «Входящие» или «Спам».
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? "Отправка..." : "Отправить письмо повторно"}
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
            <p>
              <Link
                href="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Забыли пароль?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}