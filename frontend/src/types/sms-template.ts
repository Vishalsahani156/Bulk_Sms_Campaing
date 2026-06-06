export type SmsTemplateType = "Promotional" | "Transactional" | "OTP" | "Custom";

export type SmsTemplateStatus = "active" | "inactive";

export interface SmsTemplate {
  id: string;
  name: string;
  type: SmsTemplateType;
  body: string;
  status: SmsTemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export type SmsTemplateInput = Pick<SmsTemplate, "name" | "type" | "body" | "status">;

export const SMS_TEMPLATE_TYPES: SmsTemplateType[] = [
  "Promotional",
  "Transactional",
  "OTP",
  "Custom",
];

export const SMS_TEMPLATE_VARIABLE_HINT = "{{name}}, {{order_id}}, etc.";
