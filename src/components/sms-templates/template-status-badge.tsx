import { cn } from "@/lib/utils";
import type { SmsTemplateStatus } from "@/types/sms-template";

const styles: Record<SmsTemplateStatus, string> = {
  active:
    "bg-[oklch(0.72_0.17_155_/_15%)] text-[oklch(0.84_0.17_155)] border-[oklch(0.72_0.17_155_/_30%)]",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function TemplateStatusBadge({ status }: { status: SmsTemplateStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
