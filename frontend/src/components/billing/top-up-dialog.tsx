import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_TOP_UP_INR, TOP_UP_PRESETS_INR } from "@/types/billing";
import { formatInr } from "@/lib/billing-pricing";
import { isRazorpayConfigured, openRazorpayTopUpCheckout } from "@/lib/razorpay-checkout";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
  userName?: string;
  onSuccess: (result: {
    amountInr: number;
    method: import("@/types/billing").PaymentMethodType;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    newBalance: number;
  }) => void;
}

export function TopUpDialog({ open, onOpenChange, userEmail, userName, onSuccess }: Props) {
  const [amountInr, setAmountInr] = useState<number>(TOP_UP_PRESETS_INR[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [paying, setPaying] = useState(false);

  const configured = isRazorpayConfigured();

  useEffect(() => {
    if (!open) {
      setPaying(false);
      setUseCustom(false);
      setCustomAmount("");
      setAmountInr(TOP_UP_PRESETS_INR[0]);
    }
  }, [open]);

  const resolvedAmount = useCustom ? Math.round(Number(customAmount) || 0) : amountInr;

  const isValidAmount = resolvedAmount >= MIN_TOP_UP_INR;

  const handlePay = async () => {
    if (!isValidAmount) return;
    setPaying(true);

    await openRazorpayTopUpCheckout({
      amountInr: resolvedAmount,
      userEmail,
      userName,
      onSuccess: (result) => {
        setPaying(false);
        onOpenChange(false);
        onSuccess(result);
      },
      onDismiss: () => setPaying(false),
      onError: () => setPaying(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add credits</DialogTitle>
          <DialogDescription>
            Top up your prepaid wallet. Pay securely with UPI, Google Pay, or card.
          </DialogDescription>
        </DialogHeader>

        {!configured && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            Configure Razorpay keys in <code className="text-xs">.env</code> (
            <code className="text-xs">VITE_RAZORPAY_KEY_ID</code>,{" "}
            <code className="text-xs">RAZORPAY_KEY_SECRET</code>) to enable payments.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quick amounts</Label>
            <div className="flex flex-wrap gap-2">
              {TOP_UP_PRESETS_INR.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={!useCustom && amountInr === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseCustom(false);
                    setAmountInr(preset);
                  }}
                  className={cn(
                    !useCustom &&
                      amountInr === preset &&
                      "gradient-primary text-primary-foreground",
                  )}
                >
                  {formatInr(preset)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom amount (min {formatInr(MIN_TOP_UP_INR)})</Label>
            <Input
              id="custom-amount"
              type="number"
              min={MIN_TOP_UP_INR}
              placeholder={`${MIN_TOP_UP_INR}`}
              value={customAmount}
              onChange={(e) => {
                setUseCustom(true);
                setCustomAmount(e.target.value);
              }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            You will pay:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {isValidAmount ? formatInr(resolvedAmount) : "—"}
            </span>
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={paying}>
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={!configured || !isValidAmount || paying}
            className="gradient-primary text-primary-foreground hover:opacity-90"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Pay with UPI / GPay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
