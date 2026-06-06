import { GlassCard } from "@/components/dashboard/glass-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatCompactNumber } from "@/lib/analytics-utils";
import type { Campaign } from "@/types/sms";

interface Props {
  campaigns: Campaign[];
}

export function CampaignPerformanceTable({ campaigns }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-base font-semibold">Campaign performance</h2>
        <p className="text-xs text-muted-foreground">Top sends by volume</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/50">
              <th className="text-left font-medium px-4 py-3">Campaign</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-right font-medium px-4 py-3">Recipients</th>
              <th className="text-right font-medium px-4 py-3">Delivered</th>
              <th className="text-right font-medium px-4 py-3">Failed</th>
              <th className="text-right font-medium px-4 py-3">Delivery %</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No campaigns to show
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-4 py-3.5 font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatCompactNumber(c.recipients)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatCompactNumber(c.delivered)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                    {formatCompactNumber(c.failed)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium">
                    {c.deliveryRate > 0 ? `${c.deliveryRate}%` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
