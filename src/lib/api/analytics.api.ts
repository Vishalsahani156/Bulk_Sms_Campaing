import { apiRequest } from "./client";
import type { KpiMetric, SeriesPoint, ChannelSlice, Campaign, Contact } from "@/types/sms";
import type { AnalyticsPeriod } from "@/lib/analytics-utils";

export async function getAnalyticsOverview() {
  return apiRequest<{ kpis: KpiMetric[]; contactCount: number }>("/analytics/overview");
}

export async function getAnalyticsTimeseries(period: AnalyticsPeriod = "30d") {
  return apiRequest<{ points: SeriesPoint[] }>(`/analytics/timeseries?period=${period}`);
}

export async function getAnalyticsChannels() {
  return apiRequest<{ slices: ChannelSlice[] }>("/analytics/channels");
}

export async function getAnalyticsCampaigns(period: AnalyticsPeriod = "30d") {
  return apiRequest<{ items: Campaign[] }>(`/analytics/campaigns?period=${period}`);
}

export async function getAnalyticsContacts() {
  return apiRequest<{
    total: number;
    byStatus: Record<string, number>;
    byGroup: Array<{ name: string; count: number; pct: number }>;
  }>("/analytics/contacts");
}

export async function getNotifications(unreadOnly?: boolean) {
  return apiRequest<{
    items: Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      readAt: string | null;
      createdAt: string;
    }>;
    unreadCount: number;
  }>(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`);
}

export async function markNotificationRead(id: string) {
  return apiRequest<unknown>(`/notifications/${id}/read`, { method: "PATCH" });
}
