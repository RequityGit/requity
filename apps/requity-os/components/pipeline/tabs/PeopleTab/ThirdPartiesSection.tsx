"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Globe, UserPlus } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { formatPhoneNumber } from "@/lib/format";
import { removeDealTeamContactAction } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { AddDealTeamDialog } from "@/components/deal-team/AddDealTeamDialog";
import {
  ExpandablePersonCard,
} from "@/components/shared/ExpandablePersonCard";
import type { DealTeamContact } from "@/app/types/deal-team";
import { getDealTeamContactDisplay, DEAL_TEAM_ROLES } from "@/app/types/deal-team";
import { Pencil, Trash2 } from "lucide-react";

const ROLE_PALETTE_MAP: Record<string, "rose" | "amber" | "blue" | "violet"> = {
  "Title Company": "rose",
  "Insurance Agent": "rose",
  "Appraiser": "rose",
  "Attorney": "violet",
  "CPA/Accountant": "violet",
  "Property Manager": "rose",
  "Contractor": "rose",
  "Other": "rose",
};

/** Roles to show as placeholders when unassigned */
const PLACEHOLDER_ROLES = ["Title Company", "Insurance Agent", "Appraiser", "Attorney"];

interface ThirdPartiesSectionProps {
  dealId: string;
  initialContacts: DealTeamContact[];
  onStructuralChange: () => void;
}

export function ThirdPartiesSection({
  dealId,
  initialContacts,
  onStructuralChange,
}: ThirdPartiesSectionProps) {
  const [contacts, setContacts] = useState<DealTeamContact[]>(initialContacts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<DealTeamContact | null>(null);
  const confirm = useConfirm();

  const handleAdd = useCallback(
    (newContact: DealTeamContact) => {
      setContacts((prev) => [...prev, newContact]);
      setIsAdding(false);
    },
    []
  );

  const handleUpdateAfterEdit = useCallback((updated: DealTeamContact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingContact(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "Remove third-party contact?",
        description:
          "This will remove the contact from the deal. They will not be deleted from the CRM.",
        confirmLabel: "Remove",
        destructive: true,
      });
      if (!ok) return;
      try {
        const result = await removeDealTeamContactAction(id, dealId);
        if (result.error) {
          showError(result.error);
        } else {
          setContacts((prev) => prev.filter((c) => c.id !== id));
          showSuccess("Contact removed");
        }
      } catch {
        showError("Could not remove contact");
      }
    },
    [confirm, dealId]
  );

  // Filter out "Broker" role since that's handled by BrokerSection
  const thirdPartyContacts = contacts.filter((c) => c.role !== "Broker");

  // Determine which placeholder roles to show
  const assignedRoles = new Set(thirdPartyContacts.map((c) => c.role));
  const unassignedPlaceholders = PLACEHOLDER_ROLES.filter(
    (r) => !assignedRoles.has(r)
  );

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Third Parties
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIsAdding(true)}
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add Party
          </Button>
        </div>

        {thirdPartyContacts.length === 0 && unassignedPlaceholders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No third-party contacts added.
          </div>
        ) : (
          <div>
            {thirdPartyContacts.map((c) => {
              const display = getDealTeamContactDisplay(c);
              const initials = display.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const palette = ROLE_PALETTE_MAP[c.role] ?? "rose";

              return (
                <div
                  key={c.id}
                  className="border-b last:border-b-0"
                >
                  <ExpandablePersonCard
                    avatar={{ initials: initials || "?", palette }}
                    name={display.name || "Unknown"}
                    subtitle={
                      [display.company, display.email].filter(Boolean).join(" \u00b7 ")
                    }
                    badge={c.role}
                    actions={
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingContact(c)}
                        >
                          <Pencil className="h-3 w-3" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                        </Button>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                      <div className="space-y-0">
                        <span className="inline-field-label">Email</span>
                        <div className="text-[13px] px-2 py-1">
                          {display.email ? (
                            <a
                              href={`mailto:${display.email}`}
                              className="rq-link-muted"
                            >
                              {display.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/40">
                              Add...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0">
                        <span className="inline-field-label">Phone</span>
                        <div className="text-[13px] px-2 py-1 num">
                          {display.phone ? (
                            <a
                              href={`tel:${display.phone.replace(/\D/g, "").slice(-10)}`}
                              className="rq-link-muted"
                            >
                              {formatPhoneNumber(display.phone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/40">
                              Add...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0">
                        <span className="inline-field-label">Company</span>
                        <div className="text-[13px] px-2 py-1">
                          {display.company || (
                            <span className="text-muted-foreground/40">
                              Add...
                            </span>
                          )}
                        </div>
                      </div>
                      {c.notes && (
                        <div className="space-y-0 col-span-full">
                          <span className="inline-field-label">Notes</span>
                          <div className="text-[13px] px-2 py-1 text-muted-foreground">
                            {c.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </ExpandablePersonCard>
                </div>
              );
            })}

            {/* Placeholder rows for unassigned common roles */}
            {unassignedPlaceholders.map((role) => (
              <div
                key={role}
                className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
              >
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 opacity-30">
                  ?
                </div>
                <span className="text-[13px] text-muted-foreground flex-1">
                  {role}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  Unassigned
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setIsAdding(true)}
                  title={`Add ${role}`}
                >
                  <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDealTeamDialog
        dealId={dealId}
        open={isAdding || !!editingContact}
        onClose={() => {
          setIsAdding(false);
          setEditingContact(null);
        }}
        onAdd={editingContact ? handleUpdateAfterEdit : handleAdd}
        editContact={editingContact}
        onEditDone={() => setEditingContact(null)}
      />
    </>
  );
}
