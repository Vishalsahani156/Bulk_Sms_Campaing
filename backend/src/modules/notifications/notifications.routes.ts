import type { FastifyPluginAsync } from "fastify";
import { listNotifications, markNotificationRead } from "./notifications.service.js";

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const query = request.query as { unreadOnly?: string };
    const data = await listNotifications(request.user!.sub, query.unreadOnly === "true");
    return { data };
  });

  fastify.patch("/:id/read", async (request) => {
    const { id } = request.params as { id: string };
    const data = await markNotificationRead(request.user!.sub, id);
    return { data };
  });
};
