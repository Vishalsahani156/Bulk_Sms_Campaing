import { eq, and, gte } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  campaigns,
  contacts,
  smsDeliveryLogs,
  smsTemplates,
} from "../../db/schema/index.js";
import { cacheGet, cacheSet } from "../../shared/redis.js";
import { formatDecimal } from "../../shared/pricing.js";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

function periodDays(period: AnalyticsPeriod) {
  return period === "7d" ? 7 : period === "30d" ? 30 : 90;
}

export async function getOverview(userId: string) {
  const cacheKey = `analytics:overview:${userId}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
  });
  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
  });

  const totalSent = userCampaigns.reduce((s, c) => s + c.recipientsCount, 0);
  const totalDelivered = userCampaigns.reduce((s, c) => s + c.deliveredCount, 0);
  const deliveryRate = totalSent > 0 ? +((totalDelivered / totalSent) * 100).toFixed(1) : 0;
  const activeCampaigns = userCampaigns.filter(
    (c) => c.status === "sending" || c.status === "scheduled",
  ).length;
  const revenue = userCampaigns.reduce((s, c) => s + formatDecimal(c.costInr), 0);

  const kpis = [
    {
      label: "Messages Sent",
      value: totalSent >= 1_000_000 ? `${(totalSent / 1_000_000).toFixed(2)}M` : String(totalSent),
      change: 0,
      trend: "up" as const,
      spark: [],
    },
    {
      label: "Delivery Rate",
      value: `${deliveryRate}%`,
      change: 0,
      trend: "up" as const,
      spark: [],
    },
    {
      label: "Active Campaigns",
      value: String(activeCampaigns),
      change: 0,
      trend: "down" as const,
      spark: [],
    },
    {
      label: "Revenue",
      value: `₹${revenue.toFixed(0)}`,
      change: 0,
      trend: "up" as const,
      spark: [],
    },
  ];

  await cacheSet(cacheKey, { kpis, contactCount: userContacts.length }, 300);
  return { kpis, contactCount: userContacts.length };
}

export async function getTimeseries(userId: string, period: AnalyticsPeriod) {
  const cacheKey = `analytics:series:${userId}:${period}`;
  const cached = await cacheGet<{ points: unknown[] }>(cacheKey);
  if (cached) return cached;

  const days = periodDays(period);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await db.query.smsDeliveryLogs.findMany({
    where: and(eq(smsDeliveryLogs.userId, userId), gte(smsDeliveryLogs.date, since.toISOString().slice(0, 10))),
  });

  const points = logs.length
    ? logs.map((l) => ({
        date: l.date,
        sent: l.sent,
        delivered: l.delivered,
        failed: l.failed,
      }))
    : Array.from({ length: Math.min(days, 30) }, (_, i) => ({
        date: `Day ${i + 1}`,
        sent: 0,
        delivered: 0,
        failed: 0,
      }));

  const result = { points };
  await cacheSet(cacheKey, result, 900);
  return result;
}

export async function getChannels(userId: string) {
  const templates = await db.query.smsTemplates.findMany({
    where: eq(smsTemplates.userId, userId),
  });
  const counts: Record<string, number> = {};
  for (const t of templates) {
    counts[t.type] = (counts[t.type] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];
  const slices = Object.entries(counts).map(([name, count], i) => ({
    name,
    value: +((count / total) * 100).toFixed(0),
    color: colors[i % colors.length],
  }));
  if (slices.length === 0) {
    return {
      slices: [
        { name: "Marketing", value: 48, color: colors[0] },
        { name: "Transactional", value: 32, color: colors[1] },
        { name: "OTP", value: 14, color: colors[2] },
        { name: "Alerts", value: 6, color: colors[3] },
      ],
    };
  }
  return { slices };
}

export async function getCampaignPerformance(userId: string, period: AnalyticsPeriod) {
  const days = periodDays(period);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
  });

  return userCampaigns
    .filter((c) => c.createdAt >= since)
    .map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      recipients: c.recipientsCount,
      delivered: c.deliveredCount,
      failed: c.failedCount,
      deliveryRate: c.recipientsCount > 0 ? +((c.deliveredCount / c.recipientsCount) * 100).toFixed(1) : 0,
      cost: formatDecimal(c.costInr),
    }))
    .sort((a, b) => b.recipients - a.recipients);
}

export async function getContactAnalytics(userId: string) {
  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
  });
  const byStatus = userContacts.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const byGroup: Record<string, number> = {};
  for (const c of userContacts) {
    const group = c.groupId ?? "General";
    byGroup[group] = (byGroup[group] ?? 0) + 1;
  }
  const total = userContacts.length || 1;
  return {
    total: userContacts.length,
    byStatus,
    byGroup: Object.entries(byGroup).map(([name, count]) => ({
      name,
      count,
      pct: +((count / total) * 100).toFixed(1),
    })),
  };
}
