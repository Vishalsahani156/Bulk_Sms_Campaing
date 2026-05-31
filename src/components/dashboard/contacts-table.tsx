import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MoreHorizontal,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/sms";

interface Props {
  data: Contact[];
}

type SortKey = "name" | "phone" | "group" | "status" | "addedAt";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | Contact["status"];

const PAGE_SIZE = 10;

export function ContactsTable({ data }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupFilter, setGroupFilter] = useState<"all" | string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("addedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () => Array.from(new Set(data.map((c) => c.group))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    return data
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (groupFilter !== "all" && c.group !== groupFilter) return false;
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "addedAt") {
          return (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()) * dir;
        }
        return (a[sortKey].localeCompare(b[sortKey])) * dir;
      });
  }, [data, query, statusFilter, groupFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      paginated.forEach((c) => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleBulkAction(action: "delete" | "export" | "activate") {
    // In a real app, these would call server functions
    if (action === "delete") {
      const next = new Set(selectedIds);
      // Simulate deletion by clearing selection; real app would mutate data
      setSelectedIds(new Set());
    }
    if (action === "activate") {
      setSelectedIds(new Set());
    }
    if (action === "export") {
      const selectedContacts = data.filter((c) => selectedIds.has(c.id));
      const csv = [
        ["Name", "Phone", "Group", "Status", "Added"],
        ...selectedContacts.map((c) => [
          c.name,
          c.phone,
          c.group,
          c.status,
          new Date(c.addedAt).toLocaleDateString(),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const selectedCount = selectedIds.size;

  function SortHeader({ label, sortKey: key }: { label: string; sortKey: SortKey }) {
    const active = sortKey === key;
    return (
      <button
        onClick={() => toggleSort(key)}
        className={cn(
          "flex items-center gap-1 hover:text-foreground transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active && "text-primary")} />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, phone, or group…"
            className="pl-9 bg-card/60 border-border/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-36 bg-card/60 border-border/60 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={groupFilter}
            onValueChange={(v) => {
              setGroupFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-36 bg-card/60 border-border/60 text-xs">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export All
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between glass rounded-xl px-4 py-2.5"
          >
            <div className="flex items-center gap-3 text-sm">
              <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-medium">
                {selectedCount} contact{selectedCount > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleBulkAction("activate")}
              >
                <UserCheck className="h-3.5 w-3.5" /> Mark Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleBulkAction("export")}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => handleBulkAction("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="font-medium px-4 py-3 w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="font-medium px-4 py-3">
                  <SortHeader label="Name" sortKey="name" />
                </th>
                <th className="font-medium px-4 py-3">
                  <SortHeader label="Phone" sortKey="phone" />
                </th>
                <th className="font-medium px-4 py-3">
                  <SortHeader label="Group" sortKey="group" />
                </th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3">
                  <SortHeader label="Added" sortKey="addedAt" />
                </th>
                <th className="font-medium px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginated.map((c, i) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: i * 0.015, duration: 0.2 }}
                      className={cn(
                        "border-b border-border/40 last:border-0 transition-colors cursor-pointer",
                        isSelected ? "bg-primary/8" : "hover:bg-accent/20",
                      )}
                      onClick={() => toggleRow(c.id)}
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(c.id)}
                          aria-label={`Select ${c.name}`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                            {c.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium whitespace-nowrap">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {c.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted/60 whitespace-nowrap">
                          {c.group}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs",
                            c.status === "active" && "text-success",
                            c.status === "unsubscribed" && "text-muted-foreground",
                            c.status === "bounced" && "text-destructive",
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(c.addedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-strong">
                            <DropdownMenuItem className="gap-2">
                              <Mail className="h-3.5 w-3.5" /> Send message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <UserCheck className="h-3.5 w-3.5" /> Edit contact
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} contacts
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs tabular-nums px-2">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
