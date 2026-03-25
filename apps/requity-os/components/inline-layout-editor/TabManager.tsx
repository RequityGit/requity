"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  PanelRight,
  MapPin,
  User,
  Calculator,
  FolderOpen,
  Activity,
  MessageSquare,
  FileText,
  Database,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import {
  addTab,
  updateTab,
  deleteTab,
} from "@/lib/actions/layout-actions";
import type { DealLayoutTab } from "@/hooks/useDealLayout";

const TAB_ICONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "panel-right", icon: PanelRight, label: "Panel" },
  { key: "map-pin", icon: MapPin, label: "Location" },
  { key: "user", icon: User, label: "Person" },
  { key: "calculator", icon: Calculator, label: "Calculator" },
  { key: "folder-open", icon: FolderOpen, label: "Folder" },
  { key: "activity", icon: Activity, label: "Activity" },
  { key: "message-square", icon: MessageSquare, label: "Messages" },
  { key: "file-text", icon: FileText, label: "Document" },
  { key: "database", icon: Database, label: "Database" },
  { key: "layers", icon: Layers, label: "Layers" },
];

interface TabManagerProps {
  tabs: DealLayoutTab[];
  pageType: string;
  onTabsChanged: () => void;
}

export function TabManager({ tabs, pageType, onTabsChanged }: TabManagerProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs gap-1.5"
      onClick={() => setAddOpen(true)}
    >
      <Plus className="h-3 w-3" />
      Tab
      {addOpen && (
        <AddTabDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          pageType={pageType}
          onCreated={onTabsChanged}
        />
      )}
    </Button>
  );
}

// ── Inline tab rename popover (used on individual tab buttons) ──

interface TabEditPopoverProps {
  tabKey: string;
  tabLabel: string;
  tabIcon: string | null;
  tabLocked: boolean;
  pageType: string;
  onUpdated: () => void;
  children: React.ReactNode;
}

export function TabEditPopover({
  tabKey,
  tabLabel,
  tabIcon,
  tabLocked,
  pageType,
  onUpdated,
  children,
}: TabEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(tabLabel);
  const [icon, setIcon] = useState(tabIcon || "");
  const [saving, startSave] = useTransition();
  const confirm = useConfirm();

  function handleSave() {
    if (!label.trim()) return;
    startSave(async () => {
      const result = await updateTab(pageType, tabKey, {
        tab_label: label.trim(),
        tab_icon: icon || undefined,
      });
      if (result.error) {
        showError(`Failed to update tab: ${result.error}`);
      } else {
        setOpen(false);
        onUpdated();
        showSuccess("Tab updated");
      }
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete Tab",
      description: `This will permanently delete the "${tabLabel}" tab and all sections within it. Field placements will be removed but the field definitions will remain.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    const result = await deleteTab(pageType, tabKey);
    if (result.error) {
      showError(`Failed to delete tab: ${result.error}`);
    } else {
      setOpen(false);
      onUpdated();
      showSuccess("Tab deleted");
    }
  }

  return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start" side="bottom">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                Tab Name
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
                {TAB_ICONS.map((opt) => (
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

            <div className="flex items-center justify-between pt-1 border-t">
              {!tabLocked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-destructive hover:text-destructive gap-1"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Tab
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground">System tab</span>
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

// ── Add Tab Dialog ──

interface AddTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageType: string;
  onCreated: () => void;
}

function AddTabDialog({ open, onOpenChange, pageType, onCreated }: AddTabDialogProps) {
  const [label, setLabel] = useState("");
  const [creating, startCreate] = useTransition();

  function handleCreate() {
    if (!label.trim()) return;
    const tabKey = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    startCreate(async () => {
      const result = await addTab({
        page_type: pageType,
        tab_key: tabKey,
        tab_label: label.trim(),
      });
      if (result.error) {
        showError(`Failed to create tab: ${result.error}`);
      } else {
        setLabel("");
        onOpenChange(false);
        onCreated();
        showSuccess(`Tab "${label.trim()}" created`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Tab</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium mb-1.5 block">Tab Name</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Due Diligence"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !label.trim()}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Create Tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
