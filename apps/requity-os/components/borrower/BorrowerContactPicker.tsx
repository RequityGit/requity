"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import {
  RelationshipPicker,
} from "@/components/shared/RelationshipPicker";
import {
  linkContactToMemberAction,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";
import type { DealBorrowerMember } from "@/app/types/borrower";

interface BorrowerContactPickerProps {
  member: DealBorrowerMember;
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  /** Called after linking/creating a contact (structural change, triggers re-fetch) */
  onLinked: () => void;
  /** Called for optimistic name updates on unlinked members */
  onSaveName: (name: string) => void;
}

function memberDisplayName(m: DealBorrowerMember): string {
  const direct = [m.first_name, m.last_name].filter(Boolean).join(" ");
  if (direct) return direct;
  const c = m.contact;
  if (c) return [c.first_name, c.last_name].filter(Boolean).join(" ") || "";
  return "";
}

export function BorrowerContactPicker({
  member,
  dealId,
  borrowingEntityId,
  existingContactIds,
  onLinked,
  onSaveName,
}: BorrowerContactPickerProps) {
  const hasContact = !!member.contact_id;
  const displayName = memberDisplayName(member);

  const [editing, setEditing] = useState(false);
  const [textQuery, setTextQuery] = useState("");
  const [linking, setLinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    if (linking) return;
    if (hasContact) {
      // Already linked - open picker to re-link
      setEditing(true);
    } else {
      // Unlinked - show text input that also opens picker
      setTextQuery(displayName);
      setEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [displayName, hasContact, linking]);

  /** Link existing contact to this borrower member */
  const handleSelectContact = useCallback(
    async (entity: ContactSearchResult) => {
      if (linking) return;
      setLinking(true);
      setEditing(false);

      const result = await linkContactToMemberAction(
        member.id,
        dealId,
        entity.id
      );

      setLinking(false);
      if (result.error) {
        showError(result.error);
      } else {
        const name = [entity.first_name, entity.last_name].filter(Boolean).join(" ") || "Contact";
        showSuccess(`Linked ${name}`);
        onLinked();
      }
    },
    [member.id, dealId, linking, onLinked]
  );

  /** After creating a new contact inline, link it to this member */
  const handleCreateAndLink = useCallback(
    async (entity: ContactSearchResult) => {
      if (linking) return;
      setLinking(true);
      setEditing(false);

      // The contact was already created by RelationshipPicker. Now link it.
      const result = await linkContactToMemberAction(
        member.id,
        dealId,
        entity.id
      );

      setLinking(false);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess("Contact created and linked");
        onLinked();
      }
    },
    [member.id, dealId, linking, onLinked]
  );

  /** Commit as plain text (for unlinked members only) */
  const commitAsText = useCallback(() => {
    setEditing(false);
    const trimmed = textQuery.trim();
    if (trimmed !== displayName) {
      onSaveName(trimmed);
    }
  }, [textQuery, displayName, onSaveName]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (editing && !hasContact) {
        commitAsText();
      }
    }, 200);
  }, [editing, hasContact, commitAsText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(false);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        commitAsText();
      }
    },
    [commitAsText]
  );

  // Linked state or editing linked: use RelationshipPicker
  if (hasContact) {
    return (
      <RelationshipPicker
        entityType="contact"
        variant="inline"
        excludeIds={existingContactIds}
        value={{ id: member.contact_id!, label: displayName }}
        onSelect={(entity) => handleSelectContact(entity as ContactSearchResult)}
        onCreate={(entity) => handleCreateAndLink(entity as ContactSearchResult)}
        disabled={linking}
      />
    );
  }

  // Unlinked + editing: show text input with picker below
  if (editing) {
    return (
      <div className="relative min-w-0">
        <Input
          ref={inputRef}
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Search contacts or type name..."
          className="h-8 text-sm bg-transparent"
          autoComplete="off"
          disabled={linking}
        />
        {/* Picker for searching contacts */}
        <div className="mt-1">
          <RelationshipPicker
            entityType="contact"
            variant="default"
            excludeIds={existingContactIds}
            placeholder="Search to link a contact..."
            onSelect={(entity) => handleSelectContact(entity as ContactSearchResult)}
            onCreate={(entity) => handleCreateAndLink(entity as ContactSearchResult)}
            disabled={linking}
          />
        </div>
      </div>
    );
  }

  // Unlinked + rest: show name/placeholder, click to edit
  return (
    <div className="group/field min-w-0">
      <button
        type="button"
        onClick={startEdit}
        className={cn(
          "relative w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 rq-transition",
          "border border-transparent",
          "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer"
        )}
      >
        {displayName ? (
          <span className="truncate">{displayName}</span>
        ) : (
          <span className="text-muted-foreground/40 truncate">Name</span>
        )}
      </button>
    </div>
  );
}
