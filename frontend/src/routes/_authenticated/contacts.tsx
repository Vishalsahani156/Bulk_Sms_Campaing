import { createFileRoute } from "@tanstack/react-router";
import { Contact2, Users, UserCheck, UserX, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { GlassCard } from "@/components/dashboard/glass-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ContactsTable } from "@/components/dashboard/contacts-table";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { useContacts } from "@/hooks/use-contacts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Pulse SMS" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const { contacts, stats, isLoading, bulkDelete, bulkActivate } = useContacts({ limit: 100 });

  const statCards = [
    { label: "Total Contacts", value: stats.total, icon: Users, color: "text-primary" },
    { label: "Active", value: stats.active, icon: UserCheck, color: "text-success" },
    { label: "Unsubscribed", value: stats.unsubscribed, icon: UserX, color: "text-muted-foreground" },
    { label: "Bounced", value: stats.bounced, icon: ShieldAlert, color: "text-destructive" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Contacts" subtitle="Manage your audience and segments">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contacts" subtitle="Manage your audience and segments">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <GlassCard className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center",
                  s.color,
                )}
              >
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
              <ContactsTable
                data={contacts}
                onBulkDelete={bulkDelete}
                onBulkActivate={bulkActivate}
              />
            </div>
          )}
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
}
