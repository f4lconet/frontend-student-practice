import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "student" | "admin";

/** Парсинг сессионной куки — в формате `userId|role` */
function parseSessionCookie(cookieValue: string | null): {
  userId: string;
  role: UserRole;
} | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split("|");
  if (parts.length !== 2) return null;

  const [userId, role] = parts;

  if (role !== "student" && role !== "admin") return null;

  return { userId, role };
}

/**
 * Middleware для ролевой модели (п. 3 ТЗ).
 *
 * Защита маршрутов:
 * - (cabinet) — только для практикантов
 * - (admin) — только для админов
 * - /login, /register — редирект авторизованных в зависимости от роли
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("auth_session")?.value ?? null;
  const session = parseSessionCookie(sessionCookie);

  const isAuth = session !== null;
  const role = session?.role ?? null;

  // --- Проверка защищённых групп ---

  // Группа (cabinet): /applications, /documents, /tasks
  if (
    pathname.startsWith("/applications") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/tasks")
  ) {
    if (!isAuth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== "student") {
      // Админ пытается зайти в кабинет практиканта
      return NextResponse.redirect(new URL("/cohorts", request.url));
    }

    return NextResponse.next();
  }

  // Группа (admin): /cohorts, /[cohortId]/applications, /[cohortId]/documents, /[cohortId]/tasks, /[cohortId]/settings
  if (
    pathname.startsWith("/cohorts") ||
    /^\/[^/]+\/(?:applications|documents|tasks|settings)/.test(pathname)
  ) {
    if (!isAuth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role !== "admin") {
      // Практикант пытается зайти в админку
      return NextResponse.redirect(new URL("/applications", request.url));
    }

    return NextResponse.next();
  }

  // --- Редирект с /login и /register если уже авторизован ---
  if (pathname === "/login" || pathname === "/register") {
    if (isAuth) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/cohorts", request.url));
      }
      return NextResponse.redirect(new URL("/applications", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/applications/:path*",
    "/documents/:path*",
    "/tasks/:path*",
    "/cohorts/:path*",
    "/:cohortId([^/]+)/applications/:path*",
    "/:cohortId([^/]+)/documents/:path*",
    "/:cohortId([^/]+)/tasks/:path*",
    "/:cohortId([^/]+)/settings/:path*",
    "/login",
    "/register",
    // Публичные пути НЕ должны обрабатываться middleware:
    // "/survey/:path*" — не включён специально
  ],
};
