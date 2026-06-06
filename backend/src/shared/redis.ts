import { Redis, type RedisOptions } from "ioredis";
import { getEnv } from "../config/env.js";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = getEnv().REDIS_URL;
    const options: RedisOptions = { maxRetriesPerRequest: null };
    if (url.startsWith("rediss://")) {
      options.tls = {};
    }
    redis = new Redis(url, options);
  }
  return redis;
}

export async function blacklistRefreshToken(tokenHash: string, ttlSeconds: number) {
  await getRedis().setex(`refresh:blacklist:${tokenHash}`, ttlSeconds, "1");
}

export async function isRefreshTokenBlacklisted(tokenHash: string): Promise<boolean> {
  const result = await getRedis().get(`refresh:blacklist:${tokenHash}`);
  return result === "1";
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(pattern: string) {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}
