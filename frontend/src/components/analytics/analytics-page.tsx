import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { ChannelPie, DeliveryChart } from "@/components/dashboard/charts";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { Button } from "@/components/ui/button";
import {
  type AnalyticsPeriod,
  buildAnalyticsKpis,
  buildStatusChartData,
  computeSeriesTotals,
} from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";
import {
  useAnalyticsOverview,
  useAnalyticsTimeseries,
  useAnalyticsChannels,
  useAnalyticsCampaigns,
  useAnalyticsContacts,
} from "@/hooks/use-analytics";
import { CampaignStatusPie, ContactGroupsChart, FailureBarChart } from "./analytics-charts";
import { CampaignPerformanceTable } from "./campaign-performance-table";

const periods: { id: AnalyticsPeriod; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: timeseries, isLoading: seriesLoading } = useAnalyticsTimeseries(period);
  const { data: channels, isLoading: channelsLoading } = useAnalyticsChannels();
  const { data: campaignItems, isLoading: campaignsLoading } = useAnalyticsCampaigns(period);
  const { data: contactStats, isLoading: contactsLoading } = useAnalyticsContacts();

  const chartSeries = useMemo(() => timeseries?.points ?? [], [timeseries]);
  const seriesTotals = useMemo(() => computeSeriesTotals(chartSeries), [chartSeries]);
  const kpis = useMemo(() => {
    if (!overview) return [];
    const campaignStats = {
      totalSent: seriesTotals.sent,
      totalDelivered: seriesTotals.delivered,
      totalFailed: seriesTotals.failed,
      deliveryRate: seriesTotals.deliveryRate,
      byStatus: {} as Record<string, number>,
      topByVolume: [],
      activeCount: 0,
    };
    return buildAnalyticsKpis(seriesTotals, campaignStats);
  }, [overview, seriesTotals]);

  const statusChartData = useMemo(() => buildStatusChartData({}), []);

  const failureBarData = useMemo(
    () =>
      chartSeries.map((p) => ({
        date: p.date,
        failed: p.failed,
        delivered: p.delivered,
      })),
    [chartSeries],
  );

  const isLoading =
    overviewLoading || seriesLoading || channelsLoading || campaignsLoading || contactsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const channelData = channels?.slices ?? [];

  return (
    <div className="space-y-5">
      <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Analytics</h2>
            <p className="text-xs text-muted-foreground">
              Delivery performance, campaign breakdown, and contact insights
            </p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-lg glass-strong">
          {periods.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p.id)}
              className={cn("text-xs h-8", period === p.id && "bg-primary/15 text-primary")}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </GlassCard>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(overview?.kpis ?? kpis).map((m, i) => (
          <KpiCard key={m.label} metric={m} index={i} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5" glow>
          <div className="mb-4">
            <h2 className="text-base font-semibold">Delivery trends</h2>
            <p className="text-xs text-muted-foreground">Sent vs delivered over time</p>
          </div>
          <DeliveryChart data={chartSeries} />
        </GlassCard>
        <GlassCard className="p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Channel mix</h2>
            <p className="text-xs text-muted-foreground">Template type distribution</p>
          </div>
          <ChannelPie data={channelData} />
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-4">Campaign status</h2>
          <CampaignStatusPie data={statusChartData} />
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-4">Delivery vs failures</h2>
          <FailureBarChart data={failureBarData} />
        </GlassCard>
      </section>

      <GlassCard className="p-5">
        <h2 className="text-base font-semibold mb-4">Campaign performance</h2>
        <CampaignPerformanceTable campaigns={campaignItems ?? []} />
      </GlassCard>

      {contactStats && (
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-4">Contact groups</h2>
          <ContactGroupsChart data={contactStats.byGroup} />
        </GlassCard>
      )}
    </div>
  );
}
