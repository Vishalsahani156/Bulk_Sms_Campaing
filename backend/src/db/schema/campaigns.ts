import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  decimal,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { smsTemplates } from "./templates.js";
import { contacts } from "./contacts.js";
import { campaignStatusEnum, recipientStatusEnum } from "./enums.js";

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => smsTemplates.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  senderId: varchar("sender_id", { length: 20 }).notNull().default("PULSE"),
  messageBody: text("message_body").notNull(),
  recipientsCount: integer("recipients_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  costInr: decimal("cost_inr", { precision: 12, scale: 2 }).notNull().default("0"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignRecipients = pgTable("campaign_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  phone: varchar("phone", { length: 20 }).notNull(),
  status: recipientStatusEnum("status").notNull().default("pending"),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  errorCode: varchar("error_code", { length: 50 }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});

export const smsDeliveryLogs = pgTable(
  "sms_delivery_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    sent: integer("sent").notNull().default(0),
    delivered: integer("delivered").notNull().default(0),
    failed: integer("failed").notNull().default(0),
  },
  (table) => [
    uniqueIndex("sms_delivery_logs_user_campaign_date_idx").on(
      table.userId,
      table.campaignId,
      table.date,
    ),
  ],
);

export const senderIds = pgTable("sender_ids", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull(),
  senderId: varchar("sender_id", { length: 20 }).notNull(),
  isDefault: integer("is_default").notNull().default(0),
  approved: integer("approved").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
