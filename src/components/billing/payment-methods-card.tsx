import { CreditCard, Plus, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";
import type { SavedPaymentMethod } from "@/types/billing";
import { PaymentMethodBadge } from "./payment-method-badge";

interface Props {
  methods: SavedPaymentMethod[];
  onAddCredits: () => void;
}

function formatLastUsed(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function PaymentMethodsCard({ methods, onAddCredits }: Props) {
  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Payment methods</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pay with UPI, Google Pay, or card via Razorpay Checkout
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onAddCredits} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add credits
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">UPI</p>
            <p className="text-xs text-muted-foreground">PhonePe, Paytm, BHIM</p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Google Pay</p>
            <p className="text-xs text-muted-foreground">GPay wallet</p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Cards</p>
            <p className="text-xs text-muted-foreground">Debit & credit</p>
          </div>
        </div>
      </div>

      {methods.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recently used
          </p>
          <ul className="space-y-2">
            {methods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <PaymentMethodBadge method={m.type} />
                  <span className="text-sm">{m.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatLastUsed(m.lastUsedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
