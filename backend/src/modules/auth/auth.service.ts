import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users, refreshTokens, wallets, passwordResetTokens } from "../../db/schema/index.js";
import { sendEmail, getFrontendUrl } from "../../shared/email.js";
import { getEnv } from "../../config/env.js";
import { AppError, unauthorized, badRequest } from "../../shared/errors.js";
import {
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
} from "../../shared/redis.js";

const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseExpires(expires: string): number {
  const match = expires.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

export function signAccessToken(payload: TokenPayload): { token: string; expiresIn: number } {
  const env = getEnv();
  const expiresIn = parseExpires(env.JWT_ACCESS_EXPIRES);
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
  });
  return { token, expiresIn };
}

export function signRefreshToken(payload: TokenPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    throw unauthorized("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, getEnv().JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (existing) {
    throw badRequest("Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name ?? null,
    })
    .returning();

  await db.insert(wallets).values({ userId: user.id, balanceInr: "0" });

  const tokens = await issueTokens(user.id, user.email);
  return { user, tokens };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw unauthorized("Invalid email or password");
  }

  const tokens = await issueTokens(user.id, user.email);
  return { user, tokens };
}

async function issueTokens(userId: string, email: string): Promise<AuthTokens> {
  const payload: TokenPayload = { sub: userId, email };
  const { token: accessToken, expiresIn } = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseExpires(getEnv().JWT_REFRESH_EXPIRES) * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { accessToken, expiresIn, refreshToken };
}

export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  if (await isRefreshTokenBlacklisted(tokenHash)) {
    throw unauthorized("Refresh token revoked");
  }

  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized("Refresh token invalid");
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, stored.id));

  return issueTokens(payload.sub, payload.email);
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const ttl = parseExpires(getEnv().JWT_REFRESH_EXPIRES);

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));

  await blacklistRefreshToken(tokenHash, ttl);
}

export async function getUserById(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000;

export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Pulse SMS password",
    text: `Reset your password using this link (expires in 1 hour):\n\n${resetUrl}`,
    html: `<p>Reset your password using this link (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const stored = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.tokenHash, tokenHash),
  });

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw badRequest("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, stored.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, stored.id));
  });
}

export function sanitizeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
