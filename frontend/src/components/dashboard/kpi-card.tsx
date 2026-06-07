import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { GlassCard } from "./glass-card";
import type { KpiMetric } from "@/types/sms";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  metric: KpiMetric;
  index?: number;
}

export function KpiCard({ metric, index = 0 }: KpiCardProps) {
  const isUp = metric.trend === "up";
  const data = metric.spark.map((v, i) => ({ i, v }));
  const color = isUp ? "var(--color-success)" : "var(--color-destructive)";
  const gradId = `spark-${metric.label.replace(/\s+/g, "-")}`;

  return (
    <GlassCard
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="p-5 group hover:border-[oklch(1_0_0_/_14%)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {metric.label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            isUp
              ? "bg-[oklch(0.72_0.17_155_/_15%)] text-[oklch(0.82_0.17_155)]"
              : "bg-[oklch(0.65_0.22_25_/_15%)] text-[oklch(0.78_0.2_25)]",
          )}
        >
          {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(metric.change)}%
        </div>
      </div>
      <div className="h-14 mt-4 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
