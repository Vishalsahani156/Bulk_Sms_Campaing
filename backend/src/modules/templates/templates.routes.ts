import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from "./templates.service.js";

const templateInput = z.object({
  name: z.string().min(1),
  type: z.enum(["Promotional", "Transactional", "OTP", "Custom"]),
  body: z.string().min(1),
  status: z.enum(["active", "inactive"]),
});

export const templateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = request.query as { status?: string; type?: string };
    const data = await listTemplates(request.user!.sub, query);
    return { data: { items: data } };
  });

  fastify.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const data = await getTemplate(request.user!.sub, id);
    return { data };
  });

  fastify.post("/", async (request, reply) => {
    const body = templateInput.parse(request.body);
    const data = await createTemplate(request.user!.sub, body);
    return reply.status(201).send({ data });
  });

  fastify.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = templateInput.partial().parse(request.body);
    const data = await updateTemplate(request.user!.sub, id, body);
    return { data };
  });

  fastify.delete("/:id", async (request) => {
    const { id } = request.params as { id: string };
    await deleteTemplate(request.user!.sub, id);
    return { data: { ok: true } };
  });

  fastify.post("/:id/duplicate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await duplicateTemplate(request.user!.sub, id);
    return reply.status(201).send({ data });
  });
};
