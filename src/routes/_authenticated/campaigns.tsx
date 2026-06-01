import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/layout";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { campaigns } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — Pulse SMS" }] }),
  component: () => (
    <DashboardLayout title="Campaigns" subtitle="All bulk SMS campaigns across your workspace">
      <CampaignsTable data={campaigns} />
    </DashboardLayout>
  ),
});
