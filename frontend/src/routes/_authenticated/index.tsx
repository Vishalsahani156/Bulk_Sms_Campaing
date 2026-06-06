import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle, Send, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { ChannelPie, DeliveryChart } from "@/components/dashboard/charts";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useAnalyticsOverview, useAnalyticsTimeseries, useAnalyticsChannels } from "@/hooks/use-analytics";
import { useCampaigns } from "@/hooks/use-campaigns";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Pulse SMS — Dashboard" },
      { name: "description", content: "Premium bulk SMS dashboard for modern teams." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: timeseries, isLoading: seriesLoading } = useAnalyticsTimeseries("30d");
  const { data: channels, isLoading: channelsLoading } = useAnalyticsChannels();
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ limit: 5 });

  if (overviewLoading || seriesLoading || channelsLoading || campaignsLoading) {
    return (
      <DashboardLayout title="Overview" subtitle="Real-time messaging performance across all channels">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const kpiMetrics = overview?.kpis ?? [];
  const seriesData = timeseries?.points ?? [];
  const channelData = channels?.slices ?? [];
  const campaigns = campaignsData?.items ?? [];

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Real-time messaging performance across all channels"
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiMetrics.map((m, i) => (
          <KpiCard key={m.label} metric={m} index={i} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        <GlassCard className="lg:col-span-2 p-5" glow>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Message volume</h2>
              <p className="text-xs text-muted-foreground">Last 30 days · sent vs. delivered</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-chart-1)]" /> Sent
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-chart-2)]" /> Delivered
              </div>
            </div>
          </div>
          <DeliveryChart data={seriesData} />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Traffic mix</h2>
            <p className="text-xs text-muted-foreground">Message type distribution</p>
          </div>
          <ChannelPie data={channelData} />
          <div className="space-y-2 mt-2">
            {channelData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="tabular-nums font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {[
          { icon: Send, label: "Avg send speed", value: "—", hint: "From live campaigns" },
          { icon: MessageCircle, label: "Response rate", value: "—", hint: "Coming soon" },
          {
            icon: Users,
            label: "Active contacts",
            value: String(overview?.contactCount ?? 0),
            hint: "Total in workspace",
          },
        ].map((s, i) => (
          <GlassCard key={s.label} className="p-5" transition={{ delay: 0.1 + i * 0.05 }}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg glass-strong flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight mt-0.5">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-[var(--color-success)]" />
                  {s.hint}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Recent campaigns</h2>
            <p className="text-xs text-muted-foreground">Manage, monitor and analyze every send.</p>
          </div>
        </div>
        <CampaignsTable data={campaigns} />
      </section>
    </DashboardLayout>
  );
}
