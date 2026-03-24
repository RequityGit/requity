"use client";

import { useState, useMemo, useCallback } from "react";
import type { SelectableContact } from "./types";

interface UseContactSelectionReturn {
  contacts: SelectableContact[];
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  hasSelection: boolean;
  selectedExternal: SelectableContact[];
  selectedInternal: SelectableContact[];
  selectedContacts: SelectableContact[];
}

export function useContactSelection(
  contacts: SelectableContact[]
): UseContactSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(contacts.map((c) => c.id)));
  }, [contacts]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const hasSelection = selectedIds.size > 0;

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedIds.has(c.id)),
    [contacts, selectedIds]
  );

  const selectedExternal = useMemo(
    () => selectedContacts.filter((c) => c.category === "external"),
    [selectedContacts]
  );

  const selectedInternal = useMemo(
    () => selectedContacts.filter((c) => c.category === "internal"),
    [selectedContacts]
  );

  return {
    contacts,
    selectedIds,
    toggle,
    selectAll,
    clearSelection,
    hasSelection,
    selectedExternal,
    selectedInternal,
    selectedContacts,
  };
}
