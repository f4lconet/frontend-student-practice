export interface StudentDocumentData {
  id: string;
  user_id: string;
  cohort_id: string;
  student_fio: string | null;
  group: string | null;
  direction_code: string | null;
  direction_name: string | null;
  program_name: string | null;
  specialty: string | null;
  practice_topic: string | null;
  main_stage_tasks: string | null;
  review_activities: string | null;
  review_characteristic: string | null;
  /** да/нет + должность */
  review_employed: string | null;
  review_next_practice: string | null;
  review_employment_offer: string | null;
  review_suggestions: string | null;
  review_grade: string | null;
  report_file_url: string | null;
  report_admin_approved: boolean;
}
