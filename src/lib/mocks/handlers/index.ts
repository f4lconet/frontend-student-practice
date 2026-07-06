import { authHandlers } from "./auth";
import { surveyHandlers } from "./survey";
import { applicationsHandlers } from "./applications";
import { documentsHandlers } from "./documents";
import { tasksHandlers } from "./tasks";
import { adminCohortsHandlers } from "./admin-cohorts";
import { adminApplicationsHandlers } from "./admin-applications";
import { adminDocumentsHandlers } from "./admin-documents";
import { adminTasksHandlers } from "./admin-tasks";

export const handlers = [
  ...authHandlers,
  ...surveyHandlers,
  ...applicationsHandlers,
  ...documentsHandlers,
  ...tasksHandlers,
  ...adminCohortsHandlers,
  ...adminApplicationsHandlers,
  ...adminDocumentsHandlers,
  ...adminTasksHandlers,
];

export {
  authHandlers,
  surveyHandlers,
  applicationsHandlers,
  documentsHandlers,
  tasksHandlers,
  adminCohortsHandlers,
  adminApplicationsHandlers,
  adminDocumentsHandlers,
  adminTasksHandlers,
};
