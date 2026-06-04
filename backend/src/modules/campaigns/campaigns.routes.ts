import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  cancelCampaign,
  duplicateCampaign,
} from "./campaigns.service.js";

export const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = request.query as Record<string, string>;
    const data = await listCampaigns(request.user!.sub, {
      status: query.status,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      sort: query.sort,
    });
    return { data };
  });

  fastify.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const data = await getCampaign(request.user!.sub, id);
    return { data };
  });

  fastify.post("/", async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        templateId: z.string().uuid().optional(),
        messageBody: z.string().min(1),
        senderId: z.string().optional(),
        contactIds: z.array(z.string().uuid()).optional(),
        groupId: z.string().uuid().optional(),
        scheduledAt: z.string().datetime().optional(),
      })
      .parse(request.body);
    const data = await createCampaign(request.user!.sub, body);
    return reply.status(201).send({ data });
  });

  fastify.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        messageBody: z.string().min(1).optional(),
        senderId: z.string().optional(),
        scheduledAt: z.string().datetime().optional(),
      })
      .parse(request.body);
    const data = await updateCampaign(request.user!.sub, id, body);
    return { data };
  });

  fastify.post("/:id/send", async (request) => {
    const { id } = request.params as { id: string };
    const data = await sendCampaign(request.user!.sub, id);
    return { data };
  });

  fastify.post("/:id/cancel", async (request) => {
    const { id } = request.params as { id: string };
    const data = await cancelCampaign(request.user!.sub, id);
    return { data };
  });

  fastify.post("/:id/duplicate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await duplicateCampaign(request.user!.sub, id);
    return reply.status(201).send({ data });
  });
};
