import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import {
  listContacts,
  createContact,
  updateContact,
  bulkDeleteContacts,
  bulkActivateContacts,
  importContacts,
  exportContactsCsv,
  getContactsForExport,
} from "./contacts.service.js";

export const contactRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = request.query as Record<string, string>;
    const data = await listContacts(request.user!.sub, {
      status: query.status,
      group: query.group,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
    return { data };
  });

  fastify.post("/", async (request, reply) => {
    const body = z
      .object({ name: z.string().min(1), phone: z.string().min(10), groupId: z.string().uuid().optional() })
      .parse(request.body);
    const data = await createContact(request.user!.sub, body);
    return reply.status(201).send({ data });
  });

  fastify.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        phone: z.string().min(10).optional(),
        groupId: z.string().uuid().optional(),
        status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
      })
      .parse(request.body);
    const data = await updateContact(request.user!.sub, id, body);
    return { data };
  });

  fastify.post("/bulk-delete", async (request) => {
    const body = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(request.body);
    const data = await bulkDeleteContacts(request.user!.sub, body.ids);
    return { data };
  });

  fastify.post("/bulk-activate", async (request) => {
    const body = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(request.body);
    const data = await bulkActivateContacts(request.user!.sub, body.ids);
    return { data };
  });

  fastify.post("/import", async (request) => {
    const body = z
      .object({ csvContent: z.string().min(1), groupId: z.string().uuid().optional() })
      .parse(request.body);
    const data = await importContacts(request.user!.sub, body.csvContent, body.groupId);
    return { data };
  });

  fastify.get("/export", async (request, reply) => {
    const query = request.query as { ids?: string };
    const ids = query.ids ? query.ids.split(",") : undefined;
    const items = await getContactsForExport(request.user!.sub, ids);
    const csv = exportContactsCsv(items);
    reply.header("Content-Type", "text/csv");
    reply.header("Content-Disposition", 'attachment; filename="contacts.csv"');
    return csv;
  });
};
