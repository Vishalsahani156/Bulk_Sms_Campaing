import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { getEnv } from "./config/env.js";
import authPlugin from "./plugins/auth.plugin.js";
import { AppError } from "./shared/errors.js";
import { authRoutes, userRoutes } from "./modules/auth/auth.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { templateRoutes } from "./modules/templates/templates.routes.js";
import { contactRoutes } from "./modules/contacts/contacts.routes.js";
import { campaignRoutes } from "./modules/campaigns/campaigns.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { webhookRoutes } from "./modules/webhooks/webhooks.routes.js";

export async function buildApp() {
  const env = getEnv();
  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
    trustProxy: env.NODE_ENV === "production",
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  await app.register(swagger, {
    openapi: {
      info: { title: "Pulse SMS API", version: "1.0.0" },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(authPlugin);

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(userRoutes, { prefix: "/v1/users" });
  await app.register(billingRoutes, { prefix: "/v1/billing" });
  await app.register(templateRoutes, { prefix: "/v1/templates" });
  await app.register(contactRoutes, { prefix: "/v1/contacts" });
  await app.register(campaignRoutes, { prefix: "/v1/campaigns" });
  await app.register(analyticsRoutes, { prefix: "/v1/analytics" });
  await app.register(notificationRoutes, { prefix: "/v1/notifications" });
  await app.register(webhookRoutes, { prefix: "/v1/webhooks" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code ?? "ERROR", message: error.message },
      });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: error.message },
      });
    }
    app.log.error(error);
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  });

  return app;
}
