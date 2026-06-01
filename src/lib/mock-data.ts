import type { Campaign, Contact, KpiMetric, SeriesPoint, ChannelSlice } from "@/types/sms";
import { calculateCampaignCostInr, formatInrCompact } from "@/lib/billing-pricing";

export const kpiMetrics: KpiMetric[] = [
  {
    label: "Messages Sent",
    value: "2.84M",
    change: 12.4,
    trend: "up",
    spark: [12, 18, 14, 22, 28, 24, 32, 38, 34, 42, 48, 52],
  },
  {
    label: "Delivery Rate",
    value: "98.7%",
    change: 0.6,
    trend: "up",
    spark: [95, 96, 96, 97, 96, 97, 97, 98, 98, 98, 99, 98.7],
  },
  {
    label: "Active Campaigns",
    value: "47",
    change: -3.2,
    trend: "down",
    spark: [52, 50, 51, 49, 48, 50, 49, 48, 47, 48, 47, 47],
  },
  {
    label: "Revenue",
    value: formatInrCompact(48_210),
    change: 24.8,
    trend: "up",
    spark: [22, 25, 28, 30, 34, 32, 38, 42, 40, 44, 46, 48],
  },
];

export const seriesData: SeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 40000 + Math.sin(i / 3) * 12000 + i * 1200;
  const sent = Math.round(base + Math.random() * 8000);
  const delivered = Math.round(sent * (0.96 + Math.random() * 0.03));
  return {
    date: `Day ${day}`,
    sent,
    delivered,
    failed: sent - delivered,
  };
});

export const channelData: ChannelSlice[] = [
  { name: "Marketing", value: 48, color: "var(--color-chart-1)" },
  { name: "Transactional", value: 32, color: "var(--color-chart-2)" },
  { name: "OTP", value: 14, color: "var(--color-chart-3)" },
  { name: "Alerts", value: 6, color: "var(--color-chart-4)" },
];

const statuses: Campaign["status"][] = ["draft", "scheduled", "sending", "completed", "failed"];
const senders = ["BRAND", "ACME", "NOTIFY", "ORDERS", "PROMO"];

export const campaigns: Campaign[] = Array.from({ length: 14 }, (_, i) => {
  const recipients = Math.round(1000 + Math.random() * 80000);
  const delivered = Math.round(recipients * (0.9 + Math.random() * 0.09));
  const status = statuses[i % statuses.length];
  const campaign: Campaign = {
    id: `cmp_${1000 + i}`,
    name: [
      "Black Friday Blast",
      "Order Confirmation",
      "Weekly Newsletter",
      "Flash Sale Alert",
      "Cart Abandonment",
      "Welcome Series",
      "Re-engagement",
      "Holiday Special",
      "Product Launch",
      "Survey Request",
      "Payment Reminder",
      "Event RSVP",
      "Loyalty Reward",
      "Beta Invite",
    ][i],
    status,
    recipients,
    delivered: status === "draft" || status === "scheduled" ? 0 : delivered,
    failed: status === "draft" || status === "scheduled" ? 0 : recipients - delivered,
    deliveryRate: status === "draft" || status === "scheduled" ? 0 : +((delivered / recipients) * 100).toFixed(1),
    cost: 0,
    sender: senders[i % senders.length],
    createdAt: new Date(Date.now() - i * 86400000 * 1.7).toISOString(),
  };
  campaign.cost = calculateCampaignCostInr(campaign);
  return campaign;
});

const contactNames = [
  "Sarah Chen", "Marcus Johnson", "Aisha Patel", "Diego Rivera", "Emma Thompson",
  "Yuki Tanaka", "Olivia Brown", "Ahmed Hassan", "Lena Müller", "Carlos Mendes",
  "Sophia Williams", "James Anderson", "Priya Sharma", "Lucas Silva", "Mia Davis",
  "Noah Wilson", "Fatima Al-Rashid", "Ethan Brown", "Isabella Garcia", "Daniel Lee",
  "Amara Okafor", "Oliver Martinez", "Chloe Kim", "William Taylor", "Zara Khan",
  "Benjamin Clark", "Natalie White", "Raj Patel", "Grace Li", "Alexander Wright",
  "Elena Popov", "Samuel Green", "Ava Johnson", "Mohammed Farooq", "Charlotte King",
  "David Nguyen", "Lily Evans", "Thomas Moore", "Hannah Scott", "Ryan Phillips",
];

const groups = ["VIP", "Customers", "Newsletter", "Prospects", "Beta Testers"];
const contactStatuses: Contact["status"][] = ["active", "active", "active", "unsubscribed", "active", "bounced"];

export const contacts: Contact[] = contactNames.map((name, i) => ({
  id: `ct_${i}`,
  name,
  phone: `+1 (555) ${String(100 + i * 37).padStart(3, "0")}-${String(2000 + i * 113).slice(-4)}`,
  group: groups[i % groups.length],
  status: contactStatuses[i % contactStatuses.length],
  addedAt: new Date(Date.now() - i * 86400000 * 2.3).toISOString(),
}));
