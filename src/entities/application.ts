export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  user_id: string;
  cohort_id: string;
  status: ApplicationStatus;
  review_comment: string | null;
  role_id: string | null;
}
