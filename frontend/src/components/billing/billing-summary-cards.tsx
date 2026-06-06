import { AlertCircle, IndianRupee, MessageSquare, Wallet } from "lucide-react";
import { GlassCard } from "@/components/dashboard/glass-card";
import { formatInr, SMS_RATE_INR } from "@/lib/billing-pricing";
import { cn } from "@/lib/utils";

interface UsageItem {
  campaignId: string;
  campaignName: string;
  smsCount: number;
  costInr: number;
  rateInr: number;
}

interface Props {
  usage: UsageItem[];
  balanceInr: number;
}

export function BillingSummaryCards({ usage, balanceInr }: Props) {
  const billableSms = usage.reduce((s, u) => s + u.smsCount, 0);
  const usageChargeInr = usage.reduce((s, u) => s + u.costInr, 0);
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
