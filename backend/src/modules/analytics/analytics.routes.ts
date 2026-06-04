import type { FastifyPluginAsync } from "fastify";
import {
  getOverview,
  getTimeseries,
  getChannels,
  getCampaignPerformance,
  getContactAnalytics,
  type AnalyticsPeriod,
} from "./analytics.service.js";

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/overview", async (request) => {
    const data = await getOverview(request.user!.sub);
    return { data };
  });

  fastify.get("/timeseries", async (request) => {
    const query = request.query as { period?: string };
    const period = (query.period ?? "30d") as AnalyticsPeriod;
    const data = await getTimeseries(request.user!.sub, period);
    return { data };
  });

  fastify.get("/channels", async (request) => {
    const data = await getChannels(request.user!.sub);
    return { data };
  });

  fastify.get("/campaigns", async (request) => {
    const query = request.query as { period?: string };
    const period = (query.period ?? "30d") as AnalyticsPeriod;
    const data = await getCampaignPerformance(request.user!.sub, period);
    return { data: { items: data } };
  });

  fastify.get("/contacts", async (request) => {
    const data = await getContactAnalytics(request.user!.sub);
    return { data };
  });
};
