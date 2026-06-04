-- Pulse SMS initial schema migration

CREATE TYPE "contact_status" AS ENUM('active', 'unsubscribed', 'bounced');
CREATE TYPE "campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'failed');
CREATE TYPE "recipient_status" AS ENUM('pending', 'sent', 'delivered', 'failed');
CREATE TYPE "template_type" AS ENUM('Promotional', 'Transactional', 'OTP', 'Custom');
CREATE TYPE "template_status" AS ENUM('active', 'inactive');
CREATE TYPE "billing_transaction_type" AS ENUM('top_up', 'debit', 'adjustment', 'refund');
CREATE TYPE "payment_method_type" AS ENUM('upi', 'gpay', 'card', 'netbanking', 'wallet');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(255),
  "avatar_url" text,
  "email_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE cascade,
  "balance_inr" numeric(12, 2) DEFAULT '0' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "billing_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "wallet_id" uuid NOT NULL REFERENCES "wallets"("id") ON DELETE cascade,
  "type" "billing_transaction_type" NOT NULL,
  "amount_inr" numeric(12, 2) NOT NULL,
  "method" "payment_method_type",
  "razorpay_payment_id" varchar(255) UNIQUE,
  "razorpay_order_id" varchar(255) UNIQUE,
  "reference_type" varchar(50),
  "reference_id" uuid,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "saved_payment_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "type" "payment_method_type" NOT NULL,
  "label" varchar(255) NOT NULL,
  "razorpay_customer_id" varchar(255),
  "last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(50),
  "entity_id" uuid,
  "metadata" text,
  "ip_address" varchar(45),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contact_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "group_id" uuid REFERENCES "contact_groups"("id") ON DELETE set null,
  "name" varchar(255) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "status" "contact_status" DEFAULT 'active' NOT NULL,
  "metadata" jsonb,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "contacts_user_phone_idx" ON "contacts" ("user_id", "phone");

CREATE TABLE IF NOT EXISTS "sms_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" varchar(255) NOT NULL,
  "type" "template_type" NOT NULL,
  "body" text NOT NULL,
  "status" "template_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "template_id" uuid REFERENCES "sms_templates"("id") ON DELETE set null,
  "name" varchar(255) NOT NULL,
  "status" "campaign_status" DEFAULT 'draft' NOT NULL,
  "sender_id" varchar(20) DEFAULT 'PULSE' NOT NULL,
  "message_body" text NOT NULL,
  "recipients_count" integer DEFAULT 0 NOT NULL,
  "delivered_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "cost_inr" numeric(12, 2) DEFAULT '0' NOT NULL,
  "scheduled_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "campaign_recipients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE cascade,
  "contact_id" uuid REFERENCES "contacts"("id") ON DELETE set null,
  "phone" varchar(20) NOT NULL,
  "status" "recipient_status" DEFAULT 'pending' NOT NULL,
  "provider_message_id" varchar(255),
  "error_code" varchar(50),
  "sent_at" timestamp with time zone,
  "delivered_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "sms_delivery_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "campaign_id" uuid REFERENCES "campaigns"("id") ON DELETE set null,
  "date" date NOT NULL,
  "sent" integer DEFAULT 0 NOT NULL,
  "delivered" integer DEFAULT 0 NOT NULL,
  "failed" integer DEFAULT 0 NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sms_delivery_logs_user_campaign_date_idx" ON "sms_delivery_logs" ("user_id", "campaign_id", "date");

CREATE TABLE IF NOT EXISTS "sender_ids" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "label" varchar(100) NOT NULL,
  "sender_id" varchar(20) NOT NULL,
  "is_default" integer DEFAULT 0 NOT NULL,
  "approved" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "type" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
