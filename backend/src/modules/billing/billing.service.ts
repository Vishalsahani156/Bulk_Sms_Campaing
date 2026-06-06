import crypto from "node:crypto";
import { eq, desc, and } from "drizzle-orm";
import Razorpay from "razorpay";
import { db } from "../../db/client.js";
import {
  wallets,
  billingTransactions,
  savedPaymentMethods,
  campaigns,
} from "../../db/schema/index.js";
import { getEnv } from "../../config/env.js";
import { badRequest } from "../../shared/errors.js";
import { formatDecimal, inferPaymentMethod } from "../../shared/pricing.js";
import { paginatedResponse, parsePagination } from "../../shared/pagination.js";
import { logAudit } from "../../shared/audit.js";
import { SMS_RATE_INR } from "../../shared/pricing.js";

const MIN_TOP_UP_INR = 100;

function getRazorpay() {
  const env = getEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw badRequest("Razorpay is not configured");
  }
  return {
    client: new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET }),
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  };
}

export async function getOrCreateWallet(userId: string) {
  let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (!wallet) {
    [wallet] = await db.insert(wallets).values({ userId, balanceInr: "0" }).returning();
  }
  return wallet;
}

export async function getWallet(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return {
    balanceInr: formatDecimal(wallet.balanceInr),
    updatedAt: wallet.updatedAt.toISOString(),
  };
}

export async function listTransactions(userId: string, params: { page?: number; limit?: number }) {
  const { page, limit, offset } = parsePagination(params);
  const items = await db.query.billingTransactions.findMany({
    where: eq(billingTransactions.userId, userId),
    orderBy: [desc(billingTransactions.createdAt)],
    limit,
    offset,
  });
  const all = await db.query.billingTransactions.findMany({
    where: eq(billingTransactions.userId, userId),
  });
  return paginatedResponse(
    items.map(mapTransaction),
    all.length,
    page,
    limit,
  );
}

function mapTransaction(t: typeof billingTransactions.$inferSelect) {
  return {
    id: t.id,
    type: t.type,
    amountInr: formatDecimal(t.amountInr),
    method: t.method,
    razorpayPaymentId: t.razorpayPaymentId ?? undefined,
    razorpayOrderId: t.razorpayOrderId ?? undefined,
    note: t.note ?? undefined,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function createOrder(userId: string, amountInr: number) {
  if (amountInr < MIN_TOP_UP_INR) throw badRequest(`Minimum top-up is ₹${MIN_TOP_UP_INR}`);
  const { client, keyId } = getRazorpay();
  const wallet = await getOrCreateWallet(userId);
  const amountPaise = Math.round(amountInr * 100);

  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `pulse_topup_${Date.now()}`,
    notes: { purpose: "wallet_top_up", userId },
  });

  await db.insert(billingTransactions).values({
    userId,
    walletId: wallet.id,
    type: "top_up",
    amountInr: amountInr.toFixed(2),
    razorpayOrderId: order.id,
    note: "Pending top-up",
  });

  return { orderId: order.id, amountPaise, amountInr, currency: "INR", keyId };
}

export async function processRazorpayPayment(input: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentMethod?: string;
  amountPaise?: number;
}) {
  const existing = await db.query.billingTransactions.findFirst({
    where: eq(billingTransactions.razorpayPaymentId, input.razorpayPaymentId),
  });
  if (existing) {
    const wallet = await getOrCreateWallet(input.userId);
    return {
      ok: true as const,
      amountInr: formatDecimal(existing.amountInr),
      newBalance: formatDecimal(wallet.balanceInr),
      duplicate: true,
    };
  }

  let amountInr = input.amountPaise ? input.amountPaise / 100 : undefined;
  let paymentMethod = input.paymentMethod;

  if (amountInr === undefined) {
    const { client } = getRazorpay();
    const order = await client.orders.fetch(input.razorpayOrderId);
    amountInr = Number(order.amount) / 100;
  }

  if (!paymentMethod) {
    try {
      const { client } = getRazorpay();
      const payment = await client.payments.fetch(input.razorpayPaymentId);
      paymentMethod = payment.method ?? undefined;
    } catch {
      paymentMethod = undefined;
    }
  }

  const method = inferPaymentMethod(paymentMethod);
  const wallet = await getOrCreateWallet(input.userId);
  const newBalance = formatDecimal(wallet.balanceInr) + amountInr;

  await db.transaction(async (tx) => {
    await tx
      .update(wallets)
      .set({ balanceInr: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));

    const pending = await tx.query.billingTransactions.findFirst({
      where: and(
        eq(billingTransactions.razorpayOrderId, input.razorpayOrderId),
        eq(billingTransactions.userId, input.userId),
      ),
    });

    if (pending && !pending.razorpayPaymentId) {
      await tx
        .update(billingTransactions)
        .set({
          razorpayPaymentId: input.razorpayPaymentId,
          method,
          note: "Wallet top-up",
        })
        .where(eq(billingTransactions.id, pending.id));
    } else {
      await tx.insert(billingTransactions).values({
        userId: input.userId,
        walletId: wallet.id,
        type: "top_up",
        amountInr: amountInr.toFixed(2),
        method,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpayOrderId: input.razorpayOrderId,
        note: "Wallet top-up",
      });
    }

    const existingMethod = await tx.query.savedPaymentMethods.findFirst({
      where: and(eq(savedPaymentMethods.userId, input.userId), eq(savedPaymentMethods.type, method)),
    });
    if (!existingMethod) {
      await tx.insert(savedPaymentMethods).values({
        userId: input.userId,
        type: method,
        label: `${method.toUpperCase()} — saved`,
        lastUsedAt: new Date(),
      });
    } else {
      await tx
        .update(savedPaymentMethods)
        .set({ lastUsedAt: new Date() })
        .where(eq(savedPaymentMethods.id, existingMethod.id));
    }
  });

  await logAudit({
    userId: input.userId,
    action: "wallet.top_up",
    metadata: { amountInr, orderId: input.razorpayOrderId },
  });

  return { ok: true as const, amountInr, newBalance, duplicate: false };
}

export async function verifyPayment(
  userId: string,
  data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) {
  const { keySecret } = getRazorpay();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== data.razorpay_signature) {
    throw badRequest("Payment verification failed: invalid signature");
  }

  const result = await processRazorpayPayment({
    userId,
    razorpayOrderId: data.razorpay_order_id,
    razorpayPaymentId: data.razorpay_payment_id,
  });

  return { ok: result.ok, amountInr: result.amountInr, newBalance: result.newBalance };
}

export async function listPaymentMethods(userId: string) {
  const items = await db.query.savedPaymentMethods.findMany({
    where: eq(savedPaymentMethods.userId, userId),
    orderBy: [desc(savedPaymentMethods.lastUsedAt)],
  });
  return items.map((m) => ({
    id: m.id,
    type: m.type,
    label: m.label,
    lastUsedAt: m.lastUsedAt.toISOString(),
  }));
}

export async function getUsageBreakdown(userId: string) {
  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
  });
  return userCampaigns
    .filter((c) => c.status === "completed" || c.status === "sending")
    .map((c) => ({
      campaignId: c.id,
      campaignName: c.name,
      smsCount: c.deliveredCount || c.recipientsCount,
      costInr: formatDecimal(c.costInr),
      rateInr: SMS_RATE_INR.default,
    }));
}

export async function debitWallet(userId: string, amountInr: number, referenceId: string, note: string) {
  const wallet = await getOrCreateWallet(userId);
  const balance = formatDecimal(wallet.balanceInr);
  if (balance < amountInr) throw badRequest("Insufficient wallet balance");

  const newBalance = balance - amountInr;
  await db.transaction(async (tx) => {
    await tx
      .update(wallets)
      .set({ balanceInr: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));
    await tx.insert(billingTransactions).values({
      userId,
      walletId: wallet.id,
      type: "debit",
      amountInr: amountInr.toFixed(2),
      referenceType: "campaign",
      referenceId,
      note,
    });
  });
  return newBalance;
}
