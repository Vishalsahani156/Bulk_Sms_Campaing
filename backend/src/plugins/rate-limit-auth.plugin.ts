import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";

export const authRateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: "1 minute",
  });
};
