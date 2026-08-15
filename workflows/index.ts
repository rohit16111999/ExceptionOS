import { task } from "@renderinc/sdk/workflows";
import { store } from "../lib/memory";
import { process } from "../lib/workflow";

export const processException = task(
  {
    name: "processException",
    retry: { maxRetries: 3, waitDurationMs: 1000, backoffScaling: 2 },
    timeoutSeconds: 60,
  },
  async function processException(caseId: string) {
    const exceptionCase = store.cases.find((item) => item.id === caseId);
    if (!exceptionCase) throw new Error(`Case not found: ${caseId}`);
    await process(exceptionCase);
    const outcome = store.cases.find((item) => item.id === caseId)!;
    return { caseId: outcome.id, status: outcome.status, resolution: outcome.resolution };
  },
);
