import { apiRequest } from "./client";
import type { SmsTemplate, SmsTemplateInput } from "@/types/sms-template";

export async function getTemplates(params?: { status?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString();
  return apiRequest<{ items: SmsTemplate[] }>(`/templates${query ? `?${query}` : ""}`);
}

export async function createTemplate(input: SmsTemplateInput) {
  return apiRequest<SmsTemplate>("/templates", { method: "POST", body: input });
}

export async function updateTemplate(id: string, input: Partial<SmsTemplateInput>) {
  return apiRequest<SmsTemplate>(`/templates/${id}`, { method: "PATCH", body: input });
}

export async function deleteTemplate(id: string) {
  return apiRequest<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" });
}

export async function duplicateTemplate(id: string) {
  return apiRequest<SmsTemplate>(`/templates/${id}/duplicate`, { method: "POST" });
}
