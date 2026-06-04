import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWallet,
  getTransactions,
  getPaymentMethods,
  getUsageBreakdown,
} from "@/lib/api/billing.api";

export function useBilling() {
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ["billing", "wallet"],
    queryFn: getWallet,
  });

  const transactionsQuery = useQuery({
    queryKey: ["billing", "transactions"],
    queryFn: () => getTransactions(),
  });

  const methodsQuery = useQuery({
    queryKey: ["billing", "payment-methods"],
    queryFn: async () => {
      const res = await getPaymentMethods();
      return res.items;
    },
  });

  const usageQuery = useQuery({
    queryKey: ["billing", "usage"],
    queryFn: getUsageBreakdown,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["billing"] });
  };

  return {
    wallet: walletQuery.data ?? null,
    balanceInr: walletQuery.data?.balanceInr ?? 0,
    savedMethods: methodsQuery.data ?? [],
    transactions: transactionsQuery.data?.items ?? [],
    usage: usageQuery.data ?? [],
    isLoading: walletQuery.isLoading || transactionsQuery.isLoading,
    refresh,
  };
}
