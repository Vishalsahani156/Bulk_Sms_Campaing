import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/client.js";
import { smsTemplates } from "../../db/schema/index.js";
import { notFound } from "../../shared/errors.js";

export function mapTemplate(t: typeof smsTemplates.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    body: t.body,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function listTemplates(
  userId: string,
  filters?: { status?: string; type?: string },
) {
  const conditions = [eq(smsTemplates.userId, userId)];
  if (filters?.status) {
    conditions.push(eq(smsTemplates.status, filters.status as "active" | "inactive"));
  }
  if (filters?.type) {
    conditions.push(
      eq(smsTemplates.type, filters.type as "Promotional" | "Transactional" | "OTP" | "Custom"),
    );
  }
  const items = await db.query.smsTemplates.findMany({
    where: and(...conditions),
    orderBy: [desc(smsTemplates.updatedAt)],
  });
  return items.map(mapTemplate);
}

export async function getTemplate(userId: string, id: string) {
  const t = await db.query.smsTemplates.findFirst({
    where: and(eq(smsTemplates.id, id), eq(smsTemplates.userId, userId)),
  });
  if (!t) throw notFound("Template not found");
  return mapTemplate(t);
}

export async function createTemplate(
  userId: string,
  input: { name: string; type: string; body: string; status: string },
) {
  const [t] = await db
    .insert(smsTemplates)
    .values({
      userId,
      name: input.name,
      type: input.type as "Promotional" | "Transactional" | "OTP" | "Custom",
      body: input.body,
      status: input.status as "active" | "inactive",
    })
    .returning();
  return mapTemplate(t);
}

export async function updateTemplate(
  userId: string,
  id: string,
  input: Partial<{ name: string; type: string; body: string; status: string }>,
) {
  await getTemplate(userId, id);
  const [t] = await db
    .update(smsTemplates)
    .set({
      ...(input.name && { name: input.name }),
      ...(input.type && { type: input.type as "Promotional" | "Transactional" | "OTP" | "Custom" }),
      ...(input.body && { body: input.body }),
      ...(input.status && { status: input.status as "active" | "inactive" }),
      updatedAt: new Date(),
    })
    .where(and(eq(smsTemplates.id, id), eq(smsTemplates.userId, userId)))
    .returning();
  return mapTemplate(t);
}

export async function deleteTemplate(userId: string, id: string) {
  await getTemplate(userId, id);
  await db
    .delete(smsTemplates)
    .where(and(eq(smsTemplates.id, id), eq(smsTemplates.userId, userId)));
}

export async function duplicateTemplate(userId: string, id: string) {
  const original = await db.query.smsTemplates.findFirst({
    where: and(eq(smsTemplates.id, id), eq(smsTemplates.userId, userId)),
  });
  if (!original) throw notFound("Template not found");
  const [t] = await db
    .insert(smsTemplates)
    .values({
      userId,
      name: `${original.name} (Copy)`,
      type: original.type,
      body: original.body,
      status: "inactive",
    })
    .returning();
  return mapTemplate(t);
}
