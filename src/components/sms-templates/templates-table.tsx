import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRowSkeleton } from "@/components/dashboard/skeletons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TemplateStatusBadge } from "./template-status-badge";
import { TemplateTypeBadge } from "./template-type-badge";
import type { SmsTemplate, SmsTemplateStatus, SmsTemplateType } from "@/types/sms-template";
import { SMS_TEMPLATE_TYPES } from "@/types/sms-template";
import { formatTemplateDate, getCharacterCount, truncatePreview } from "@/lib/sms-template-utils";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Props {
  templates: SmsTemplate[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (template: SmsTemplate) => void;
  onDelete: (template: SmsTemplate) => void;
  onDuplicate: (template: SmsTemplate) => void;
}

type StatusFilter = SmsTemplateStatus | "all";
type TypeFilter = SmsTemplateType | "all";

export function TemplatesTable({
  templates,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    return templates.filter((t) => {
      const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [templates, query, typeFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="rounded-xl glass overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by template name…"
            className="pl-9 bg-card/60 border-border/60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center px-1">
            Type
          </span>
          {(["all", ...SMS_TEMPLATE_TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                typeFilter === t
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center px-1">
          Status
        </span>
        {(["all", "active", "inactive"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all capitalize",
              statusFilter === s
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl glass">
          <EmptyState
            icon={FileText}
            title="No SMS templates yet"
            description="Create reusable message templates with variables for faster campaign setup."
            actionLabel="Create template"
            onAction={onCreate}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl glass p-8 text-center text-sm text-muted-foreground">
          No templates match your search or filters.
        </div>
      ) : (
        <div className="rounded-xl glass overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="font-medium px-4 py-3 min-w-[140px]">Template name</th>
                  <th className="font-medium px-4 py-3">Type</th>
                  <th className="font-medium px-4 py-3 min-w-[200px]">Message preview</th>
                  <th className="font-medium px-4 py-3">Chars</th>
                  <th className="font-medium px-4 py-3">Created</th>
                  <th className="font-medium px-4 py-3">Status</th>
                  <th className="font-medium px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-medium">{t.name}</td>
                    <td className="px-4 py-3.5">
                      <TemplateTypeBadge type={t.type} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground max-w-xs">
                      <span className="line-clamp-2 font-mono text-xs leading-relaxed">
                        {truncatePreview(t.body, 90)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {getCharacterCount(t.body)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {formatTemplateDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <TemplateStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onEdit(t)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(t)}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(t)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border/60 text-xs text-muted-foreground">
            Showing {rows.length} of {templates.length} template{templates.length === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
