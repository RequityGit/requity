"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import {
  upsertRoutingRule,
  deleteRoutingRule,
} from "@/app/(authenticated)/(admin)/tasks/approvals/actions";
import type { ApprovalRoutingRule } from "@/lib/approvals/types";

interface RoutingRulesManagerProps {
  rules: ApprovalRoutingRule[];
  teamMembers: { id: string; full_name: string }[];
}

interface RuleFormState {
  id?: string;
  name: string;
  entity_type: string;
  priority_order: number;
  conditions: string;
  approver_id: string;
  fallback_approver_id: string;
  sla_hours: number;
  auto_priority: string;
  is_active: boolean;
}

const emptyForm: RuleFormState = {
  name: "",
  entity_type: "loan",
  priority_order: 0,
  conditions: "{}",
  approver_id: "",
  fallback_approver_id: "",
  sla_hours: 24,
  auto_priority: "normal",
  is_active: true,
};

export function RoutingRulesManager({ rules, teamMembers }: RoutingRulesManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  function openEdit(rule: ApprovalRoutingRule) {
    setForm({
      id: rule.id,
      name: rule.name,
      entity_type: rule.entity_type,
      priority_order: rule.priority_order,
      conditions: JSON.stringify(rule.conditions, null, 2),
      approver_id: rule.approver_id,
      fallback_approver_id: rule.fallback_approver_id || "",
      sla_hours: rule.sla_hours,
      auto_priority: rule.auto_priority,
      is_active: rule.is_active,
    });
    setOpen(true);
  }

  function openNew() {
    setForm({
      ...emptyForm,
      priority_order: rules.length,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.approver_id) {
      toast({ title: "Error", description: "Name and approver are required.", variant: "destructive" });
      return;
    }

    let conditions: Record<string, any>;
    try {
      conditions = JSON.parse(form.conditions);
    } catch {
      toast({ title: "Error", description: "Invalid JSON in conditions field.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await upsertRoutingRule({
      id: form.id,
      name: form.name,
      entity_type: form.entity_type,
      priority_order: form.priority_order,
      conditions,
      approver_id: form.approver_id,
      fallback_approver_id: form.fallback_approver_id || null,
      sla_hours: form.sla_hours,
      auto_priority: form.auto_priority,
      is_active: form.is_active,
    });
    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: form.id ? "Rule updated" : "Rule created" });
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(ruleId: string) {
    const result = await deleteRoutingRule(ruleId);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Rule deleted" });
      router.refresh();
    }
  }

  const memberMap: Record<string, string> = {};
  teamMembers.forEach((m) => { memberMap[m.id] = m.full_name; });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Routing Rules</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={openNew}>
          <PlusCircle className="h-4 w-4" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No routing rules configured. All approvals will route to the default super admin.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rule.name}</span>
                    {!rule.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{rule.entity_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Approver: {memberMap[rule.approver_id] || "Unknown"} · SLA: {rule.sla_hours}h · Priority: {rule.auto_priority}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete routing rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &ldquo;{rule.name}&rdquo;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(rule.id)} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Routing Rule" : "New Routing Rule"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Large Loan Approval"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="draw_request">Draw Request</SelectItem>
                      <SelectItem value="payoff">Payoff</SelectItem>
                      <SelectItem value="exception">Exception</SelectItem>
                      <SelectItem value="investor_distribution">Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority Order</Label>
                  <Input
                    type="number"
                    value={form.priority_order}
                    onChange={(e) => setForm({ ...form, priority_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conditions (JSON)</Label>
                <Textarea
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                  placeholder='{"loan_amount_gte": 1000000}'
                  rows={3}
                  className="num text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Empty {"{}"} = catch-all. Keys: loan_amount_gte, loan_amount_lte, asset_type_in, has_exception
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Approver</Label>
                  <Select value={form.approver_id} onValueChange={(v) => setForm({ ...form, approver_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fallback Approver</Label>
                  <Select value={form.fallback_approver_id} onValueChange={(v) => setForm({ ...form, fallback_approver_id: v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SLA Hours</Label>
                  <Input
                    type="number"
                    value={form.sla_hours}
                    onChange={(e) => setForm({ ...form, sla_hours: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto Priority</Label>
                  <Select value={form.auto_priority} onValueChange={(v) => setForm({ ...form, auto_priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
