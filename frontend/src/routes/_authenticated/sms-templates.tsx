import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/layout";
import { SmsTemplatesPage } from "@/components/sms-templates/sms-templates-page";

export const Route = createFileRoute("/_authenticated/sms-templates")({
  head: () => ({
    meta: [
      { title: "SMS Templates — Pulse SMS" },
      { name: "description", content: "Create and manage reusable SMS message templates." },
    ],
  }),
  component: SmsTemplatesRoute,
});

function SmsTemplatesRoute() {
  return (
    <DashboardLayout
      title="SMS Templates"
      subtitle="Create, edit, and organize reusable message templates for your campaigns"
    >
      <SmsTemplatesPage />
    </DashboardLayout>
  );
}
