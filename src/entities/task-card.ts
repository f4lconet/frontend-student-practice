export interface TaskCard {
  id: string;
  userId: string;
  cohortId?: string;
  date: string;
  title: string;
  description: string;
  artifactLink: string | null;
  createdAt?: string;
  updatedAt?: string;
}