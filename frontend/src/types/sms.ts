export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  recipients: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  cost: number;
  sender: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string;
  status: "active" | "unsubscribed" | "bounced";
  addedAt: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
  spark: number[];
}

export interface SeriesPoint {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface ChannelSlice {
  name: string;
  value: number;
  color: string;
}
