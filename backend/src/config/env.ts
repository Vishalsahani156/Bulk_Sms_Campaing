import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  API_BASE_URL: z.string().url().default("http://localhost:3001"),
  CORS_ORIGIN: z.string().default("http://localhost:8080,http://localhost:8081,http://localhost:5173"),
  APP_FRONTEND_URL: z.string().url().optional(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SMS_PROVIDER: z.enum(["mock", "msg91", "twilio"]).default("mock"),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

function resolveProcessEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (!env.API_BASE_URL?.trim() && env.RENDER_EXTERNAL_URL?.trim()) {
    env.API_BASE_URL = env.RENDER_EXTERNAL_URL.trim();
  }
  return env;
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(resolveProcessEnv());
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment variables:");
    for (const [key, messages] of Object.entries(fields)) {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    }
    console.error(
      "Render checklist: DATABASE_URL, REDIS_URL, JWT_ACCESS_SECRET (32+ chars), JWT_REFRESH_SECRET (32+ chars), API_BASE_URL, CORS_ORIGIN",
    );
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  if (
    cached.NODE_ENV === "production" &&
    cached.REDIS_URL === "redis://localhost:6379"
  ) {
    console.warn(
      "WARNING: REDIS_URL is not set — using localhost default. Campaigns and workers will not work until REDIS_URL is configured on Render.",
    );
  }
  return cached;
}
