import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/sms";

const styles: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  scheduled:
    "bg-[oklch(0.7_0.16_230_/_15%)] text-[oklch(0.82_0.16_230)] border-[oklch(0.7_0.16_230_/_30%)]",
  sending:
    "bg-[oklch(0.78_0.16_75_/_15%)] text-[oklch(0.86_0.16_75)] border-[oklch(0.78_0.16_75_/_30%)]",
  completed:
    "bg-[oklch(0.72_0.17_155_/_15%)] text-[oklch(0.84_0.17_155)] border-[oklch(0.72_0.17_155_/_30%)]",
  failed:
    "bg-[oklch(0.65_0.22_25_/_15%)] text-[oklch(0.8_0.2_25)] border-[oklch(0.65_0.22_25_/_30%)]",
};

const labels: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {status === "sending" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {labels[status]}
    </span>
  );
}
