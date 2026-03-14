"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Building2, Pencil, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DealBorrowingEntity } from "@/app/types/borrower";
import { ENTITY_TYPES, US_STATES } from "./constants";
import { upsertBorrowingEntityAction, deleteBorrowingEntityAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";

interface BorrowingEntityCardProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const emptyEntity = (dealId: string): Partial<DealBorrowingEntity> & { deal_id: string } => ({
  deal_id: dealId,
  entity_name: "",
  entity_type: "LLC",
  ein: "",
  state_of_formation: "",
  date_of_formation: null,
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
});

export function BorrowingEntityCard({
  dealId,
  entity,
  onSaved,
  onDeleted,
}: BorrowingEntityCardProps) {
  const [editing, setEditing] = useState(!entity);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Partial<DealBorrowingEntity> & { deal_id: string }>(() =>
    entity ? { ...entity, deal_id: dealId } : emptyEntity(dealId)
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await upsertBorrowingEntityAction(dealId, form);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Borrowing entity saved");
        setEditing(false);
        if (result.data) setForm({ ...result.data, deal_id: dealId });
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }, [dealId, form, onSaved]);

  const handleCancel = useCallback(() => {
    if (entity) {
      setForm({ ...entity, deal_id: dealId });
      setEditing(false);
    }
  }, [entity, dealId]);

  const handleDelete = useCallback(async () => {
    if (!entity?.id) return;
    setDeleting(true);
    try {
      const result = await deleteBorrowingEntityAction(entity.id, dealId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Borrowing entity removed");
        setForm(emptyEntity(dealId));
        setEditing(true);
        onDeleted?.();
      }
    } finally {
      setDeleting(false);
    }
  }, [entity?.id, dealId, onDeleted]);

  const dateVal = form.date_of_formation
    ? (typeof form.date_of_formation === "string"
        ? form.date_of_formation
        : (form.date_of_formation as unknown as Date).toISOString?.()?.slice(0, 10) ?? "")
    : "";

  if (!entity && !editing) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Borrowing Entity
          </h4>
        </div>
        {entity && !editing && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Entity Name</label>
                <Input
                  value={form.entity_name ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, entity_name: e.target.value }))}
                  placeholder="Entity name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Entity Type</label>
                <Select
                  value={form.entity_type ?? "LLC"}
                  onValueChange={(v) => setForm((p) => ({ ...p, entity_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">EIN</label>
                <Input
                  value={form.ein ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, ein: e.target.value }))}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">State of Formation</label>
                <Select
                  value={form.state_of_formation ?? ""}
                  onValueChange={(v) => setForm((p) => ({ ...p, state_of_formation: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of Formation</label>
                <DatePicker
                  value={dateVal}
                  onChange={(v) => setForm((p) => ({ ...p, date_of_formation: v || null }))}
                  placeholder="Pick date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground block">Address</label>
              <Input
                value={form.address_line_1 ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, address_line_1: e.target.value }))}
                placeholder="Address line 1"
              />
              <Input
                value={form.address_line_2 ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, address_line_2: e.target.value }))}
                placeholder="Address line 2"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={form.city ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                />
                <Select
                  value={form.state ?? ""}
                  onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={form.zip ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))}
                  placeholder="ZIP"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Save
              </Button>
              {entity && (
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{form.entity_name || "—"}</p>
            <p className="text-muted-foreground">
              Type: {form.entity_type || "—"} {form.ein ? `| EIN: ${form.ein}` : ""}
            </p>
            {(form.state_of_formation || dateVal) && (
              <p className="text-muted-foreground">
                Formation: {form.state_of_formation || "—"} {dateVal ? `| ${new Date(dateVal).toLocaleDateString("en-US")}` : ""}
              </p>
            )}
            {(form.address_line_1 || form.city) && (
              <p className="text-muted-foreground">
                {[form.address_line_1, [form.city, form.state, form.zip].filter(Boolean).join(", ")].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
