import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBilling } from "@/hooks/use-billing";
import { useAuth } from "@/hooks/use-auth";
import { getUserDisplayName } from "@/lib/auth";
import { campaigns } from "@/lib/mock-data";
import { isRazorpayConfigured } from "@/lib/razorpay-checkout";
import { BillingSummaryCards } from "./billing-summary-cards";
import { UsageBreakdownTable } from "./usage-breakdown-table";
import { TransactionsTable } from "./transactions-table";
import { PaymentMethodsCard } from "./payment-methods-card";
import { TopUpDialog } from "./top-up-dialog";

export function BillingPage() {
  const { user } = useAuth();
  const { balanceInr, transactions, savedMethods, isLoading, applyTopUp } = useBilling();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const displayName = user ? getUserDisplayName(user) : undefined;
  const email = user?.email ?? undefined;
  const razorpayReady = isRazorpayConfigured();

  const handleTopUpSuccess = (result: {
    amountInr: number;
    method: import("@/types/billing").PaymentMethodType;
    razorpayPaymentId: string;
    razorpayOrderId: string;
  }) => {
    applyTopUp({
      amountInr: result.amountInr,
      method: result.method,
      razorpayPaymentId: result.razorpayPaymentId,
      razorpayOrderId: result.razorpayOrderId,
      note: "Razorpay wallet top-up",
    });
    toast.success(
      `Added ${result.amountInr.toLocaleString("en-IN", { style: "currency", currency: "INR" })} to your wallet`,
    );
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="space-y-5">
        {!razorpayReady && (
          <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5">
            <p className="text-sm text-amber-200/90">
              Razorpay is not configured. Add{" "}
              <code className="text-xs bg-muted px-1 rounded">VITE_RAZORPAY_KEY_ID</code> and server
              keys to <code className="text-xs bg-muted px-1 rounded">.env</code> to enable UPI and
              Google Pay payments.
            </p>
          </GlassCard>
        )}

        <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Usage is calculated from SMS sent across your campaigns. Top up your wallet to cover
              charges.
            </p>
          </div>
          <Button
            onClick={() => setTopUpOpen(true)}
            className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add credits
          </Button>
        </GlassCard>

        {!isLoading && <BillingSummaryCards campaigns={campaigns} balanceInr={balanceInr} />}

        <Tabs defaultValue="usage" className="space-y-4">
          <TabsList className="glass-strong">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="methods">Payment methods</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-4 mt-0">
            <UsageBreakdownTable campaigns={campaigns} />
            <p className="text-xs text-muted-foreground text-center">
              Need more detail?{" "}
              <Link to="/campaigns" className="text-primary hover:underline">
                Open campaigns
              </Link>
            </p>
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <TransactionsTable transactions={transactions} />
          </TabsContent>

          <TabsContent value="methods" className="mt-0">
            <PaymentMethodsCard methods={savedMethods} onAddCredits={() => setTopUpOpen(true)} />
          </TabsContent>
        </Tabs>

        <GlassCard className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4 text-primary shrink-0" />
          <span>
            Payments are processed by Razorpay. Enable UPI and Google Pay in your Razorpay dashboard
            test mode.
          </span>
        </GlassCard>
      </div>

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        userEmail={email}
        userName={displayName}
        onSuccess={handleTopUpSuccess}
      />
    </>
  );
}
