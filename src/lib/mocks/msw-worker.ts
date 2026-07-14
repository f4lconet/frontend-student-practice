import { setupWorker } from "msw/browser";

// Заглушка обработчиков MSW — наполнение по мере разработки
const handlers: never[] = [];

export const worker = setupWorker(...handlers);