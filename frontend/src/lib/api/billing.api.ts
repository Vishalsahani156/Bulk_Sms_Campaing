import { apiRequest } from "./client";
import type { BillingTransaction, SavedPaymentMethod } from "@/types/billing";

export async function getWallet() {
  return apiRequest<{ balanceInr: number; updatedAt: string }>("/billing/wallet");
}

export async function getTransactions(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiRequest<{
    items: BillingTransaction[];
    total: number;
    page: number;
    limit: number;
  }>(`/billing/transactions${query ? `?${query}` : ""}`);
}

export async function getPaymentMethods() {
  return apiRequest<{ items: SavedPaymentMethod[] }>("/billing/payment-methods");
}

export async function getUsageBreakdown() {
  return apiRequest<
    Array<{
      campaignId: string;
      campaignName: string;
      smsCount: number;
      costInr: number;
      rateInr: number;
    }>
  >("/billing/usage");
}

export async function createBillingOrder(amountInr: number) {
  return apiRequest<{
    orderId: string;
    amountPaise: number;
    amountInr: number;
    currency: string;
    keyId: string;
  }>("/billing/orders", { method: "POST", body: { amountInr } });
}

export async function verifyBillingPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return apiRequest<{ ok: true; amountInr: number; newBalance: number }>("/billing/verify", {
    method: "POST",
    body: payload,
  });
}
