import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/layout";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Pulse SMS" },
      { name: "description", content: "SMS delivery analytics, trends, and campaign performance." },
    ],
  }),
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Delivery trends, failures, and campaign performance"
    >
      <AnalyticsPage />
    </DashboardLayout>
  );
}
