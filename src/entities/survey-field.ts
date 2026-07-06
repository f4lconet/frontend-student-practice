export type SurveyFieldType = "text" | "select";

export interface SurveyField {
  id: string;
  cohort_id: string;
  label: string;
  type: SurveyFieldType;
  /** Варианты для поля типа select */
  options: string[] | null;
  order: number;
}
