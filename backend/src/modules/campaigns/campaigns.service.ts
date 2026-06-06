import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  campaigns,
  campaignRecipients,
  contacts,
  smsTemplates,
} from "../../db/schema/index.js";
import { notFound, badRequest } from "../../shared/errors.js";
import { paginatedResponse, parsePagination } from "../../shared/pagination.js";
import { debitWallet } from "../billing/billing.service.js";
import { SMS_RATE_INR, formatDecimal } from "../../shared/pricing.js";
import { enqueueSmsBatch } from "../../shared/queue.js";
import { logAudit } from "../../shared/audit.js";

export function mapCampaign(c: typeof campaigns.$inferSelect) {
  const recipients = c.recipientsCount;
  const delivered = c.deliveredCount;
  const deliveryRate = recipients > 0 ? +((delivered / recipients) * 100).toFixed(1) : 0;
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    recipients,
    delivered,
    failed: c.failedCount,
    deliveryRate,
    cost: formatDecimal(c.costInr),
    sender: c.senderId,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function listCampaigns(
  userId: string,
  params: { status?: string; search?: string; page?: number; limit?: number; sort?: string },
) {
  const { page, limit, offset } = parsePagination(params);
  let items = await db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
    orderBy: [desc(campaigns.createdAt)],
  });

  if (params.status) items = items.filter((c) => c.status === params.status);
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q));
  }

  const pageItems = items.slice(offset, offset + limit).map(mapCampaign);
  return paginatedResponse(pageItems, items.length, page, limit);
}

export async function getCampaign(userId: string, id: string) {
  const c = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });
  if (!c) throw notFound("Campaign not found");
  return mapCampaign(c);
}

export async function createCampaign(
  userId: string,
  input: {
    name: string;
    templateId?: string;
    messageBody: string;
    senderId?: string;
    contactIds?: string[];
    groupId?: string;
    scheduledAt?: string;
  },
) {
  let messageBody = input.messageBody;
  if (input.templateId) {
    const tpl = await db.query.smsTemplates.findFirst({
      where: and(eq(smsTemplates.id, input.templateId), eq(smsTemplates.userId, userId)),
    });
    if (tpl) messageBody = tpl.body;
  }

  let contactList: typeof contacts.$inferSelect[] = [];
  if (input.contactIds?.length) {
    contactList = await db.query.contacts.findMany({
      where: and(eq(contacts.userId, userId), inArray(contacts.id, input.contactIds)),
    });
  } else {
    contactList = await db.query.contacts.findMany({
      where: and(eq(contacts.userId, userId), eq(contacts.status, "active")),
    });
  }

  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId,
      templateId: input.templateId ?? null,
      name: input.name,
      status: input.scheduledAt ? "scheduled" : "draft",
      senderId: input.senderId ?? "PULSE",
      messageBody,
      recipientsCount: contactList.length,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    })
    .returning();

  if (contactList.length > 0) {
    await db.insert(campaignRecipients).values(
      contactList.map((c) => ({
        campaignId: campaign.id,
        contactId: c.id,
        phone: c.phone,
        status: "pending" as const,
      })),
    );
  }

  return mapCampaign(campaign);
}

export async function updateCampaign(
  userId: string,
  id: string,
  input: Partial<{ name: string; messageBody: string; senderId: string; scheduledAt: string }>,
) {
  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });
  if (!existing) throw notFound("Campaign not found");
  if (existing.status !== "draft" && existing.status !== "scheduled") {
    throw badRequest("Cannot update campaign in current status");
  }

  const [c] = await db
    .update(campaigns)
    .set({
      ...(input.name && { name: input.name }),
      ...(input.messageBody && { messageBody: input.messageBody }),
      ...(input.senderId && { senderId: input.senderId }),
      ...(input.scheduledAt && { scheduledAt: new Date(input.scheduledAt), status: "scheduled" }),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id))
    .returning();
  return mapCampaign(c);
}

export async function sendCampaign(userId: string, id: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });
  if (!campaign) throw notFound("Campaign not found");
  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    throw badRequest("Campaign cannot be sent in current status");
  }

  const recipients = await db.query.campaignRecipients.findMany({
    where: eq(campaignRecipients.campaignId, id),
  });
  if (recipients.length === 0) throw badRequest("No recipients in campaign");

  const estimatedCost = recipients.length * SMS_RATE_INR.default;
  await debitWallet(userId, estimatedCost, id, `Campaign send: ${campaign.name}`);

  await db
    .update(campaigns)
    .set({
      status: "sending",
      startedAt: new Date(),
      costInr: estimatedCost.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id));

  const batchSize = 50;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await enqueueSmsBatch({
      campaignId: id,
      userId,
      recipientIds: batch.map((r) => r.id),
    });
  }

  await logAudit({ userId, action: "campaign.send", entityType: "campaign", entityId: id });

  return { jobId: `send_${id}`, status: "sending" as const };
}

export async function cancelCampaign(userId: string, id: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });
  if (!campaign) throw notFound("Campaign not found");
  if (campaign.status !== "scheduled") throw badRequest("Only scheduled campaigns can be cancelled");

  const [c] = await db
    .update(campaigns)
    .set({ status: "draft", scheduledAt: null, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  return mapCampaign(c);
}

export async function duplicateCampaign(userId: string, id: string) {
  const original = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });
  if (!original) throw notFound("Campaign not found");

  const [copy] = await db
    .insert(campaigns)
    .values({
      userId,
      templateId: original.templateId,
      name: `${original.name} (Copy)`,
      status: "draft",
      senderId: original.senderId,
      messageBody: original.messageBody,
      recipientsCount: original.recipientsCount,
    })
    .returning();

  const recipients = await db.query.campaignRecipients.findMany({
    where: eq(campaignRecipients.campaignId, id),
  });
  if (recipients.length > 0) {
    await db.insert(campaignRecipients).values(
      recipients.map((r) => ({
        campaignId: copy.id,
        contactId: r.contactId,
        phone: r.phone,
        status: "pending" as const,
      })),
    );
  }

  return mapCampaign(copy);
}
