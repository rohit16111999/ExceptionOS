import { task } from "@renderinc/sdk/workflows";
import { store } from "../lib/memory";
import { process } from "../lib/workflow";
import { Case } from "../lib/types";

export const processException = task(
  {
    name: "processException",
    retry: { maxRetries: 3, waitDurationMs: 1000, backoffScaling: 2 },
    timeoutSeconds: 60,
  },
  async function processException(exceptionCase: Case) {
    const existing = store.cases.find((item) => item.id === exceptionCase.id);
    if (!existing) store.cases.push(exceptionCase);
    await process(exceptionCase);
    const outcome = store.cases.find((item) => item.id === exceptionCase.id)!;
    return { caseId: outcome.id, status: outcome.status, resolution: outcome.resolution };
  },
);
