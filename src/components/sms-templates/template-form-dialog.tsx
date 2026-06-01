import { useEffect, useMemo, useState } from "react";
import { Loader2, Variable } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SmsTemplate, SmsTemplateInput, SmsTemplateType } from "@/types/sms-template";
import { SMS_TEMPLATE_TYPES, SMS_TEMPLATE_VARIABLE_HINT } from "@/types/sms-template";
import { extractVariables, getSmsSegmentInfo } from "@/lib/sms-template-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: SmsTemplate | null;
  onSave: (input: SmsTemplateInput) => Promise<void> | void;
}

const defaultForm: SmsTemplateInput = {
  name: "",
  type: "Promotional",
  body: "",
  status: "active",
};

export function TemplateFormDialog({ open, onOpenChange, mode, initial, onSave }: Props) {
  const [form, setForm] = useState<SmsTemplateInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name,
        type: initial.type,
        body: initial.body,
        status: initial.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, mode, initial]);

  const segmentInfo = useMemo(() => getSmsSegmentInfo(form.body), [form.body]);
  const variables = useMemo(() => extractVariables(form.body), [form.body]);

  const insertVariable = (name: string) => {
    const token = `{{${name}}}`;
    setForm((f) => ({ ...f, body: f.body ? `${f.body} ${token}` : token }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.body.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        type: form.type,
        body: form.body,
        status: form.status,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create SMS template" : "Edit template"}</DialogTitle>
          <DialogDescription>
            Use variables like {SMS_TEMPLATE_VARIABLE_HINT} — they are replaced when sending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Template name</Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Order confirmation"
              required
              className="bg-background/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as SmsTemplateType }))}
              >
                <SelectTrigger className="bg-background/40">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SMS_TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as SmsTemplateInput["status"] }))
                }
              >
                <SelectTrigger className="bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tpl-body">SMS message</Label>
              <div className="flex flex-wrap gap-1">
                {["name", "order_id", "otp", "link"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    +{`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="tpl-body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={`Hi {{name}}, your order {{order_id}} has been delivered.`}
              rows={5}
              required
              className="bg-background/40 font-mono text-sm resize-y min-h-[120px]"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {segmentInfo.chars} character{segmentInfo.chars === 1 ? "" : "s"}
              </span>
              <span className="text-border">·</span>
              <span className="tabular-nums">
                {segmentInfo.segments} SMS segment{segmentInfo.segments === 1 ? "" : "s"}
              </span>
              <span className="text-border">·</span>
              <span>{segmentInfo.encoding}</span>
            </div>
            {variables.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-2.5">
                <Variable className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {variables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-[10px] font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.name.trim() || !form.body.trim()}
              className="gradient-primary text-primary-foreground hover:opacity-90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
