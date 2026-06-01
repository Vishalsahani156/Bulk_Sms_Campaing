import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import Razorpay from "razorpay";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { MIN_TOP_UP_INR } from "@/types/billing";

function getRazorpayClient() {
  const config = getServerConfig();
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
    );
  }
  return {
    client: new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    }),
    keyId: config.razorpayKeyId,
    keySecret: config.razorpayKeySecret,
  };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amountInr: z.number().min(MIN_TOP_UP_INR),
      userEmail: z.string().email().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client, keyId } = getRazorpayClient();
    const amountPaise = Math.round(data.amountInr * 100);

    const order = await client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `pulse_topup_${Date.now()}`,
      notes: {
        purpose: "wallet_top_up",
        userEmail: data.userEmail ?? "anonymous",
      },
    });

    return {
      orderId: order.id,
      amountPaise: order.amount,
      amountInr: data.amountInr,
      currency: order.currency ?? "INR",
      keyId,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { client, keySecret } = getRazorpayClient();

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== data.razorpay_signature) {
      throw new Error("Payment verification failed: invalid signature");
    }

    const order = await client.orders.fetch(data.razorpay_order_id);
    const amountInr = Number(order.amount) / 100;

    let paymentMethod: string | undefined;
    try {
      const payment = await client.payments.fetch(data.razorpay_payment_id);
      paymentMethod = payment.method ?? undefined;
    } catch {
      paymentMethod = undefined;
    }

    return {
      ok: true as const,
      amountInr,
      paymentMethod,
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
    };
  });
