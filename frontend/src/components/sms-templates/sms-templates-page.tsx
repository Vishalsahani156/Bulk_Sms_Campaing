import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";
import { useSmsTemplates } from "@/hooks/use-sms-templates";
import type { SmsTemplate, SmsTemplateInput } from "@/types/sms-template";
import { TemplatesTable } from "./templates-table";
import { TemplateFormDialog } from "./template-form-dialog";
import { DeleteTemplateDialog } from "./delete-template-dialog";

export function SmsTemplatesPage() {
  const { templates, isLoading, create, update, remove, duplicate } = useSmsTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SmsTemplate | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<SmsTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (template: SmsTemplate) => {
    setFormMode("edit");
    setEditing(template);
    setFormOpen(true);
  };

  const openDelete = (template: SmsTemplate) => {
    setDeleting(template);
    setDeleteOpen(true);
  };

  const handleSave = async (input: SmsTemplateInput) => {
    try {
      if (formMode === "edit" && editing) {
        await update(editing.id, input);
        toast.success("Template updated");
      } else {
        await create(input);
        toast.success("Template created");
      }
    } catch {
      toast.error("Could not save template");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await remove(deleting.id);
      toast.success("Template deleted");
      setDeleteOpen(false);
      setDeleting(null);
    } catch {
      toast.error("Could not delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (template: SmsTemplate) => {
    try {
      await duplicate(template.id);
      toast.success("Template duplicated");
    } catch {
      toast.error("Could not duplicate template");
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="space-y-5">
        <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">SMS Templates</h2>
            <p className="text-sm text-muted-foreground">
              Reusable message templates with variable placeholders for campaigns.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow shrink-0"
          >
            <Plus className="h-4 w-4" />
            New template
          </Button>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <TemplatesTable
            templates={templates}
            isLoading={isLoading}
            onEdit={openEdit}
            onDelete={openDelete}
            onDuplicate={handleDuplicate}
          />
        </GlassCard>
      </div>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={editing}
        onSave={handleSave}
      />

      <DeleteTemplateDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        template={deleting}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
