import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethodType } from "@/types/billing";
import { cn } from "@/lib/utils";

const labels: Record<PaymentMethodType, string> = {
  upi: "UPI",
  gpay: "Google Pay",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
};

function MethodIcon({ type }: { type: PaymentMethodType }) {
  const className = "h-3 w-3";
  if (type === "card" || type === "netbanking") return <CreditCard className={className} />;
  if (type === "gpay" || type === "wallet") return <Wallet className={className} />;
  return <Smartphone className={className} />;
}

interface Props {
  method: PaymentMethodType;
  className?: string;
}

export function PaymentMethodBadge({ method, className }: Props) {
  return (
    <Badge variant="secondary" className={cn("gap-1 font-normal", className)}>
      <MethodIcon type={method} />
      {labels[method]}
    </Badge>
  );
}
