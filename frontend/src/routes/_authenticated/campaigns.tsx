import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/layout";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useCampaigns } from "@/hooks/use-campaigns";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — Pulse SMS" }] }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const { data, isLoading } = useCampaigns();

  return (
    <DashboardLayout title="Campaigns" subtitle="All bulk SMS campaigns across your workspace">
      {isLoading ? <DashboardSkeleton /> : <CampaignsTable data={data?.items ?? []} />}
    </DashboardLayout>
  );
}
