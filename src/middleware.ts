import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware для ролевой модели (п. 3 ТЗ).
 *
 * TODO (День 3): защита маршрутов группы (cabinet) — редирект неавторизованных на /login.
 * TODO (День 3): защита маршрутов группы (admin) — редирект неавторизованных на /login
 *   и проверка роли admin.
 * TODO (День 3): редирект авторизованных пользователей с /login и /register в кабинет/админку.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Заготовка: пока пропускаем все запросы без проверки JWT
  void pathname;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/applications/:path*",
    "/documents/:path*",
    "/tasks/:path*",
    "/cohorts/:path*",
    "/:cohortId/applications/:path*",
    "/:cohortId/documents/:path*",
    "/:cohortId/tasks/:path*",
    "/:cohortId/settings/:path*",
    "/login",
    "/register",
  ],
};
