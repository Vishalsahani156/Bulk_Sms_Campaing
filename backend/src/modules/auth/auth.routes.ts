import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getUserById,
  sanitizeUser,
  requestPasswordReset,
  resetPassword,
} from "./auth.service.js";
import { createAvatarUploadUrl } from "../../shared/s3.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "./auth.schema.js";
import { db } from "../../db/client.js";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema/index.js";
import { authRateLimitPlugin } from "../../plugins/rate-limit-auth.plugin.js";
import { isProductionDeploy } from "../../config/env.js";

const REFRESH_COOKIE = "pulse_refresh_token";

function cookieOptions() {
  const isProd = isProductionDeploy();
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/v1/auth",
    maxAge: 7 * 24 * 60 * 60,
  };
}

function setRefreshCookie(reply: import("fastify").FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, cookieOptions());
}

function clearRefreshCookie(reply: import("fastify").FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, cookieOptions());
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRateLimitPlugin);

  fastify.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const { user, tokens } = await registerUser(body);
    setRefreshCookie(reply, tokens.refreshToken);
    return reply.status(201).send({
      data: {
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  });

  fastify.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const { user, tokens } = await loginUser(body);
    setRefreshCookie(reply, tokens.refreshToken);
    return {
      data: {
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    };
  });

  fastify.post("/refresh", async (request, reply) => {
    const refreshToken =
      request.cookies[REFRESH_COOKIE] ??
      (request.body as { refreshToken?: string })?.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "No refresh token" } });
    }
    const tokens = await refreshSession(refreshToken);
    setRefreshCookie(reply, tokens.refreshToken);
    return {
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    };
  });

  fastify.post("/logout", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE];
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    clearRefreshCookie(reply);
    return { data: { ok: true } };
  });

  fastify.post("/forgot-password", async (request) => {
    const body = forgotPasswordSchema.parse(request.body);
    await requestPasswordReset(body.email);
    return { data: { ok: true } };
  });

  fastify.post("/reset-password", async (request) => {
    const body = resetPasswordSchema.parse(request.body);
    await resetPassword(body.token, body.password);
    return { data: { ok: true } };
  });
};

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/me", async (request) => {
    const user = await getUserById(request.user!.sub);
    return { data: sanitizeUser(user) };
  });

  fastify.patch("/me", async (request) => {
    const body = updateUserSchema.parse(request.body);
    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, request.user!.sub))
      .returning();
    return { data: sanitizeUser(updated) };
  });

  fastify.post("/me/avatar-upload-url", async (request) => {
    const body = z
      .object({ contentType: z.string().regex(/^image\//) })
      .parse(request.body);
    const result = await createAvatarUploadUrl(request.user!.sub, body.contentType);
    return { data: result };
  });
};
