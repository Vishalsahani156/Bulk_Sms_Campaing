import type { Campaign, Contact, SeriesPoint } from "@/types/sms";
import type { KpiMetric } from "@/types/sms";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export function sliceSeriesByPeriod(data: SeriesPoint[], period: AnalyticsPeriod): SeriesPoint[] {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return data.slice(-Math.min(days, data.length));
}

export function computeSeriesTotals(data: SeriesPoint[]) {
  const sent = data.reduce((s, p) => s + p.sent, 0);
  const delivered = data.reduce((s, p) => s + p.delivered, 0);
  const failed = data.reduce((s, p) => s + p.failed, 0);
  const deliveryRate = sent > 0 ? +((delivered / sent) * 100).toFixed(1) : 0;
  return { sent, delivered, failed, deliveryRate };
}

export function computeCampaignAnalytics(campaigns: Campaign[]) {
  const active = campaigns.filter((c) => c.status === "completed" || c.status === "sending");
  const totalSent = active.reduce((s, c) => s + c.recipients, 0);
  const totalDelivered = active.reduce((s, c) => s + c.delivered, 0);
  const totalFailed = active.reduce((s, c) => s + c.failed, 0);
  const deliveryRate = totalSent > 0 ? +((totalDelivered / totalSent) * 100).toFixed(1) : 0;

  const byStatus = campaigns.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Campaign["status"], number>,
  );

  const topByVolume = [...campaigns]
    .filter((c) => c.delivered > 0 || c.status === "sending")
    .sort((a, b) => b.recipients - a.recipients)
    .slice(0, 8);

  return {
    totalSent,
    totalDelivered,
    totalFailed,
    deliveryRate,
    byStatus,
    topByVolume,
    activeCount: active.length,
  };
}

export function computeContactAnalytics(contacts: Contact[]) {
  const byStatus = contacts.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Contact["status"], number>,
  );

  const byGroup = contacts.reduce(
    (acc, c) => {
      acc[c.group] = (acc[c.group] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total: contacts.length,
    byStatus,
    byGroup: Object.entries(byGroup).map(([name, count]) => ({
      name,
      count,
      pct: +((count / contacts.length) * 100).toFixed(1),
    })),
  };
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
}

export function buildAnalyticsKpis(
  seriesTotals: ReturnType<typeof computeSeriesTotals>,
  campaignStats: ReturnType<typeof computeCampaignAnalytics>,
): KpiMetric[] {
  return [
    {
      label: "Messages sent",
      value: formatCompactNumber(seriesTotals.sent),
      change: 12.4,
      trend: "up",
      spark: [12, 18, 14, 22, 28, 24, 32, 38, 34, 42, 48, 52],
    },
    {
      label: "Delivery rate",
      value: `${seriesTotals.deliveryRate}%`,
      change: 0.6,
      trend: "up",
      spark: [95, 96, 96, 97, 96, 97, 97, 98, 98, 98, 99, seriesTotals.deliveryRate],
    },
    {
      label: "Failed messages",
      value: formatCompactNumber(seriesTotals.failed),
      change: 2.1,
      trend: "down",
      spark: [8, 7, 9, 6, 7, 8, 6, 5, 7, 6, 5, 4],
    },
    {
      label: "Active campaigns",
      value: String(campaignStats.activeCount),
      change: 3.2,
      trend: "up",
      spark: [4, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, campaignStats.activeCount],
    },
  ];
}

export function buildStatusChartData(
  byStatus: Record<Campaign["status"], number>,
): { name: string; value: number; color: string }[] {
  const colors: Record<Campaign["status"], string> = {
    completed: "var(--color-chart-2)",
    sending: "var(--color-chart-1)",
    scheduled: "var(--color-chart-3)",
    draft: "var(--color-chart-4)",
    failed: "var(--color-destructive)",
  };
  const labels: Record<Campaign["status"], string> = {
    completed: "Completed",
    sending: "Sending",
    scheduled: "Scheduled",
    draft: "Draft",
    failed: "Failed",
  };
  return (Object.keys(byStatus) as Campaign["status"][])
    .filter((k) => (byStatus[k] ?? 0) > 0)
    .map((k) => ({
      name: labels[k],
      value: byStatus[k] ?? 0,
      color: colors[k],
    }));
}
