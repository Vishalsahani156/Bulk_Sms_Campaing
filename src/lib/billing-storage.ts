import type {
  BillingTransaction,
  BillingWallet,
  PaymentMethodType,
  SavedPaymentMethod,
} from "@/types/billing";
import { seedBillingWallet } from "@/lib/billing-seed";

const STORAGE_KEY = "pulse_sms_billing";

function loadRaw(): BillingWallet {
  if (typeof window === "undefined") return { ...seedBillingWallet };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBillingWallet));
      return { ...seedBillingWallet };
    }
    const parsed = JSON.parse(raw) as BillingWallet;
    if (!parsed || typeof parsed.balanceInr !== "number") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBillingWallet));
      return { ...seedBillingWallet };
    }
    return parsed;
  } catch {
    return { ...seedBillingWallet };
  }
}

function saveAll(wallet: BillingWallet) {
  if (typeof window === "undefined") return;
  wallet.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getBillingWallet(): BillingWallet {
  return loadRaw();
}

export function addCreditsFromPayment(input: {
  amountInr: number;
  method: PaymentMethodType;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  note?: string;
}): BillingWallet {
  const wallet = loadRaw();
  const txn: BillingTransaction = {
    id: newId("txn"),
    type: "top_up",
    amountInr: input.amountInr,
    method: input.method,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpayOrderId: input.razorpayOrderId,
    note: input.note,
    createdAt: new Date().toISOString(),
  };

  wallet.balanceInr = +(wallet.balanceInr + input.amountInr).toFixed(2);
  wallet.transactions.unshift(txn);

  const methodLabel =
    input.method === "upi"
      ? "UPI"
      : input.method === "gpay"
        ? "Google Pay"
        : input.method === "card"
          ? "Card"
          : input.method;

  const existing = wallet.savedMethods.find((m) => m.type === input.method);
  if (existing) {
    existing.lastUsedAt = txn.createdAt;
  } else {
    const saved: SavedPaymentMethod = {
      id: newId("pm"),
      type: input.method,
      label: methodLabel,
      lastUsedAt: txn.createdAt,
    };
    wallet.savedMethods.unshift(saved);
  }

  saveAll(wallet);
  return wallet;
}

export function listBillingTransactions(): BillingTransaction[] {
  return loadRaw().transactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function inferPaymentMethodFromRazorpay(method?: string | null): PaymentMethodType {
  const m = (method ?? "").toLowerCase();
  if (m.includes("upi")) return "upi";
  if (m.includes("wallet") || m.includes("gpay") || m.includes("google")) return "gpay";
  if (m.includes("card")) return "card";
  if (m.includes("netbanking")) return "netbanking";
  return "upi";
}
