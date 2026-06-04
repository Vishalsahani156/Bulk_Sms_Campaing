import { apiRequest } from "./client";
import type { Campaign } from "@/types/sms";

export async function getCampaigns(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiRequest<{ items: Campaign[]; total: number; page: number; limit: number }>(
    `/campaigns${query ? `?${query}` : ""}`,
  );
}

export async function getCampaign(id: string) {
  return apiRequest<Campaign>(`/campaigns/${id}`);
}

export async function createCampaign(input: {
  name: string;
  templateId?: string;
  messageBody: string;
  senderId?: string;
  contactIds?: string[];
  scheduledAt?: string;
}) {
  return apiRequest<Campaign>("/campaigns", { method: "POST", body: input });
}

export async function sendCampaign(id: string) {
  return apiRequest<{ jobId: string; status: string }>(`/campaigns/${id}/send`, {
    method: "POST",
  });
}

export async function duplicateCampaign(id: string) {
  return apiRequest<Campaign>(`/campaigns/${id}/duplicate`, { method: "POST" });
}
