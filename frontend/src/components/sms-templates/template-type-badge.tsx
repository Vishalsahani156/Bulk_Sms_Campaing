import { cn } from "@/lib/utils";
import type { SmsTemplateType } from "@/types/sms-template";

const styles: Record<SmsTemplateType, string> = {
  Promotional:
    "bg-[oklch(0.72_0.18_280_/_12%)] text-[oklch(0.78_0.18_280)] border-[oklch(0.72_0.18_280_/_25%)]",
  Transactional:
    "bg-[oklch(0.7_0.16_230_/_12%)] text-[oklch(0.82_0.16_230)] border-[oklch(0.7_0.16_230_/_25%)]",
  OTP: "bg-[oklch(0.78_0.16_75_/_12%)] text-[oklch(0.86_0.16_75)] border-[oklch(0.78_0.16_75_/_25%)]",
  Custom: "bg-muted/80 text-muted-foreground border-border",
};

export function TemplateTypeBadge({ type }: { type: SmsTemplateType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}
