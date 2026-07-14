export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  userId: string;
  cohortId: string;
  cohortName?: string;
  status: ApplicationStatus;
  roleId: string | null;
  reviewComment: string | null;
  createdAt: string;
}