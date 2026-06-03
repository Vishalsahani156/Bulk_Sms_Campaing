import { Queue } from "bullmq";
import { getEnv } from "../config/env.js";

const connection = { url: getEnv().REDIS_URL };

export const smsQueue = new Queue("sms-send", { connection });
export const importQueue = new Queue("contact-import", { connection });

export interface SmsJobPayload {
  campaignId: string;
  userId: string;
  recipientIds: string[];
}

export interface ImportJobPayload {
  userId: string;
  csvContent: string;
  groupId?: string;
}

export async function enqueueSmsBatch(payload: SmsJobPayload) {
  await smsQueue.add("send-batch", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function enqueueContactImport(payload: ImportJobPayload) {
  await importQueue.add("import-csv", payload, {
    attempts: 2,
  });
}
