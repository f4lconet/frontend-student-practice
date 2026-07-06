export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
