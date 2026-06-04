import { Worker } from "bullmq";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { db } from "../db/client.js";
import {
  campaignRecipients,
  campaigns,
  smsDeliveryLogs,
  contacts,
  contactGroups,
} from "../db/schema/index.js";
import { getSmsProvider } from "../integrations/sms/index.js";
import type { SmsJobPayload, ImportJobPayload } from "../shared/queue.js";
import { createNotification } from "../modules/notifications/notifications.service.js";
import { cacheDel } from "../shared/redis.js";

const connection = { url: getEnv().REDIS_URL };

async function processSmsBatch(job: { data: SmsJobPayload }) {
  const { campaignId, userId, recipientIds } = job.data;
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });
  if (!campaign) return;

  const recipients = await db.query.campaignRecipients.findMany({
    where: and(
      eq(campaignRecipients.campaignId, campaignId),
      inArray(campaignRecipients.id, recipientIds),
    ),
  });

  const provider = getSmsProvider();
  const results = await provider.sendBatch(
    recipients.map((r) => ({ phone: r.phone, message: campaign.messageBody })),
    campaign.senderId,
  );

  let delivered = 0;
  let failed = 0;

  for (const result of results) {
    const recipient = recipients.find((r) => r.phone === result.phone);
    if (!recipient) continue;

    if (result.success) {
      delivered++;
      await db
        .update(campaignRecipients)
        .set({
          status: "delivered",
          providerMessageId: result.messageId,
          sentAt: new Date(),
          deliveredAt: new Date(),
        })
        .where(eq(campaignRecipients.id, recipient.id));
    } else {
      failed++;
      await db
        .update(campaignRecipients)
        .set({
          status: "failed",
          errorCode: result.error?.slice(0, 50),
          sentAt: new Date(),
        })
        .where(eq(campaignRecipients.id, recipient.id));
    }
  }

  await db
    .update(campaigns)
    .set({
      deliveredCount: sql`${campaigns.deliveredCount} + ${delivered}`,
      failedCount: sql`${campaigns.failedCount} + ${failed}`,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  const today = new Date().toISOString().slice(0, 10);
  const existingLog = await db.query.smsDeliveryLogs.findFirst({
    where: and(
      eq(smsDeliveryLogs.userId, userId),
      eq(smsDeliveryLogs.campaignId, campaignId),
      eq(smsDeliveryLogs.date, today),
    ),
  });

  if (existingLog) {
    await db
      .update(smsDeliveryLogs)
      .set({
        sent: sql`${smsDeliveryLogs.sent} + ${recipients.length}`,
        delivered: sql`${smsDeliveryLogs.delivered} + ${delivered}`,
        failed: sql`${smsDeliveryLogs.failed} + ${failed}`,
      })
      .where(eq(smsDeliveryLogs.id, existingLog.id));
  } else {
    await db.insert(smsDeliveryLogs).values({
      userId,
      campaignId,
      date: today,
      sent: recipients.length,
      delivered,
      failed,
    });
  }

  const pending = await db.query.campaignRecipients.findFirst({
    where: and(
      eq(campaignRecipients.campaignId, campaignId),
      eq(campaignRecipients.status, "pending"),
    ),
  });

  if (!pending) {
    await db
      .update(campaigns)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    await createNotification({
      userId,
      type: "campaign_complete",
      title: "Campaign completed",
      body: `"${campaign.name}" has finished sending.`,
    });
  }

  await cacheDel(`analytics:*:${userId}*`);
}

async function processContactImport(job: { data: ImportJobPayload }) {
  const { userId, csvContent, groupId } = job.data;
  const lines = csvContent.trim().split("\n").slice(1);
  let group = groupId ?? null;

  if (!group) {
    let defaultGroup = await db.query.contactGroups.findFirst({
      where: and(eq(contactGroups.userId, userId), eq(contactGroups.name, "General")),
    });
    if (!defaultGroup) {
      [defaultGroup] = await db
        .insert(contactGroups)
        .values({ userId, name: "General" })
        .returning();
    }
    group = defaultGroup.id;
  }

  for (const line of lines) {
    const [name, phone] = line.split(",").map((s) => s.trim());
    if (!name || !phone) continue;
    try {
      await db.insert(contacts).values({
        userId,
        groupId: group,
        name,
        phone,
        status: "active",
      });
    } catch {
      // skip duplicates
    }
  }
}

export function startWorkers() {
  const smsWorker = new Worker<SmsJobPayload>("sms-send", processSmsBatch, { connection });
  const importWorker = new Worker<ImportJobPayload>("contact-import", processContactImport, {
    connection,
  });

  smsWorker.on("failed", (job, err) => {
    console.error(`SMS job ${job?.id} failed:`, err);
  });
  importWorker.on("failed", (job, err) => {
    console.error(`Import job ${job?.id} failed:`, err);
  });

  console.log("Workers started: sms-send, contact-import");
  return { smsWorker, importWorker };
}
