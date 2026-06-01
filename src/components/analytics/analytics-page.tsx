import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { ChannelPie, DeliveryChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { campaigns, channelData, contacts, seriesData } from "@/lib/mock-data";
import {
  type AnalyticsPeriod,
  buildAnalyticsKpis,
  buildStatusChartData,
  computeCampaignAnalytics,
  computeContactAnalytics,
  computeSeriesTotals,
  sliceSeriesByPeriod,
} from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";
import { CampaignStatusPie, ContactGroupsChart, FailureBarChart } from "./analytics-charts";
import { CampaignPerformanceTable } from "./campaign-performance-table";

const periods: { id: AnalyticsPeriod; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const chartSeries = useMemo(() => sliceSeriesByPeriod(seriesData, period), [period]);
  const seriesTotals = useMemo(() => computeSeriesTotals(chartSeries), [chartSeries]);
  const campaignStats = useMemo(() => computeCampaignAnalytics(campaigns), []);
  const contactStats = useMemo(() => computeContactAnalytics(contacts), []);
  const kpis = useMemo(
    () => buildAnalyticsKpis(seriesTotals, campaignStats),
    [seriesTotals, campaignStats],
  );
  const statusChartData = useMemo(
    () => buildStatusChartData(campaignStats.byStatus),
    [campaignStats.byStatus],
  );

  const failureBarData = useMemo(
    () =>
      chartSeries.map((p) => ({
        date: p.date,
        failed: p.failed,
        delivered: p.delivered,
      })),
    [chartSeries],
  );

  return (
    <div className="space-y-5">
      <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Reporting period</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivery, failures, and campaign breakdown for the selected range
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={period === p.id ? "default" : "outline"}
              onClick={() => setPeriod(p.id)}
              className={cn(
                period === p.id && "gradient-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </GlassCard>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((m, i) => (
          <KpiCard key={m.label} metric={m} index={i} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5" glow>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Delivery trend</h2>
              <p className="text-xs text-muted-foreground">Sent vs. delivered over time</p>
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
          <DeliveryChart data={chartSeries} />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Campaign status</h2>
            <p className="text-xs text-muted-foreground">Distribution by state</p>
          </div>
          <CampaignStatusPie data={statusChartData} />
          <div className="space-y-2 mt-2">
            {statusChartData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="tabular-nums font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5" glow>
          <div className="mb-4">
            <h2 className="text-base font-semibold">Delivered vs. failed</h2>
            <p className="text-xs text-muted-foreground">Stacked volume by day</p>
          </div>
          <FailureBarChart data={failureBarData} />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-2">
            <h2 className="text-base font-semibold">Message channels</h2>
            <p className="text-xs text-muted-foreground">Traffic mix by type</p>
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Contact segments</h2>
            <p className="text-xs text-muted-foreground">
              {contactStats.total.toLocaleString("en-IN")} contacts across groups
            </p>
          </div>
          <ContactGroupsChart data={contactStats.byGroup} />
        </GlassCard>

        <GlassCard className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Audience health</h2>
            <p className="text-xs text-muted-foreground">Contact list status</p>
          </div>
          <ul className="space-y-3">
            {(
              [
                ["active", "Active", "var(--color-chart-2)"],
                ["unsubscribed", "Unsubscribed", "var(--color-chart-3)"],
                ["bounced", "Bounced", "var(--color-destructive)"],
              ] as const
            ).map(([key, label, color]) => {
              const count = contactStats.byStatus[key] ?? 0;
              const pct = contactStats.total ? +((count / contactStats.total) * 100).toFixed(1) : 0;
              return (
                <li key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="tabular-nums font-medium">
                      {count.toLocaleString("en-IN")} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </section>

      <CampaignPerformanceTable campaigns={campaignStats.topByVolume} />
    </div>
  );
}
