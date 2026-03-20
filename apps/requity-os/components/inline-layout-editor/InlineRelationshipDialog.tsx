"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Network,
  Plus,
  Loader2,
  ArrowRight,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchObjectRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "@/app/(authenticated)/control-center/object-manager/actions";
import type {
  ObjectRelationship,
} from "@/app/(authenticated)/control-center/object-manager/actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OBJECT_OPTIONS = [
  { key: "contact", label: "Contact" },
  { key: "company", label: "Company" },
  { key: "borrower_entity", label: "Borrower / Entity" },
  { key: "property", label: "Property" },
  { key: "loan", label: "Loan" },
  { key: "borrower", label: "Borrower Profile" },
  { key: "investor", label: "Investor Profile" },
  { key: "unified_deal", label: "Pipeline Deal" },
] as const;

const CARDINALITY_OPTIONS = [
  { key: "one_to_many", label: "One to Many" },
  { key: "many_to_one", label: "Many to One" },
  { key: "many_to_many", label: "Many to Many" },
  { key: "one_to_one", label: "One to One" },
] as const;

// Map page type to object key
const PAGE_TYPE_TO_OBJECT: Record<string, string> = {
  deal_detail: "unified_deal",
  contact_detail: "contact",
  company_detail: "company",
  loan_detail: "loan",
  property_detail: "property",
  borrower_detail: "borrower",
  borrower_entity_detail: "borrower_entity",
  investor_detail: "investor",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InlineRelationshipDialogProps {
  pageType: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InlineRelationshipDialog({
  pageType,
  children,
}: InlineRelationshipDialogProps) {
  const objectKey = PAGE_TYPE_TO_OBJECT[pageType] ?? "";
  const [open, setOpen] = useState(false);
  const [relationships, setRelationships] = useState<ObjectRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedRel, setExpandedRel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Add form state
  const [newChildObject, setNewChildObject] = useState("");
  const [newCardinality, setNewCardinality] = useState("one_to_many");
  const [newFkColumn, setNewFkColumn] = useState("");
  const [newQuickCreate, setNewQuickCreate] = useState(false);

  const loadRelationships = useCallback(async () => {
    if (!objectKey) return;
    setLoading(true);
    const result = await fetchObjectRelationships(objectKey);
    if (result.relationships) {
      setRelationships(result.relationships);
    }
    setLoading(false);
  }, [objectKey]);

  useEffect(() => {
    if (open && objectKey) {
      loadRelationships();
    }
  }, [open, objectKey, loadRelationships]);

  function handleCreate() {
    if (!newChildObject) return;
    startTransition(async () => {
      const input: {
        parent_object_key: string;
        child_object_key: string;
        cardinality: string;
        fk_column?: string;
        allow_quick_create?: boolean;
      } = {
        parent_object_key: objectKey,
        child_object_key: newChildObject,
        cardinality: newCardinality,
      };
      if (newFkColumn.trim()) input.fk_column = newFkColumn.trim();
      if (newQuickCreate) input.allow_quick_create = true;

      const result = await createRelationship(input);
      if (result.error) {
        toast.error(`Failed to create relationship: ${result.error}`);
      } else {
        toast.success("Relationship created");
        setShowAddForm(false);
        setNewChildObject("");
        setNewCardinality("one_to_many");
        setNewFkColumn("");
        setNewQuickCreate(false);
        loadRelationships();
      }
    });
  }

  function handleToggleQuickCreate(relId: string, current: boolean) {
    startTransition(async () => {
      const result = await updateRelationship(relId, { allow_quick_create: !current });
      if (result.error) {
        toast.error(`Failed to update: ${result.error}`);
      } else {
        setRelationships((prev) =>
          prev.map((r) => (r.id === relId ? { ...r, allow_quick_create: !current } : r))
        );
      }
    });
  }

  function handleDelete(relId: string) {
    startTransition(async () => {
      const result = await deleteRelationship(relId);
      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`);
      } else {
        toast.success("Relationship deleted");
        setRelationships((prev) => prev.filter((r) => r.id !== relId));
      }
    });
  }

  function getObjectLabel(key: string): string {
    return OBJECT_OPTIONS.find((o) => o.key === key)?.label ?? key;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <DialogTitle className="text-sm">
                Relationships for {getObjectLabel(objectKey)}
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Add form */}
              {showAddForm && (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3 mb-3 space-y-3">
                  <div className="text-xs font-medium">New Relationship</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Related Object</label>
                      <Select value={newChildObject} onValueChange={setNewChildObject}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {OBJECT_OPTIONS.filter((o) => o.key !== objectKey).map((o) => (
                            <SelectItem key={o.key} value={o.key} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Cardinality</label>
                      <Select value={newCardinality} onValueChange={setNewCardinality}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARDINALITY_OPTIONS.map((c) => (
                            <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">FK Column (optional)</label>
                    <Input
                      value={newFkColumn}
                      onChange={(e) => setNewFkColumn(e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="e.g. contact_id"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Allow Quick Create</span>
                    <Switch checked={newQuickCreate} onCheckedChange={setNewQuickCreate} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-[10px]" onClick={handleCreate} disabled={!newChildObject || pending}>
                      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing relationships */}
              {relationships.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">
                  No relationships configured for this object.
                </div>
              ) : (
                <div className="space-y-1">
                  {relationships.map((rel) => {
                    const isParent = rel.parent_object_key === objectKey;
                    const otherKey = isParent ? rel.child_object_key : rel.parent_object_key;
                    const isExpanded = expandedRel === rel.id;

                    return (
                      <div key={rel.id} className="rounded-lg border border-border overflow-hidden">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors bg-transparent border-0 cursor-pointer"
                          onClick={() => setExpandedRel(isExpanded ? null : rel.id)}
                        >
                          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                          <span className="text-xs font-medium">{getObjectLabel(objectKey)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{getObjectLabel(otherKey)}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                            {rel.cardinality.replace(/_/g, " ")}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-border space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                              <div>
                                <span className="text-muted-foreground">FK Column:</span>{" "}
                                <span className="font-mono">{rel.fk_column || "none"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Direction:</span>{" "}
                                <span>{rel.sync_direction ?? "parent_to_child"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cascade Delete:</span>{" "}
                                <span>{rel.cascade_delete ? "Yes" : "No"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Junction:</span>{" "}
                                <span className="font-mono">{rel.junction_table || "none"}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">Quick Create</span>
                                <Switch
                                  checked={rel.allow_quick_create ?? false}
                                  onCheckedChange={() => handleToggleQuickCreate(rel.id, rel.allow_quick_create ?? false)}
                                  disabled={pending}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(rel.id)}
                                disabled={pending}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
