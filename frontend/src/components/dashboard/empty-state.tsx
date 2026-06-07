import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-2xl opacity-50 gradient-primary rounded-full" />
        <div className="relative h-14 w-14 rounded-2xl glass-strong flex items-center justify-center">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {actionLabel && (
        <Button
          onClick={onAction}
          className="mt-5 gradient-primary text-primary-foreground hover:opacity-90"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
