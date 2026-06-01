import type { BillingWallet } from "@/types/billing";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const seedBillingWallet: BillingWallet = {
  balanceInr: 500,
  transactions: [
    {
      id: "txn_seed_1",
      type: "top_up",
      amountInr: 1000,
      method: "upi",
      razorpayPaymentId: "pay_seed_demo_1",
      razorpayOrderId: "order_seed_demo_1",
      note: "Initial wallet top-up",
      createdAt: daysAgo(14),
    },
    {
      id: "txn_seed_2",
      type: "top_up",
      amountInr: 500,
      method: "gpay",
      razorpayPaymentId: "pay_seed_demo_2",
      razorpayOrderId: "order_seed_demo_2",
      createdAt: daysAgo(3),
    },
  ],
  savedMethods: [
    {
      id: "pm_upi_1",
      type: "upi",
      label: "UPI — demo@oksbi",
      lastUsedAt: daysAgo(3),
    },
    {
      id: "pm_gpay_1",
      type: "gpay",
      label: "Google Pay",
      lastUsedAt: daysAgo(3),
    },
  ],
  updatedAt: now.toISOString(),
};
