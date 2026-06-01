import { useCallback, useEffect, useState } from "react";
import type { BillingTransaction, BillingWallet, PaymentMethodType } from "@/types/billing";
import {
  addCreditsFromPayment,
  getBillingWallet,
  listBillingTransactions,
} from "@/lib/billing-storage";

export function useBilling() {
  const [wallet, setWallet] = useState<BillingWallet | null>(null);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setWallet(getBillingWallet());
    setTransactions(listBillingTransactions());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 200);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const applyTopUp = useCallback(
    (input: {
      amountInr: number;
      method: PaymentMethodType;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      note?: string;
    }) => {
      const updated = addCreditsFromPayment(input);
      setWallet(updated);
      setTransactions(updated.transactions);
      return updated;
    },
    [],
  );

  return {
    wallet,
    balanceInr: wallet?.balanceInr ?? 0,
    savedMethods: wallet?.savedMethods ?? [],
    transactions,
    isLoading,
    refresh,
    applyTopUp,
  };
}
