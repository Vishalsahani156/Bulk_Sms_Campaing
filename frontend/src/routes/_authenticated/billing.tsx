import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/layout";
import { BillingPage } from "@/components/billing/billing-page";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Pulse SMS" },
      { name: "description", content: "SMS usage, wallet balance, and payments." },
    ],
  }),
  component: BillingRoute,
});

function BillingRoute() {
  return (
    <DashboardLayout title="Billing" subtitle="Usage, wallet balance, and payments">
      <BillingPage />
    </DashboardLayout>
  );
}
