import { createFileRoute } from "@tanstack/react-router";
import { Contact2, Users, UserCheck, UserX, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { GlassCard } from "@/components/dashboard/glass-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ContactsTable } from "@/components/dashboard/contacts-table";
import { contacts } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Pulse SMS" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const total = contacts.length;
  const active = contacts.filter((c) => c.status === "active").length;
  const unsubscribed = contacts.filter((c) => c.status === "unsubscribed").length;
  const bounced = contacts.filter((c) => c.status === "bounced").length;

  const statCards = [
    { label: "Total Contacts", value: total, icon: Users, color: "text-primary" },
    { label: "Active", value: active, icon: UserCheck, color: "text-success" },
    { label: "Unsubscribed", value: unsubscribed, icon: UserX, color: "text-muted-foreground" },
    { label: "Bounced", value: bounced, icon: ShieldAlert, color: "text-destructive" },
  ];

  return (
    <DashboardLayout title="Contacts" subtitle="Manage your audience and segments">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <GlassCard className="p-4 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center", s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <GlassCard className="p-0 overflow-hidden">
          {contacts.length === 0 ? (
            <EmptyState
              icon={Contact2}
              title="No contacts yet"
              description="Import your first list or add contacts manually to start sending campaigns."
              actionLabel="Import contacts"
            />
          ) : (
            <div className="p-4">
              <ContactsTable data={contacts} />
            </div>
          )}
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
}
