import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, MoreHorizontal, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import type { Campaign, CampaignStatus } from "@/types/sms";
import { formatInr } from "@/lib/billing-pricing";
import { cn } from "@/lib/utils";

interface Props {
  data: Campaign[];
}

const statusFilters: (CampaignStatus | "all")[] = [
  "all", "sending", "completed", "scheduled", "draft", "failed",
];

export function CampaignsTable({ data }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    return data
      .filter((c) => (filter === "all" ? true : c.status === filter))
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sortDesc ? b.recipients - a.recipients : a.recipients - b.recipients));
  }, [data, query, filter, sortDesc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="pl-9 bg-card/60 border-border/60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all capitalize",
                filter === s
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {s}
            </button>
          ))}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 ml-1">
            <Filter className="h-3.5 w-3.5" /> More
          </Button>
        </div>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="font-medium px-4 py-3">Campaign</th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3">Sender</th>
                <th className="font-medium px-4 py-3">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => setSortDesc((s) => !s)}
                  >
                    Recipients <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="font-medium px-4 py-3">Delivery</th>
                <th className="font-medium px-4 py-3 text-right">Cost</th>
                <th className="font-medium px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                  className="border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.id}</div>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
                      {c.sender}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{c.recipients.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    {c.deliveryRate > 0 ? (
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full"
                            style={{ width: `${c.deliveryRate}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums w-12">{c.deliveryRate}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium">
                    {formatInr(c.cost)}
                  </td>
                  <td className="px-4 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Export report</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          <span>Showing {rows.length} of {data.length} campaigns</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7">Previous</Button>
            <Button variant="outline" size="sm" className="h-7">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
