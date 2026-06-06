import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  campaignRecipients,
  campaigns,
  smsDeliveryLogs,
} from "../../db/schema/index.js";
import { processRazorpayPayment } from "../billing/billing.service.js";
import { cacheDel } from "../../shared/redis.js";

export async function handleSmsDeliveryWebhook(input: {
  messageId?: string;
  status?: string;
  phone?: string;
}) {
  if (!input.messageId && !input.phone) return { updated: false };

  const recipient = await db.query.campaignRecipients.findFirst({
    where: input.messageId
      ? eq(campaignRecipients.providerMessageId, input.messageId)
      : eq(campaignRecipients.phone, input.phone!),
  });

  if (!recipient) return { updated: false };

  const normalizedStatus = input.status?.toLowerCase();
  const isDelivered = normalizedStatus === "delivered" || normalizedStatus === "success";
  const isFailed =
    normalizedStatus === "failed" ||
    normalizedStatus === "undelivered" ||
    normalizedStatus === "rejected";

  if (!isDelivered && !isFailed) return { updated: false };
  if (recipient.status === "delivered" || recipient.status === "failed") {
    return { updated: false };
  }

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, recipient.campaignId),
  });
  if (!campaign) return { updated: false };

  const wasSent = recipient.status === "sent" || recipient.status === "pending";

  if (isDelivered) {
    await db
      .update(campaignRecipients)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        sentAt: recipient.sentAt ?? new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));

    if (wasSent) {
      await db
        .update(campaigns)
        .set({
          deliveredCount: sql`${campaigns.deliveredCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaign.id));
    }
  } else {
    await db
      .update(campaignRecipients)
      .set({
        status: "failed",
        errorCode: input.status?.slice(0, 50),
        sentAt: recipient.sentAt ?? new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));

    if (wasSent) {
      await db
        .update(campaigns)
        .set({
          failedCount: sql`${campaigns.failedCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaign.id));
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const existingLog = await db.query.smsDeliveryLogs.findFirst({
    where: and(
      eq(smsDeliveryLogs.userId, campaign.userId),
      eq(smsDeliveryLogs.campaignId, campaign.id),
      eq(smsDeliveryLogs.date, today),
    ),
  });

  if (existingLog) {
    await db
      .update(smsDeliveryLogs)
      .set(
        isDelivered
          ? { delivered: sql`${smsDeliveryLogs.delivered} + 1` }
          : { failed: sql`${smsDeliveryLogs.failed} + 1` },
      )
      .where(eq(smsDeliveryLogs.id, existingLog.id));
  } else {
    await db.insert(smsDeliveryLogs).values({
      userId: campaign.userId,
      campaignId: campaign.id,
      date: today,
      sent: 0,
      delivered: isDelivered ? 1 : 0,
      failed: isFailed ? 1 : 0,
    });
  }

  await cacheDel(`analytics:*:${campaign.userId}*`);
  return { updated: true };
}

export async function handleRazorpayWebhook(payload: {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        method?: string;
        notes?: Record<string, string>;
      };
    };
  };
}) {
  if (payload.event !== "payment.captured") {
    return { processed: false };
  }

  const payment = payload.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) {
    return { processed: false };
  }

  const userId = payment.notes?.userId;
  if (!userId) {
    return { processed: false };
  }

  const result = await processRazorpayPayment({
    userId,
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
    paymentMethod: payment.method,
    amountPaise: payment.amount,
  });

  return { processed: true, ...result };
}
