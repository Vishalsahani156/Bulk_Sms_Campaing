import { eq, desc, isNull, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { notifications } from "../../db/schema/index.js";
import { notFound } from "../../shared/errors.js";

export async function listNotifications(userId: string, unreadOnly?: boolean) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(isNull(notifications.readAt));

  const items = await db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });

  const unread = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), isNull(notifications.readAt)),
  });

  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: unread.length,
  };
}

export async function markNotificationRead(userId: string, id: string) {
  const n = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
  });
  if (!n) throw notFound("Notification not found");

  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();

  return {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    body: updated.body,
    readAt: updated.readAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
}) {
  const [n] = await db.insert(notifications).values(input).returning();
  return n;
}
