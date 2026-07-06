export interface Cohort {
  id: string;
  /** Название / год потока практики (например, «2026») */
  name: string;
  application_start: string;
  application_end: string;
  practice_start: string;
  practice_end: string;
}
