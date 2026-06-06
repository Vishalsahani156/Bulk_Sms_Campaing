import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import { getEnv } from "../../config/env.js";
import {
  handleRazorpayWebhook,
  handleSmsDeliveryWebhook,
} from "./webhooks.service.js";

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/sms/delivery", async (request) => {
    const body = request.body as {
      messageId?: string;
      status?: string;
      phone?: string;
    };
    const result = await handleSmsDeliveryWebhook(body);
    fastify.log.info({ body, result }, "SMS delivery webhook processed");
    return { ok: true, ...result };
  });

  fastify.post("/razorpay", async (request, reply) => {
    const env = getEnv();
    const signature = request.headers["x-razorpay-signature"] as string | undefined;
    const rawBody = JSON.stringify(request.body);

    if (env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        return reply.status(400).send({ error: "Invalid signature" });
      }
    }

    const result = await handleRazorpayWebhook(
      request.body as Parameters<typeof handleRazorpayWebhook>[0],
    );
    fastify.log.info({ result }, "Razorpay webhook processed");
    return { ok: true, ...result };
  });
};
