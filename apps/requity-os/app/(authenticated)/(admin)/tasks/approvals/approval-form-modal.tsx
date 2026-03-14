"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2 } from "lucide-react";
import { LinkedEntitySelect } from "../linked-entity-select";
import type { EnrichedApproval, Profile } from "./approvals-card-view";

const ENTITY_TYPES = [
  { value: "loan", label: "Loan" },
  { value: "draw_request", label: "Draw Request" },
  { value: "payoff", label: "Payoff" },
  { value: "exception", label: "Exception" },
  { value: "opportunity", label: "Deal" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface ApprovalFormModalProps {
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (approval: EnrichedApproval) => void;
}

export function ApprovalFormModal({
  profiles,
  currentUserId,
  onClose,
  onSaved,
}: ApprovalFormModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [entityType, setEntityType] = useState("loan");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [linkedEntityType, setLinkedEntityType] = useState("");
  const [linkedEntityId, setLinkedEntityId] = useState("");
  const [linkedEntityLabel, setLinkedEntityLabel] = useState("");

  const handleSave = async () => {
    if (!assignedTo || !entityType) return;
    setSaving(true);

    const supabase = createClient();
    const submitterProfile = profiles.find((p) => p.id === currentUserId);
    const approverProfile = profiles.find((p) => p.id === assignedTo);

    const payload: Record<string, unknown> = {
      entity_type: entityType,
      entity_id: linkedEntityId || null,
      submitted_by: currentUserId,
      assigned_to: assignedTo,
      status: "pending",
      priority,
      submission_notes: submissionNotes.trim() || null,
      deal_snapshot: {},
    };

    const { data, error } = await supabase
      .from("approval_requests" as never)
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to create approval",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      const enriched: EnrichedApproval = {
        ...(data as unknown as Record<string, unknown>),
        id: (data as unknown as Record<string, unknown>).id as string,
        entity_type: entityType,
        entity_id: linkedEntityId || "",
        status: "pending",
        priority,
        submitted_by: currentUserId,
        assigned_to: assignedTo,
        submission_notes: submissionNotes.trim() || null,
        decision_notes: null,
        deal_snapshot: {},
        sla_deadline: null,
        sla_breached: false,
        decision_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitter_name: submitterProfile?.full_name || "Unknown",
        approver_name: approverProfile?.full_name || "Unknown",
      };
      onSaved(enriched);

      // Also log to audit trail
      await supabase.from("approval_audit_log" as never).insert({
        approval_id: enriched.id,
        action: "submitted",
        performed_by: currentUserId,
        notes: submissionNotes.trim() || null,
        metadata: {},
        deal_snapshot: {},
      } as never);

      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold tracking-tight">
            New Approval Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Entity Type */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </Label>
            <Textarea
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Key context for the approver..."
              rows={3}
              className="resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Approver */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Approver
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => p.id !== currentUserId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linked Entity */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Link2 className="h-[11px] w-[11px]" strokeWidth={1.5} />
              Linked Entity
            </Label>
            <LinkedEntitySelect
              entityType={linkedEntityType}
              entityId={linkedEntityId}
              entityLabel={linkedEntityLabel}
              onChange={(type, id, label) => {
                setLinkedEntityType(type);
                setLinkedEntityId(id);
                setLinkedEntityLabel(label);
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!assignedTo || saving}
          >
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
