import { apiRequest, apiRequestRaw } from "./client";
import type { Contact } from "@/types/sms";

export async function getContacts(params?: {
  status?: string;
  group?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.group) qs.set("group", params.group);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiRequest<{
    items: Contact[];
    total: number;
    page: number;
    limit: number;
    stats: { total: number; active: number; unsubscribed: number; bounced: number };
  }>(`/contacts${query ? `?${query}` : ""}`);
}

export async function createContact(input: { name: string; phone: string; groupId?: string }) {
  return apiRequest<Contact>("/contacts", { method: "POST", body: input });
}

export async function updateContact(
  id: string,
  input: Partial<{ name: string; phone: string; groupId: string; status: Contact["status"] }>,
) {
  return apiRequest<Contact>(`/contacts/${id}`, { method: "PATCH", body: input });
}

export async function bulkDeleteContacts(ids: string[]) {
  return apiRequest<{ deleted: number }>("/contacts/bulk-delete", {
    method: "POST",
    body: { ids },
  });
}

export async function bulkActivateContacts(ids: string[]) {
  return apiRequest<{ updated: number }>("/contacts/bulk-activate", {
    method: "POST",
    body: { ids },
  });
}

export async function exportContacts(ids?: string[]) {
  const qs = ids?.length ? `?ids=${ids.join(",")}` : "";
  const res = await apiRequestRaw(`/contacts/export${qs}`);
  return res.text();
}
