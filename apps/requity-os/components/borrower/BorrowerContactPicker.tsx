"use client";

import { useState, useCallback } from "react";
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
  existingContactIds,
  onLinked,
}: BorrowerContactPickerProps) {
  const hasContact = !!member.contact_id;
  const displayName = memberDisplayName(member);

  const [linking, setLinking] = useState(false);

  /** Link existing contact to this borrower member */
  const handleSelectContact = useCallback(
    async (entity: ContactSearchResult) => {
      if (linking) return;
      setLinking(true);

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

  // Both linked and unlinked members use RelationshipPicker inline variant.
  // Linked: shows current contact name, clickable to re-link.
  // Unlinked (legacy): shows placeholder, clickable to link a contact.
  return (
    <RelationshipPicker
      entityType="contact"
      variant="inline"
      excludeIds={existingContactIds}
      value={
        hasContact
          ? { id: member.contact_id!, label: displayName }
          : displayName
            ? { id: "", label: displayName }
            : null
      }
      placeholder="Link a contact..."
      onSelect={(entity) => handleSelectContact(entity as ContactSearchResult)}
      onCreate={(entity) => handleCreateAndLink(entity as ContactSearchResult)}
      disabled={linking}
    />
  );
}
