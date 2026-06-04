import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { contacts, contactGroups } from "../../db/schema/index.js";
import { notFound } from "../../shared/errors.js";
import { paginatedResponse, parsePagination } from "../../shared/pagination.js";
import { enqueueContactImport } from "../../shared/queue.js";

export function mapContact(c: typeof contacts.$inferSelect, groupName?: string) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    group: groupName ?? "General",
    status: c.status,
    addedAt: c.addedAt.toISOString(),
  };
}

async function getGroupName(groupId: string | null) {
  if (!groupId) return "General";
  const g = await db.query.contactGroups.findFirst({ where: eq(contactGroups.id, groupId) });
  return g?.name ?? "General";
}

export async function listContacts(
  userId: string,
  params: {
    status?: string;
    group?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
  const { page, limit, offset } = parsePagination(params);
  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: [desc(contacts.addedAt)],
  });

  let filtered = allContacts;
  if (params.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }

  const groups = await db.query.contactGroups.findMany({ where: eq(contactGroups.userId, userId) });
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  if (params.group) {
    filtered = filtered.filter((c) => {
      const name = c.groupId ? groupMap.get(c.groupId) : "General";
      return name === params.group;
    });
  }

  const stats = {
    total: allContacts.length,
    active: allContacts.filter((c) => c.status === "active").length,
    unsubscribed: allContacts.filter((c) => c.status === "unsubscribed").length,
    bounced: allContacts.filter((c) => c.status === "bounced").length,
  };

  const pageItems = filtered.slice(offset, offset + limit);
  const items = await Promise.all(
    pageItems.map(async (c) => mapContact(c, c.groupId ? groupMap.get(c.groupId) : "General")),
  );

  return { ...paginatedResponse(items, filtered.length, page, limit), stats };
}

export async function createContact(
  userId: string,
  input: { name: string; phone: string; groupId?: string },
) {
  let groupId = input.groupId ?? null;
  if (!groupId) {
    let defaultGroup = await db.query.contactGroups.findFirst({
      where: and(eq(contactGroups.userId, userId), eq(contactGroups.name, "General")),
    });
    if (!defaultGroup) {
      [defaultGroup] = await db
        .insert(contactGroups)
        .values({ userId, name: "General" })
        .returning();
    }
    groupId = defaultGroup.id;
  }

  const [c] = await db
    .insert(contacts)
    .values({
      userId,
      groupId,
      name: input.name,
      phone: input.phone,
      status: "active",
    })
    .returning();
  const groupName = await getGroupName(c.groupId);
  return mapContact(c, groupName);
}

export async function updateContact(
  userId: string,
  id: string,
  input: Partial<{ name: string; phone: string; groupId: string; status: string }>,
) {
  const existing = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, id), eq(contacts.userId, userId)),
  });
  if (!existing) throw notFound("Contact not found");

  const [c] = await db
    .update(contacts)
    .set({
      ...(input.name && { name: input.name }),
      ...(input.phone && { phone: input.phone }),
      ...(input.groupId && { groupId: input.groupId }),
      ...(input.status && { status: input.status as "active" | "unsubscribed" | "bounced" }),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id))
    .returning();
  const groupName = await getGroupName(c.groupId);
  return mapContact(c, groupName);
}

export async function bulkDeleteContacts(userId: string, ids: string[]) {
  const result = await db
    .delete(contacts)
    .where(and(eq(contacts.userId, userId), inArray(contacts.id, ids)));
  return { deleted: result.rowCount ?? ids.length };
}

export async function bulkActivateContacts(userId: string, ids: string[]) {
  await db
    .update(contacts)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(contacts.userId, userId), inArray(contacts.id, ids)));
  return { updated: ids.length };
}

export async function importContacts(userId: string, csvContent: string, groupId?: string) {
  await enqueueContactImport({ userId, csvContent, groupId });
  return { jobId: `import_${Date.now()}` };
}

export function exportContactsCsv(
  items: Array<{ name: string; phone: string; group: string; status: string }>,
) {
  const header = "name,phone,group,status\n";
  const rows = items.map((c) => `${c.name},${c.phone},${c.group},${c.status}`).join("\n");
  return header + rows;
}

export async function getContactsForExport(userId: string, ids?: string[]) {
  const all = await db.query.contacts.findMany({ where: eq(contacts.userId, userId) });
  const groups = await db.query.contactGroups.findMany({ where: eq(contactGroups.userId, userId) });
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  const filtered = ids?.length ? all.filter((c) => ids.includes(c.id)) : all;
  return filtered.map((c) =>
    mapContact(c, c.groupId ? groupMap.get(c.groupId) : "General"),
  );
}
