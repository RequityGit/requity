"use client";

import { useState, useTransition } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  LayoutGrid,
  FileText,
  DollarSign,
  Building2,
  User,
  Calculator,
  Activity,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import {
  updateSection,
  deleteSection,
} from "@/app/(authenticated)/control-center/object-manager/actions";

const SECTION_ICONS = [
  { key: "LayoutGrid", icon: LayoutGrid, label: "Grid" },
  { key: "FileText", icon: FileText, label: "Document" },
  { key: "DollarSign", icon: DollarSign, label: "Dollar" },
  { key: "Building2", icon: Building2, label: "Building" },
  { key: "User", icon: User, label: "User" },
  { key: "Calculator", icon: Calculator, label: "Calculator" },
  { key: "Activity", icon: Activity, label: "Activity" },
] as const;

function getIconComponent(iconKey: string) {
  return SECTION_ICONS.find((i) => i.key === iconKey)?.icon ?? LayoutGrid;
}

interface SectionConfigPopoverProps {
  sectionId: string;
  sectionLabel: string;
  sectionIcon: string | null;
  isLocked: boolean;
  isVisible: boolean;
  isTempSection: boolean;
  onSectionDeleted: (sectionId: string) => void;
  onSectionUpdated: (sectionId: string, label: string, icon: string) => void;
  onVisibilityToggled: (sectionId: string, visible: boolean) => void;
  children: React.ReactNode;
}

export function SectionConfigPopover({
  sectionId,
  sectionLabel,
  sectionIcon,
  isLocked,
  isVisible,
  isTempSection,
  onSectionDeleted,
  onSectionUpdated,
  onVisibilityToggled,
  children,
}: SectionConfigPopoverProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(sectionLabel);
  const [icon, setIcon] = useState(sectionIcon || "LayoutGrid");
  const [saving, startSave] = useTransition();
  const confirm = useConfirm();

  function handleSave() {
    if (!label.trim()) return;

    if (isTempSection) {
      // For temp sections, just update local state
      onSectionUpdated(sectionId, label.trim(), icon);
      setOpen(false);
      showSuccess("Section updated");
      return;
    }

    startSave(async () => {
      const result = await updateSection(sectionId, {
        section_label: label.trim(),
        section_icon: icon,
      });
      if (result.error) {
        showError(`Failed to update section: ${result.error}`);
      } else {
        onSectionUpdated(sectionId, label.trim(), icon);
        setOpen(false);
        showSuccess("Section updated");
      }
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Section",
      description: `This will permanently delete the "${sectionLabel}" section and remove all field placements within it. The fields themselves will not be deleted, only their placement on this page.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    if (isTempSection) {
      onSectionDeleted(sectionId);
      setOpen(false);
      showSuccess("Section removed");
      return;
    }

    const result = await deleteSection(sectionId);
    if (result.error) {
      showError(`Failed to delete section: ${result.error}`);
    } else {
      onSectionDeleted(sectionId);
      setOpen(false);
      showSuccess("Section deleted");
    }
  }

  return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start" side="bottom">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                Section Name
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Icon
              </label>
              <div className="flex flex-wrap gap-1">
                {SECTION_ICONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setIcon(opt.key)}
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-md border transition-colors cursor-pointer",
                      icon === opt.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                    title={opt.label}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-[10px] gap-1",
                  isVisible ? "text-muted-foreground" : "text-amber-500"
                )}
                onClick={() => {
                  onVisibilityToggled(sectionId, !isVisible);
                  if (!isTempSection) {
                    updateSection(sectionId, { is_visible: !isVisible });
                  }
                }}
                disabled={saving}
              >
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {isVisible ? "Visible" : "Hidden"}
              </Button>
              <div className="flex-1" />
              {!isLocked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-destructive hover:text-destructive gap-1"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground">Locked</span>
              )}
              <Button
                size="sm"
                className="h-7 text-[10px]"
                onClick={handleSave}
                disabled={saving || !label.trim()}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
  );
}

export { getIconComponent };
