import { AlertCircle, IndianRupee, MessageSquare, Wallet } from "lucide-react";
import { GlassCard } from "@/components/dashboard/glass-card";
import {
  formatInr,
  getBillableSmsCount,
  calculateUsageChargeInr,
  SMS_RATE_INR,
} from "@/lib/billing-pricing";
import type { Campaign } from "@/types/sms";
import { cn } from "@/lib/utils";

interface Props {
  campaigns: Campaign[];
  balanceInr: number;
}

export function BillingSummaryCards({ campaigns, balanceInr }: Props) {
  const billableSms = getBillableSmsCount(campaigns);
  const usageChargeInr = calculateUsageChargeInr(billableSms);
  const amountDueInr = Math.max(0, +(usageChargeInr - balanceInr).toFixed(2));

  const cards = [
    {
      label: "Billable SMS",
      value: billableSms.toLocaleString("en-IN"),
      hint: "Completed & in-flight campaigns",
      icon: MessageSquare,
    },
    {
      label: "Usage charge",
      value: formatInr(usageChargeInr),
      hint: `@ ${formatInr(SMS_RATE_INR.default)} per SMS`,
      icon: IndianRupee,
    },
    {
      label: "Wallet balance",
      value: formatInr(balanceInr),
      hint: "Prepaid credits",
      icon: Wallet,
    },
    {
      label: "Amount due",
      value: formatInr(amountDueInr),
      hint: amountDueInr > 0 ? "Top up to cover usage" : "Fully covered",
      icon: AlertCircle,
      highlight: amountDueInr > 0,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <GlassCard key={card.label} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </p>
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight tabular-nums",
                  card.highlight && "text-[oklch(0.78_0.2_25)]",
                )}
              >
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        </GlassCard>
      ))}
    </section>
  );
}

export function useBillingSummary(campaigns: Campaign[], balanceInr: number) {
  const billableSms = getBillableSmsCount(campaigns);
  const usageChargeInr = calculateUsageChargeInr(billableSms);
  const amountDueInr = Math.max(0, +(usageChargeInr - balanceInr).toFixed(2));
  return { billableSms, usageChargeInr, amountDueInr };
}
