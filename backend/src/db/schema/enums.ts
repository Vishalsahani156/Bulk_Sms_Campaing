import { pgEnum } from "drizzle-orm/pg-core";

export const contactStatusEnum = pgEnum("contact_status", [
  "active",
  "unsubscribed",
  "bounced",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "completed",
  "failed",
]);

export const recipientStatusEnum = pgEnum("recipient_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
]);

export const templateTypeEnum = pgEnum("template_type", [
  "Promotional",
  "Transactional",
  "OTP",
  "Custom",
]);

export const templateStatusEnum = pgEnum("template_status", ["active", "inactive"]);

export const billingTransactionTypeEnum = pgEnum("billing_transaction_type", [
  "top_up",
  "debit",
  "adjustment",
  "refund",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "upi",
  "gpay",
  "card",
  "netbanking",
  "wallet",
]);
