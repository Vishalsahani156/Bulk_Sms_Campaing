import type { SmsTemplate } from "@/types/sms-template";

export const seedSmsTemplates: SmsTemplate[] = [
  {
    id: "tpl_seed_1",
    name: "Order Delivered",
    type: "Transactional",
    body: "Hi {{name}}, your order {{order_id}} has been delivered. Thank you for shopping with us!",
    status: "active",
    createdAt: "2025-11-12T10:00:00.000Z",
    updatedAt: "2025-11-12T10:00:00.000Z",
  },
  {
    id: "tpl_seed_2",
    name: "Flash Sale Alert",
    type: "Promotional",
    body: "Hey {{name}}! 24h flash sale — use code {{promo_code}} for 30% off. Shop now: {{link}}",
    status: "active",
    createdAt: "2025-12-01T14:30:00.000Z",
    updatedAt: "2025-12-15T09:00:00.000Z",
  },
  {
    id: "tpl_seed_3",
    name: "OTP Verification",
    type: "OTP",
    body: "Your Pulse SMS verification code is {{otp}}. Valid for 10 minutes. Do not share this code.",
    status: "active",
    createdAt: "2026-01-05T08:00:00.000Z",
    updatedAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "tpl_seed_4",
    name: "Appointment Reminder",
    type: "Custom",
    body: "Reminder: Hi {{name}}, your appointment on {{date}} at {{time}} is confirmed.",
    status: "inactive",
    createdAt: "2026-02-10T16:45:00.000Z",
    updatedAt: "2026-02-18T11:20:00.000Z",
  },
];
