import { GlassCard } from "@/components/dashboard/glass-card";
import { formatInr } from "@/lib/billing-pricing";
import type { BillingTransaction } from "@/types/billing";
import { PaymentMethodBadge } from "./payment-method-badge";

interface Props {
  transactions: BillingTransaction[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function TransactionsTable({ transactions }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-base font-semibold">Transaction history</h2>
        <p className="text-xs text-muted-foreground">Wallet top-ups and adjustments</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/50">
              <th className="text-left font-medium px-4 py-3">Date</th>
              <th className="text-left font-medium px-4 py-3">Type</th>
              <th className="text-left font-medium px-4 py-3">Method</th>
              <th className="text-left font-medium px-4 py-3">Reference</th>
              <th className="text-right font-medium px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions yet. Add credits to get started.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(txn.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 capitalize">
                    {txn.type === "top_up" ? "Top-up" : "Adjustment"}
                  </td>
                  <td className="px-4 py-3.5">
                    <PaymentMethodBadge method={txn.method} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono max-w-[140px] truncate">
                    {txn.razorpayPaymentId ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium text-[oklch(0.82_0.17_155)]">
                    +{formatInr(txn.amountInr)}
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
