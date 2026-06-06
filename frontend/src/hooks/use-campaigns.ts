import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api/campaigns.api";

export function useCampaigns(params?: { status?: string; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: () => getCampaigns(params),
  });
}
