/**
 * Zod-схемы валидации для форм авторизации.
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(6, "Минимальная длина пароля — 6 символов"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Введите email")
      .email("Некорректный email"),
    password: z
      .string()
      .min(6, "Минимальная длина пароля — 6 символов"),
    confirmPassword: z
      .string()
      .min(1, "Подтвердите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;