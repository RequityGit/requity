"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkflowDefinition } from "./types";

interface NewWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (workflow: WorkflowDefinition) => void;
}

export function NewWorkflowDialog({
  open,
  onClose,
  onCreated,
}: NewWorkflowDialogProps) {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("loan");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workflow_definitions")
      .insert({
        name: name.trim(),
        entity_type: entityType,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to create workflow",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      onCreated(data as unknown as WorkflowDefinition);
      setName("");
      setEntityType("loan");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            New Workflow
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Create a new workflow definition for a deal pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., DSCR Bridge Loan"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Entity Type
            </Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="opportunity">Deal</SelectItem>
                <SelectItem value="equity_deal">Equity Deal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim() || saving}
            >
              {saving ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
