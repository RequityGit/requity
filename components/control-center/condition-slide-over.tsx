"use client";

import { useState, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CONDITION_CATEGORIES, CONDITION_STAGES, RESPONSIBLE_PARTIES } from "@/lib/constants";
import type { ConditionFormData } from "@/app/(authenticated)/control-center/conditions/actions";

interface ConditionTemplate {
  id: string;
  condition_name: string;
  category: string;
  required_stage: string;
  applies_to_commercial: boolean | null;
  applies_to_rtl: boolean | null;
  applies_to_dscr: boolean | null;
  applies_to_guc: boolean | null;
  applies_to_transactional: boolean | null;
  internal_description: string | null;
  borrower_description: string | null;
  responsible_party: string | null;
  critical_path_item: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {};
CONDITION_CATEGORIES.forEach((c) => {
  CATEGORY_LABELS[c.value] = c.label;
});
CATEGORY_LABELS["title_fraud_protection"] = "Title & Fraud Protection";
CATEGORY_LABELS["post_closing_items"] = "Post Closing Items";

interface ConditionSlideOverProps {
  open: boolean;
  onClose: () => void;
  condition: ConditionTemplate | null;
  presetCategory: string | null;
  onSave: (data: ConditionFormData) => Promise<boolean>;
  templates: ConditionTemplate[];
}

export function ConditionSlideOver({
  open,
  onClose,
  condition,
  presetCategory,
  onSave,
  templates,
}: ConditionSlideOverProps) {
  const isEditing = !!condition;

  const [formData, setFormData] = useState<ConditionFormData>({
    condition_name: "",
    category: "",
    required_stage: "processing",
    applies_to_commercial: true,
    applies_to_rtl: true,
    applies_to_dscr: true,
    applies_to_guc: true,
    applies_to_transactional: true,
    internal_description: null,
    borrower_description: null,
    responsible_party: null,
    critical_path_item: false,
    sort_order: null,
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opening
  useEffect(() => {
    if (!open) return;

    if (condition) {
      setFormData({
        id: condition.id,
        condition_name: condition.condition_name,
        category: condition.category,
        required_stage: condition.required_stage,
        applies_to_commercial: condition.applies_to_commercial ?? false,
        applies_to_rtl: condition.applies_to_rtl ?? false,
        applies_to_dscr: condition.applies_to_dscr ?? false,
        applies_to_guc: condition.applies_to_guc ?? false,
        applies_to_transactional: condition.applies_to_transactional ?? false,
        internal_description: condition.internal_description,
        borrower_description: condition.borrower_description,
        responsible_party: condition.responsible_party,
        critical_path_item: condition.critical_path_item ?? false,
        sort_order: condition.sort_order,
        is_active: condition.is_active ?? true,
      });
    } else {
      // Default for new condition
      const cat = presetCategory || "";
      const maxSort = templates
        .filter((t) => t.category === cat)
        .reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0);

      setFormData({
        condition_name: "",
        category: cat,
        required_stage: "processing",
        applies_to_commercial: true,
        applies_to_rtl: true,
        applies_to_dscr: true,
        applies_to_guc: true,
        applies_to_transactional: true,
        internal_description: null,
        borrower_description: null,
        responsible_party: null,
        critical_path_item: false,
        sort_order: maxSort + 1,
        is_active: true,
      });
    }
    setErrors({});
  }, [open, condition, presetCategory, templates]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.condition_name.trim()) {
      newErrors.condition_name = "Condition name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (
      !formData.applies_to_commercial &&
      !formData.applies_to_rtl &&
      !formData.applies_to_dscr &&
      !formData.applies_to_guc &&
      !formData.applies_to_transactional
    ) {
      newErrors.applies_to = "At least one loan type must be selected";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  }

  const allSelected =
    formData.applies_to_commercial &&
    formData.applies_to_rtl &&
    formData.applies_to_dscr &&
    formData.applies_to_guc &&
    formData.applies_to_transactional;

  function toggleAll() {
    const newValue = !allSelected;
    setFormData((prev) => ({
      ...prev,
      applies_to_commercial: newValue,
      applies_to_rtl: newValue,
      applies_to_dscr: newValue,
      applies_to_guc: newValue,
      applies_to_transactional: newValue,
    }));
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>
            {isEditing ? "Edit Condition" : "Add Condition"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update this condition template"
              : "Create a new condition template for loan checklists"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Condition Name */}
          <div className="space-y-1.5">
            <Label htmlFor="condition_name">
              Condition Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="condition_name"
              value={formData.condition_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  condition_name: e.target.value,
                }))
              }
              placeholder="e.g., Borrower ID / Driver's License"
            />
            {errors.condition_name && (
              <p className="text-xs text-red-500">{errors.condition_name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, category: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {CATEGORY_LABELS[c.value] || c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Required Stage */}
          <div className="space-y-1.5">
            <Label>
              Required Stage <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.required_stage}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, required_stage: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Applies To */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>
                Applies To <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  key: "applies_to_commercial" as const,
                  label: "Commercial",
                },
                { key: "applies_to_rtl" as const, label: "RTL" },
                { key: "applies_to_dscr" as const, label: "DSCR" },
                { key: "applies_to_guc" as const, label: "GUC" },
                {
                  key: "applies_to_transactional" as const,
                  label: "Transactional",
                },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.applies_to && (
              <p className="text-xs text-red-500">{errors.applies_to}</p>
            )}
          </div>

          {/* Internal Description */}
          <div className="space-y-1.5">
            <Label htmlFor="internal_description">Internal Description</Label>
            <Textarea
              id="internal_description"
              value={formData.internal_description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  internal_description: e.target.value || null,
                }))
              }
              placeholder="Internal team notes..."
              rows={2}
            />
          </div>

          {/* Borrower Description */}
          <div className="space-y-1.5">
            <Label htmlFor="borrower_description">Borrower Description</Label>
            <Textarea
              id="borrower_description"
              value={formData.borrower_description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  borrower_description: e.target.value || null,
                }))
              }
              placeholder="What the borrower sees..."
              rows={2}
            />
          </div>

          {/* Responsible Party */}
          <div className="space-y-1.5">
            <Label>Responsible Party</Label>
            <Select
              value={formData.responsible_party || "none"}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  responsible_party: v === "none" ? null : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {RESPONSIBLE_PARTIES.map((rp) => (
                  <SelectItem key={rp.value} value={rp.value}>
                    {rp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Critical Path Item */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Critical Path Item</Label>
              <p className="text-xs text-muted-foreground">
                Blocks loan stage progression when not fulfilled
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.critical_path_item}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  critical_path_item: !prev.critical_path_item,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.critical_path_item ? "bg-teal-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.critical_path_item
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sort_order: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              placeholder="Position within category"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive templates won&apos;t appear on new loans
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.is_active}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: !prev.is_active,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? "bg-teal-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update Condition" : "Save Condition"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
