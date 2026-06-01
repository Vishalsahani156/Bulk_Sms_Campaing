import { Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/dashboard/glass-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  calculateCampaignCostInr,
  formatInr,
  getBillableSmsForCampaign,
  SMS_RATE_INR,
} from "@/lib/billing-pricing";
import type { Campaign } from "@/types/sms";

interface Props {
  campaigns: Campaign[];
}

export function UsageBreakdownTable({ campaigns }: Props) {
  const billableCampaigns = campaigns.filter((c) => getBillableSmsForCampaign(c) > 0);

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
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-right font-medium px-4 py-3">Billable SMS</th>
              <th className="text-right font-medium px-4 py-3">Rate</th>
              <th className="text-right font-medium px-4 py-3">Charge</th>
            </tr>
          </thead>
          <tbody>
            {billableCampaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No billable campaigns yet. Completed or sending campaigns appear here.
                </td>
              </tr>
            ) : (
              billableCampaigns.map((c) => {
                const sms = getBillableSmsForCampaign(c);
                const charge = calculateCampaignCostInr(c);
                return (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-medium">{c.name}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {sms.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                      {formatInr(SMS_RATE_INR.default)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-medium">
                      {formatInr(charge)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
