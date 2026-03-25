"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, Plus, Pencil, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { PersonAvatar } from "@/components/shared/ExpandablePersonCard";
import type { DealTeamMember } from "@/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string | null;
}

const TEAM_ROLES = [
  "Assigned To",
  "Originator",
  "Processor",
  "Underwriter",
  "Closer",
  "Team Member",
] as const;

interface DealTeamInternalSectionProps {
  dealId: string;
  dealTeamMembers: DealTeamMember[];
  teamMembers: Profile[];
  onAddMember: (profileId: string, role: string) => Promise<{ error?: string }>;
  onRemoveMember: (memberId: string) => Promise<{ error?: string }>;
}

export function DealTeamInternalSection({
  dealId,
  dealTeamMembers,
  teamMembers,
  onAddMember,
  onRemoveMember,
}: DealTeamInternalSectionProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRole, setAssignRole] = useState<string>("");
  const [assignProfileId, setAssignProfileId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Build a lookup from profile_id -> profile
  const profileMap = new Map<string, Profile>();
  teamMembers.forEach((p) => profileMap.set(p.id, p));

  // Map of role -> assigned member
  const roleAssignments = new Map<string, { member: DealTeamMember; profile: Profile | null }>();
  for (const m of dealTeamMembers) {
    roleAssignments.set(m.role, {
      member: m,
      profile: profileMap.get(m.profile_id) ?? null,
    });
  }

  const handleAssign = useCallback(async () => {
    if (!assignProfileId || !assignRole) return;
    setAssigning(true);
    try {
      const result = await onAddMember(assignProfileId, assignRole);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess("Team member assigned");
        setAssignOpen(false);
        setAssignRole("");
        setAssignProfileId("");
      }
    } finally {
      setAssigning(false);
    }
  }, [assignProfileId, assignRole, onAddMember]);

  return (
    <>
      <div className="rq-card-wrapper">
        <div className="rq-card-header">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="rq-micro-label">
              Deal Team
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setAssignOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Assign
          </Button>
        </div>

        <div>
          {TEAM_ROLES.map((role) => {
            const assignment = roleAssignments.get(role);
            const profile = assignment?.profile;
            const name = profile?.full_name ?? "Unassigned";
            const email = profile?.email ?? "";
            const initials = profile?.full_name
              ? profile.full_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?";
            const isAssigned = !!assignment;

            return (
              <div
                key={role}
                className="rq-list-row gap-3 py-1.5 group/team"
              >
                <PersonAvatar
                  initials={initials}
                  palette="blue"
                  size="sm"
                  dimmed={!isAssigned}
                />
                <span className="text-[11px] text-muted-foreground w-[100px] shrink-0">
                  {role}
                </span>
                <span
                  className={`text-[13px] flex-1 min-w-0 truncate ${
                    isAssigned ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  {name}
                </span>
                {isAssigned && email && (
                  <span className="text-[11px] text-muted-foreground num truncate hidden lg:block">
                    {email}
                  </span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover/team:opacity-100 rq-transition">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setAssignRole(role);
                      setAssignProfileId(assignment?.member.profile_id ?? "");
                      setAssignOpen(true);
                    }}
                    title={isAssigned ? "Change" : "Assign"}
                  >
                    {isAssigned ? (
                      <Pencil className="h-3 w-3" strokeWidth={1.5} />
                    ) : (
                      <Plus className="h-3 w-3" strokeWidth={1.5} />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <span className="inline-field-label">Role</span>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger className="inline-field">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="inline-field-label">Team Member</span>
              <Select value={assignProfileId} onValueChange={setAssignProfileId}>
                <SelectTrigger className="inline-field">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email ?? p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignProfileId || !assignRole || assigning}
            >
              {assigning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
