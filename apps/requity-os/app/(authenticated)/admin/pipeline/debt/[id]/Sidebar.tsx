"use client";

import { useState, useCallback } from "react";
import {
  Zap,
  ArrowUpRight,
  FileText,
  Phone,
  Mail,
  Shield,
  Calendar,
  Users,
  CalendarDays,
  Plus,
  Loader2,
} from "lucide-react";
import {
  T,
  SectionCard,
  Av,
  fD,
  type DealData,
  type PipelineStage,
} from "./components";
import { advanceStage, advanceOpportunityStage } from "./actions";
import { logQuickAction, assignTeamMember } from "./update-deal-action";
import { SubmitForApprovalDialog } from "@/components/approvals/submit-for-approval-dialog";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { TeamProfile } from "./DealDetail";

interface SidebarProps {
  deal: DealData;
  stages: PipelineStage[];
  currentUserId: string;
  currentUserName: string;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
  adminProfiles?: TeamProfile[];
  isOpportunity?: boolean;
}

export function Sidebar({
  deal,
  stages,
  currentUserId,
  currentUserName,
  onSave,
  adminProfiles,
  isOpportunity,
}: SidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [advancing, setAdvancing] = useState(false);

  // Dialog states
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [scheduleClosingOpen, setScheduleClosingOpen] = useState(false);
  const [teamAssignOpen, setTeamAssignOpen] = useState(false);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [assigningRoleField, setAssigningRoleField] = useState<string>("");

  // Form states
  const [callNotes, setCallNotes] = useState("");
  const [callContact, setCallContact] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNotes, setEmailNotes] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const team = [
    { r: "Originator", field: "originator_id", m: deal._originator, color: "#7c3aed" },
    { r: "Processor", field: "processor_id", m: deal._processor, color: "#2563eb" },
    { r: "Underwriter", field: "underwriter_id", m: deal._underwriter, color: "#f59e0b" },
    { r: "Closer", field: "closer_id", m: deal._closer, color: "#22c55e" },
  ];

  const dates: { l: string; field: string; d: string | null | undefined }[] = [
    { l: "Created", field: "", d: deal.created_at },
    { l: "Last Updated", field: "", d: deal.updated_at },
    { l: "Est. Close", field: "expected_close_date", d: deal.expected_close_date },
    { l: "Application", field: "application_date", d: deal.application_date },
    { l: "Approval", field: "approval_date", d: deal.approval_date },
    { l: "Funding", field: "funding_date", d: deal.funding_date },
    { l: "Maturity", field: "maturity_date", d: deal.maturity_date },
  ];

  // Find next stage
  const nonTerminal = stages.filter((s) => !s.is_terminal);
  const currentIdx = nonTerminal.findIndex((s) => s.stage_key === deal.stage);
  const nextStage =
    currentIdx >= 0 && currentIdx < nonTerminal.length - 1
      ? nonTerminal[currentIdx + 1]
      : null;

  const handleAdvanceStage = async () => {
    if (!nextStage || advancing) return;
    setAdvancing(true);
    try {
      const result = isOpportunity
        ? await advanceOpportunityStage(
            deal.id,
            deal.stage,
            nextStage.stage_key,
            currentUserId,
            currentUserName
          )
        : await advanceStage(
            deal.id,
            deal.stage,
            nextStage.stage_key,
            currentUserId,
            currentUserName
          );
      if (result.error) {
        console.error("Advance stage error:", result.error);
        toast({
          title: "Failed to advance stage",
          description: result.error,
          variant: "destructive",
        });
      } else {
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  };

  const handleLogCall = useCallback(async () => {
    setActionLoading(true);
    try {
      const desc = `Call logged${callContact ? ` with ${callContact}` : ""}${callNotes ? `: ${callNotes}` : ""}`;
      await logQuickAction(deal.id, "call_logged", desc, currentUserId, {
        contact: callContact,
        notes: callNotes,
      });
      setLogCallOpen(false);
      setCallNotes("");
      setCallContact("");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, currentUserId, callContact, callNotes, router]);

  const handleSendEmail = useCallback(async () => {
    setActionLoading(true);
    try {
      const desc = `Email logged${emailSubject ? `: ${emailSubject}` : ""}`;
      await logQuickAction(deal.id, "email_sent", desc, currentUserId, {
        subject: emailSubject,
        notes: emailNotes,
      });
      setSendEmailOpen(false);
      setEmailSubject("");
      setEmailNotes("");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, currentUserId, emailSubject, emailNotes, router]);

  // Build deal snapshot for the approval dialog
  const dealSnapshot: Record<string, any> = {
    borrower_name: deal._borrower_name || "Unknown",
    loan_amount: deal.loan_amount,
    property_type: deal.property_type,
    property_address: deal.property_address,
    property_city: deal.property_city,
    property_state: deal.property_state,
    loan_type: deal.loan_type || deal.type,
    stage: deal.stage,
    ltv: deal.ltv,
    interest_rate: deal.interest_rate,
    type: deal.type,
  };

  // Build entity data for checklist validation
  const entityData: Record<string, any> = { ...deal };

  const handleScheduleClosing = useCallback(async () => {
    setActionLoading(true);
    try {
      if (onSave && closingDate) {
        await onSave("closing_date", closingDate);
      }
      await logQuickAction(
        deal.id,
        "closing_scheduled",
        `Closing scheduled for ${closingDate}${closingNotes ? `: ${closingNotes}` : ""}`,
        currentUserId,
        { date: closingDate, notes: closingNotes }
      );
      setScheduleClosingOpen(false);
      setClosingDate("");
      setClosingNotes("");
      router.refresh();
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, currentUserId, closingDate, closingNotes, onSave, router]);

  const handleAssignTeam = useCallback(async () => {
    if (!assigningRoleField || !selectedProfileId) return;
    setActionLoading(true);
    try {
      const result = await assignTeamMember(
        deal.id,
        assigningRoleField,
        selectedProfileId || null,
        isOpportunity
      );
      if (result.error) {
        console.error("Assign team error:", result.error);
        toast({
          title: "Failed to assign team member",
          description: result.error,
          variant: "destructive",
        });
      } else {
        router.refresh();
      }
      setTeamAssignOpen(false);
      setSelectedProfileId("");
    } finally {
      setActionLoading(false);
    }
  }, [deal.id, assigningRoleField, selectedProfileId, router]);

  const openTeamAssign = (role: string, field: string) => {
    setAssigningRole(role);
    setAssigningRoleField(field);
    const currentId =
      field === "originator_id" ? deal.originator_id :
      field === "processor_id" ? deal.processor_id :
      field === "underwriter_id" ? deal.underwriter_id :
      field === "closer_id" ? deal.closer_id : "";
    setSelectedProfileId(currentId || "");
    setTeamAssignOpen(true);
  };

  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-4 sticky top-5">
      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Zap}>
        <div className="flex flex-col gap-0.5">
          {nextStage && (
            <QuickAction
              icon={ArrowUpRight}
              label={`Advance to ${nextStage.label}`}
              accent={T.accent.blue}
              onClick={handleAdvanceStage}
              loading={advancing}
            />
          )}
          <QuickAction
            icon={FileText}
            label="Term Sheet"
            onClick={() => {
              window.open(`/admin/pipeline/debt/${deal.id}/term-sheet`, "_blank");
            }}
          />
          <QuickAction
            icon={Phone}
            label="Log Call"
            onClick={() => setLogCallOpen(true)}
          />
          <QuickAction
            icon={Mail}
            label="Send Email"
            onClick={() => setSendEmailOpen(true)}
          />
          <SubmitForApprovalDialog
            entityType={isOpportunity ? "opportunity" : "loan"}
            entityId={deal.id}
            entityData={entityData}
            dealSnapshot={dealSnapshot}
            trigger={
              <button
                className="flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150 bg-transparent"
                style={{ color: T.accent.amber }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.bg.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Shield size={15} color={T.accent.amber} strokeWidth={1.5} />
                Request Approval
              </button>
            }
          />
          <QuickAction
            icon={Calendar}
            label="Schedule Closing"
            onClick={() => setScheduleClosingOpen(true)}
          />
        </div>
      </SectionCard>

      {/* Team */}
      <SectionCard title="Team" icon={Users}>
        <div className="flex flex-col gap-2.5">
          {team.map((t) => (
            <button
              key={t.r}
              className="flex items-center gap-2.5 w-full bg-transparent border-0 cursor-pointer rounded-lg px-1 -mx-1 py-1 transition-colors hover:bg-[#1e1e22]"
              onClick={() => openTeamAssign(t.r, t.field)}
            >
              {t.m ? (
                <Av text={t.m.initials} size={28} color={t.color} />
              ) : (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    border: `1.5px dashed ${T.bg.border}`,
                  }}
                >
                  <Plus size={12} color={T.text.muted} strokeWidth={1.5} />
                </div>
              )}
              <div className="text-left">
                <div
                  className="text-xs font-medium"
                  style={{
                    color: t.m ? T.text.primary : T.text.muted,
                    fontStyle: t.m ? "normal" : "italic",
                  }}
                >
                  {t.m ? t.m.full_name : "Unassigned"}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: T.text.muted }}
                >
                  {t.r}
                </div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Borrower Summary */}
      {deal._borrower_name && (
        <SectionCard title="Borrower" icon={Shield}>
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-semibold" style={{ color: T.text.primary }}>
              {deal._entity_name || deal._borrower_name}
            </div>
            {deal._entity_type && (
              <div className="text-[11px]" style={{ color: T.text.muted }}>
                {deal._entity_type.replace(/_/g, ' ').replace(/\w/g, (c: string) => c.toUpperCase())}
                {deal.property_state ? ` · ${deal.property_state}` : ''}
              </div>
            )}
            {deal._borrower_name && deal._entity_name && (
              <div className="flex items-center gap-2 mt-1">
                <Av text={deal._borrower_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()} size={24} color="#7c3aed" />
                <div>
                  <div className="text-xs font-medium" style={{ color: T.text.primary }}>
                    {deal._borrower_name}
                  </div>
                  {deal._borrower_credit_score && (
                    <div className="text-[10px] num" style={{ color: T.text.muted }}>
                      FICO: {deal._borrower_credit_score}
                    </div>
                  )}
                </div>
              </div>
            )}
            {deal._borrower_experience != null && (
              <div className="text-[11px]" style={{ color: T.text.secondary }}>
                {deal._borrower_experience} prior transactions
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Key Dates */}
      <SectionCard title="Key Dates" icon={CalendarDays}>
        <div className="flex flex-col">
          {dates.map((d) => (
            <div
              key={d.l}
              className="flex justify-between py-1.5"
              style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
            >
              <span className="text-xs" style={{ color: T.text.muted }}>
                {d.l}
              </span>
              <span
                className="text-xs num"
                style={{ color: d.d ? T.text.primary : T.text.muted }}
              >
                {fD(d.d)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Dialogs ── */}

      {/* Log Call Dialog */}
      <Dialog open={logCallOpen} onOpenChange={setLogCallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Record a phone call for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Contact Name</label>
              <Input
                value={callContact}
                onChange={(e) => setCallContact(e.target.value)}
                placeholder="Who did you speak with?"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Call notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogCallOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogCall} disabled={actionLoading}>
              {actionLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Email</DialogTitle>
            <DialogDescription>
              Record an email sent for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={emailNotes}
                onChange={(e) => setEmailNotes(e.target.value)}
                placeholder="Email summary..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={actionLoading}>
              {actionLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Log Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Closing Dialog */}
      <Dialog open={scheduleClosingOpen} onOpenChange={setScheduleClosingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Closing</DialogTitle>
            <DialogDescription>
              Set the closing date for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Closing Date</label>
              <DatePicker
                value={closingDate}
                onChange={(value) => setClosingDate(value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Closing notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleClosingOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleClosing}
              disabled={actionLoading || !closingDate}
            >
              {actionLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamAssignOpen} onOpenChange={setTeamAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {assigningRole}</DialogTitle>
            <DialogDescription>
              Select a team member to assign as {assigningRole?.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select
              value={selectedProfileId}
              onValueChange={setSelectedProfileId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {adminProfiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeam}
              disabled={actionLoading || !selectedProfileId}
            >
              {actionLoading && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Quick Action Button ── */
function QuickAction({
  icon: Ic,
  label,
  accent,
  onClick,
  loading,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  accent?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2 text-left text-[13px] font-medium cursor-pointer transition-colors duration-150"
      style={{
        backgroundColor: "transparent",
        color: accent || T.text.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = T.bg.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" color={accent || T.text.muted} />
      ) : (
        <Ic size={15} color={accent || T.text.muted} strokeWidth={1.5} />
      )}
      {label}
    </button>
  );
}
