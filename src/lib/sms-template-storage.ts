import type { SmsTemplate, SmsTemplateInput } from "@/types/sms-template";
import { seedSmsTemplates } from "@/lib/sms-template-seed";

const STORAGE_KEY = "pulse_sms_templates";

function loadRaw(): SmsTemplate[] {
  if (typeof window === "undefined") return [...seedSmsTemplates];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSmsTemplates));
      return [...seedSmsTemplates];
    }
    const parsed = JSON.parse(raw) as SmsTemplate[];
    return Array.isArray(parsed) ? parsed : [...seedSmsTemplates];
  } catch {
    return [...seedSmsTemplates];
  }
}

function saveAll(templates: SmsTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function newId() {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listSmsTemplates(): SmsTemplate[] {
  return loadRaw().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function createSmsTemplate(input: SmsTemplateInput): SmsTemplate {
  const now = new Date().toISOString();
  const template: SmsTemplate = {
    id: newId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadRaw();
  all.unshift(template);
  saveAll(all);
  return template;
}

export function updateSmsTemplate(id: string, input: SmsTemplateInput): SmsTemplate | null {
  const all = loadRaw();
  const index = all.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const updated: SmsTemplate = {
    ...all[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  saveAll(all);
  return updated;
}

export function deleteSmsTemplate(id: string): boolean {
  const all = loadRaw();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}

export function duplicateSmsTemplate(id: string): SmsTemplate | null {
  const source = loadRaw().find((t) => t.id === id);
  if (!source) return null;
  return createSmsTemplate({
    name: `${source.name} (Copy)`,
    type: source.type,
    body: source.body,
    status: "inactive",
  });
}

export function getSmsTemplateById(id: string): SmsTemplate | null {
  return loadRaw().find((t) => t.id === id) ?? null;
}
