import { Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/dashboard/glass-card";
import { formatInr, SMS_RATE_INR } from "@/lib/billing-pricing";

interface UsageItem {
  campaignId: string;
  campaignName: string;
  smsCount: number;
  costInr: number;
  rateInr: number;
}

interface Props {
  usage: UsageItem[];
}

export function UsageBreakdownTable({ usage }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Usage by campaign</h2>
          <p className="text-xs text-muted-foreground">
            Charges based on delivered SMS at {formatInr(SMS_RATE_INR.default)} per message
          </p>
        </div>
        <Link to="/campaigns" className="text-xs text-primary hover:underline">
          View all campaigns →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/50">
              <th className="text-left font-medium px-4 py-3">Campaign</th>
              <th className="text-right font-medium px-4 py-3">Billable SMS</th>
              <th className="text-right font-medium px-4 py-3">Rate</th>
              <th className="text-right font-medium px-4 py-3">Charge</th>
            </tr>
          </thead>
          <tbody>
            {usage.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No billable campaigns yet. Completed or sending campaigns appear here.
                </td>
              </tr>
            ) : (
              usage.map((u) => (
                <tr key={u.campaignId} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-4 py-3.5 font-medium">{u.campaignName}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {u.smsCount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                    {formatInr(u.rateInr)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium">
                    {formatInr(u.costInr)}
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
