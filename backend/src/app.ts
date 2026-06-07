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
  const corsOrigins = new Set(
    env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );
  if (env.APP_FRONTEND_URL) corsOrigins.add(env.APP_FRONTEND_URL);

  const allowVercelPreview =
    env.NODE_ENV === "production" &&
    !env.CORS_ORIGIN.split(",").some((o) => o.trim().includes("vercel.app"));

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      if (allowVercelPreview) {
        try {
          const hostname = new URL(origin).hostname;
          if (hostname.endsWith(".vercel.app") || hostname === "vercel.app") {
            callback(null, true);
            return;
          }
        } catch {
          // ignore invalid origin URL
        }
      }
      callback(null, false);
    },
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

  app.get("/", async (request, reply) => {
    const apiBaseUrl =
      env.API_BASE_URL.startsWith("http://localhost") && env.NODE_ENV === "production"
        ? `${request.protocol}://${request.hostname}`
        : env.API_BASE_URL;
    const viteApiBaseUrl = `${apiBaseUrl.replace(/\/$/, "")}/v1`;

    const payload = {
      name: "Pulse SMS API",
      status: "ok",
      message: "Backend API is running. The web app UI is deployed separately on Vercel.",
      apiBaseUrl,
      viteApiBaseUrl,
      endpoints: {
        health: "/health",
        docs: "/docs",
        api: "/v1",
        auth: "/v1/auth",
      },
    };

    if (request.headers.accept?.includes("text/html")) {
      return reply.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pulse SMS API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #444; }
    code { background: #f4f4f5; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
    ul { padding-left: 1.25rem; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Pulse SMS API</h1>
  <p>Backend is running. This URL is the <strong>API server</strong>, not the dashboard UI.</p>
  <p>Deploy the frontend on <strong>Vercel</strong> and set <code>VITE_API_BASE_URL</code> to <code>${viteApiBaseUrl}</code>.</p>
  <ul>
    <li><a href="/health">/health</a> — health check</li>
    <li><a href="/docs">/docs</a> — API docs</li>
    <li><code>/v1/*</code> — REST API routes</li>
  </ul>
</body>
</html>`);
    }

    return payload;
  });

  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(userRoutes, { prefix: "/v1/users" });
  await app.register(billingRoutes, { prefix: "/v1/billing" });
  await app.register(templateRoutes, { prefix: "/v1/templates" });
  await app.register(contactRoutes, { prefix: "/v1/contacts" });
  await app.register(campaignRoutes, { prefix: "/v1/campaigns" });
  await app.register(analyticsRoutes, { prefix: "/v1/analytics" });
  await app.register(notificationRoutes, { prefix: "/v1/notifications" });
  await app.register(webhookRoutes, { prefix: "/v1/webhooks" });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found. API routes are under /v1. Try /health or /docs.`,
      },
    });
  });

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
