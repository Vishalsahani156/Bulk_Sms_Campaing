export type PaymentMethodType = "upi" | "gpay" | "card" | "netbanking" | "wallet";

export type BillingTransactionType = "top_up" | "adjustment";

export interface BillingTransaction {
  id: string;
  type: BillingTransactionType;
  amountInr: number;
  method: PaymentMethodType;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  note?: string;
  createdAt: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  lastUsedAt: string;
}

export interface BillingWallet {
  balanceInr: number;
  transactions: BillingTransaction[];
  savedMethods: SavedPaymentMethod[];
  updatedAt: string;
}

export const TOP_UP_PRESETS_INR = [500, 1000, 5000] as const;

export const MIN_TOP_UP_INR = 100;
