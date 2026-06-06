import { useQuery } from "@tanstack/react-query";
import type { AnalyticsPeriod } from "@/lib/analytics-utils";
import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsChannels,
  getAnalyticsCampaigns,
  getAnalyticsContacts,
} from "@/lib/api/analytics.api";

export function useAnalyticsOverview() {
  return useQuery({ queryKey: ["analytics", "overview"], queryFn: getAnalyticsOverview });
}

export function useAnalyticsTimeseries(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ["analytics", "timeseries", period],
    queryFn: () => getAnalyticsTimeseries(period),
  });
}

export function useAnalyticsChannels() {
  return useQuery({ queryKey: ["analytics", "channels"], queryFn: getAnalyticsChannels });
}

export function useAnalyticsCampaigns(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ["analytics", "campaigns", period],
    queryFn: async () => {
      const res = await getAnalyticsCampaigns(period);
      return res.items;
    },
  });
}

export function useAnalyticsContacts() {
  return useQuery({ queryKey: ["analytics", "contacts"], queryFn: getAnalyticsContacts });
}
