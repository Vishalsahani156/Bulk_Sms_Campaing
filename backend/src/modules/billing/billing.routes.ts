import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import {
  getWallet,
  listTransactions,
  createOrder,
  verifyPayment,
  listPaymentMethods,
  getUsageBreakdown,
} from "./billing.service.js";

const MIN_TOP_UP_INR = 100;

export const billingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/wallet", async (request) => {
    const data = await getWallet(request.user!.sub);
    return { data };
  });

  fastify.get("/transactions", async (request) => {
    const query = request.query as { page?: string; limit?: string };
    const data = await listTransactions(request.user!.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
    return { data };
  });

  fastify.get("/usage", async (request) => {
    const data = await getUsageBreakdown(request.user!.sub);
    return { data };
  });

  fastify.get("/payment-methods", async (request) => {
    const data = await listPaymentMethods(request.user!.sub);
    return { data: { items: data } };
  });

  fastify.post("/orders", async (request) => {
    const body = z.object({ amountInr: z.number().min(MIN_TOP_UP_INR) }).parse(request.body);
    const data = await createOrder(request.user!.sub, body.amountInr);
    return { data };
  });

  fastify.post("/verify", async (request) => {
    const body = z
      .object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
      })
      .parse(request.body);
    const data = await verifyPayment(request.user!.sub, body);
    return { data };
  });
};
