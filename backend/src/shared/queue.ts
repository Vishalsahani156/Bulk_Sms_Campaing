import { Queue } from "bullmq";
import { getEnv } from "../config/env.js";

let smsQueue: Queue | null = null;
let importQueue: Queue | null = null;

function getConnection() {
  return { url: getEnv().REDIS_URL };
}

function getSmsQueue() {
  if (!smsQueue) {
    smsQueue = new Queue("sms-send", { connection: getConnection() });
  }
  return smsQueue;
}

function getImportQueue() {
  if (!importQueue) {
    importQueue = new Queue("contact-import", { connection: getConnection() });
  }
  return importQueue;
}

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
  await getSmsQueue().add("send-batch", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function enqueueContactImport(payload: ImportJobPayload) {
  await getImportQueue().add("import-csv", payload, {
    attempts: 2,
  });
}
