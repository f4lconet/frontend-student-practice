export interface TaskCard {
  id: string;
  user_id: string;
  cohort_id: string;
  date: string;
  title: string;
  description: string;
  artifact_link: string | null;
  updated_at: string;
}
