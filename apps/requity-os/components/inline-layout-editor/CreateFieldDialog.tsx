"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createField } from "@/app/(authenticated)/control-center/object-manager/actions";
import { useInlineLayout } from "./InlineLayoutContext";

const FIELD_TYPES = [
  { key: "text", label: "Text" },
  { key: "textarea", label: "Long Text" },
  { key: "number", label: "Number" },
  { key: "currency", label: "Currency" },
  { key: "percentage", label: "Percentage" },
  { key: "date", label: "Date" },
  { key: "datetime", label: "Date & Time" },
  { key: "dropdown", label: "Dropdown" },
  { key: "boolean", label: "Toggle" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "url", label: "URL" },
  { key: "address", label: "Address" },
] as const;

const MODULE_OPTIONS = [
  { key: "uw_deal", label: "Deal", sourceObjectKey: null },
  { key: "uw_property", label: "Property", sourceObjectKey: "property" },
  { key: "uw_borrower", label: "Borrower", sourceObjectKey: "borrower" },
] as const;

interface CreateFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
}

function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function CreateFieldDialog({
  open,
  onOpenChange,
  sectionId,
}: CreateFieldDialogProps) {
  const { addField } = useInlineLayout();
  const [creating, startCreate] = useTransition();

  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [autoKey, setAutoKey] = useState(true);
  const [fieldType, setFieldType] = useState("text");
  const [module, setModule] = useState("uw_deal");
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    if (autoKey) {
      setKey(labelToKey(label));
    }
  }, [label, autoKey]);

  function reset() {
    setLabel("");
    setKey("");
    setAutoKey(true);
    setFieldType("text");
    setModule("uw_deal");
    setDropdownOptions([]);
    setNewOption("");
  }

  function handleCreate() {
    if (!label.trim() || !key.trim()) return;

    startCreate(async () => {
      const input: {
        module: string;
        field_key: string;
        field_label: string;
        field_type: string;
        dropdown_options?: string[] | null;
      } = {
        module,
        field_key: key.trim(),
        field_label: label.trim(),
        field_type: fieldType,
      };

      if (fieldType === "dropdown" && dropdownOptions.length > 0) {
        input.dropdown_options = dropdownOptions.filter((o) => o.trim());
      }

      const result = await createField(input);
      if (result.error) {
        toast.error(`Failed to create field: ${result.error}`);
        return;
      }

      if (result.data) {
        // Add the newly created field to the current section in the layout
        const moduleConfig = MODULE_OPTIONS.find((m) => m.key === module);
        const sourceObjectKey = moduleConfig?.sourceObjectKey ?? null;
        addField(sectionId, result.data.field_key, result.data.id, sourceObjectKey);

        // Invalidate the field picker cache so it picks up the new field
        // We do this by clearing the module-level cache variable
        // (imported from FieldPicker would be circular, so we use a global event)
        window.dispatchEvent(new CustomEvent("inline-editor:field-created"));

        toast.success(`Field "${label.trim()}" created and added to layout`);
        reset();
        onOpenChange(false);
      }
    });
  }

  function addOption() {
    if (!newOption.trim()) return;
    setDropdownOptions((prev) => [...prev, newOption.trim()]);
    setNewOption("");
  }

  function removeOption(index: number) {
    setDropdownOptions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create New Field</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1.5 block">Field Label</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Loan to Value"
                className="h-9"
                autoFocus
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium mb-1.5 block">
                API Key
                <button
                  className="ml-2 text-[10px] text-muted-foreground underline cursor-pointer bg-transparent border-0"
                  onClick={() => setAutoKey(!autoKey)}
                >
                  {autoKey ? "customize" : "auto-generate"}
                </button>
              </label>
              <Input
                value={key}
                onChange={(e) => {
                  setAutoKey(false);
                  setKey(e.target.value);
                }}
                placeholder="loan_to_value"
                className="h-9 font-mono text-xs"
                disabled={autoKey}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">Object</label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.key} value={m.key} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">Type</label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fieldType === "dropdown" && (
            <div>
              <label className="text-xs font-medium mb-1.5 block">Dropdown Options</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dropdownOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="flex-1 text-xs px-2 py-1 rounded bg-muted truncate">
                      {opt}
                    </span>
                    <button
                      onClick={() => removeOption(idx)}
                      className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option..."
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !label.trim() || !key.trim()}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Create & Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
