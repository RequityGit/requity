# ConfirmDialog Hook — Implementation Prompt

## Objective

Create a shared `useConfirm()` hook and `<ConfirmDialog>` component that handles every destructive or consequential action in the portal. Right now, 26 files independently wire up AlertDialog with inconsistent titles, descriptions, button styles, and loading states. This prompt replaces all of them with one import, one pattern.

---

## Current State

### 30 Independent AlertDialog Implementations Across 26 Files

Every destructive action in the portal builds its own confirmation dialog from scratch. Each file imports 7-8 AlertDialog subcomponents, manages its own open/loading state, and makes its own styling decisions.

**Inconsistencies found:**

| Issue | Examples |
|-------|---------|
| **Title format varies** | "Delete Contact" vs "Delete template?" vs "Delete document?" vs "Remove deal team contact?" — some have question marks, some don't, capitalization differs |
| **Description quality varies** | Some explain consequences ("This will remove them from all linked deals"), some are generic ("Are you sure?"), some have none |
| **Loading state handling varies** | Some use `useState` + `loading`, some use `useTransition` + `isPending`, some have no loading state at all |
| **Toast library varies** | Some use `useToast()` from shadcn, some use `toast` from sonner |
| **Button styles vary** | Most use `bg-red-600 hover:bg-red-700`, but not all destructive actions are styled as destructive |
| **Non-destructive confirmations exist** | "Submit for Approval", "Grant Super Admin Access" — these need a non-destructive confirm variant |
| **Boilerplate is massive** | Each dialog requires ~30 lines of JSX and 7 imports from alert-dialog |

### Files With AlertDialog Confirmations

**Destructive (delete/remove):**
- `crm/delete-contact-button.tsx` — Delete contact
- `crm/delete-company-button.tsx` — Delete company
- `crm/contacts-view.tsx` — Delete contact (duplicate pattern)
- `crm/companies-view.tsx` — Delete company (duplicate pattern)
- `admin/document-delete-dialog.tsx` — Delete document
- `admin/email-templates/delete-confirm-dialog.tsx` — Delete email template
- `admin/borrower-entity-list.tsx` — Delete entity
- `admin/quote-detail-client.tsx` — Delete quote, Decline quote (2 dialogs)
- `admin/workflow-builder/stages-tab.tsx` — Delete stage
- `admin/workflow-builder/rules-tab.tsx` — Delete rule
- `control-center/condition-category-section.tsx` — Deactivate condition
- `control-center/user-email-templates/TemplateListPage.tsx` — Delete template
- `control-center/users-client.tsx` — Revoke role
- `deal-team/DealTeamSection.tsx` — Remove deal team contact
- `documents/layout-editor/SectionsEditor.tsx` — Delete section
- `inline-layout-editor/SectionConfigPopover.tsx` — Delete section
- `inline-layout-editor/TabManager.tsx` — Delete tab
- `tasks/task-split-panel.tsx` — Delete task
- `tasks/task-sheet.tsx` — Delete task
- `tasks/recurring-templates-table.tsx` — Delete template
- `approvals/routing-rules-manager.tsx` — Delete routing rule

**Non-destructive (confirm action):**
- `email/email-composer-shell.tsx` — Discard email draft
- `tasks/task-split-panel.tsx` — Submit for approval
- `tasks/task-sheet.tsx` — Submit for approval
- `tasks/approval-drawer.tsx` — Reject approval
- `approvals/approval-detail-view.tsx` — Decline approval, Cancel approval request
- `control-center/users-client.tsx` — Grant super admin access

---

## Target: `useConfirm()` Hook + `<ConfirmDialog>` Component

### Hook API

```tsx
const confirm = useConfirm();

// Usage — one line to trigger a confirmation:
await confirm({
  title: "Delete contact?",
  description: "This will remove them from all linked deals. This action cannot be undone.",
  confirmLabel: "Delete",          // defaults to "Confirm"
  cancelLabel: "Cancel",           // defaults to "Cancel"
  destructive: true,               // red button styling (default false)
  loading: false,                  // external loading control (optional)
});
// Returns: true if confirmed, false if cancelled
```

### How It Works

```tsx
// Developer writes:
async function handleDelete(contactId: string) {
  const ok = await confirm({
    title: "Delete contact?",
    description: `This will remove "${contactName}" from the CRM. This action cannot be undone.`,
    confirmLabel: "Delete",
    destructive: true,
  });
  if (!ok) return;

  // ... proceed with delete
  const result = await deleteCrmContactAction(contactId);
  if (result.error) {
    toast({ title: "Error", description: result.error, variant: "destructive" });
  } else {
    toast({ title: "Contact deleted" });
  }
}
```

Compare to today's pattern which requires 30+ lines of JSX, 7 imports, and separate open/loading state management.

### Component Implementation

```tsx
// components/shared/ConfirmDialog.tsx

"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return fn;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleResponse = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={state?.open ?? false}
        onOpenChange={(open) => {
          if (!open) handleResponse(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title}</AlertDialogTitle>
            {state?.description && (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleResponse(false)}>
              {state?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResponse(true)}
              className={cn(
                state?.destructive && "bg-red-600 hover:bg-red-700 focus:ring-red-600"
              )}
            >
              {state?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
```

### Provider Placement

Add `<ConfirmProvider>` to the root layout, wrapping the main content area:

```tsx
// app/(authenticated)/layout.tsx (or wherever the authenticated layout lives)

import { ConfirmProvider } from "@/components/shared/ConfirmDialog";

export default function AuthLayout({ children }) {
  return (
    <ConfirmProvider>
      {/* existing layout */}
      {children}
    </ConfirmProvider>
  );
}
```

---

## Implementation Phases

### Phase 1: Create the Hook and Provider

1. Create `components/shared/ConfirmDialog.tsx` (context + hook + provider + dialog)
2. Add `<ConfirmProvider>` to the authenticated layout
3. Run `pnpm build` to verify

### Phase 2: Replace Dedicated Delete Dialog Components

These are standalone dialog components that exist only for confirmation. They can be deleted entirely:

| File to Delete | Replaced By |
|---------------|-------------|
| `admin/email-templates/delete-confirm-dialog.tsx` | `useConfirm()` in `TemplateListPage.tsx` |
| `admin/document-delete-dialog.tsx` | `useConfirm()` in parent component |
| `crm/delete-contact-button.tsx` | `useConfirm()` in `contacts-view.tsx` / detail pages |
| `crm/delete-company-button.tsx` | `useConfirm()` in `companies-view.tsx` / detail pages |

For each: remove the import of the old component from its parent, add `useConfirm()`, and replace the button + dialog with a button + `confirm()` call.

Run `pnpm build`.

### Phase 3: Replace Inline AlertDialogs — Destructive Actions

Convert inline AlertDialog JSX blocks to `useConfirm()` calls. For each file:
1. Remove the 7-8 AlertDialog subcomponent imports
2. Remove the open state (`useState` or controlled prop)
3. Add `const confirm = useConfirm()`
4. Replace the AlertDialog JSX block with an `await confirm({...})` call in the click handler

| File | Dialog(s) |
|------|-----------|
| `crm/contacts-view.tsx` | Delete contact |
| `crm/companies-view.tsx` | Delete company |
| `admin/borrower-entity-list.tsx` | Delete entity |
| `admin/quote-detail-client.tsx` | Delete quote, Decline quote |
| `admin/workflow-builder/stages-tab.tsx` | Delete stage |
| `admin/workflow-builder/rules-tab.tsx` | Delete rule |
| `control-center/condition-category-section.tsx` | Deactivate condition |
| `control-center/user-email-templates/TemplateListPage.tsx` | Delete template |
| `control-center/users-client.tsx` | Revoke role |
| `deal-team/DealTeamSection.tsx` | Remove team contact |
| `documents/layout-editor/SectionsEditor.tsx` | Delete section |
| `inline-layout-editor/SectionConfigPopover.tsx` | Delete section |
| `inline-layout-editor/TabManager.tsx` | Delete tab |
| `tasks/task-split-panel.tsx` | Delete task |
| `tasks/task-sheet.tsx` | Delete task |
| `tasks/recurring-templates-table.tsx` | Delete template |
| `approvals/routing-rules-manager.tsx` | Delete routing rule |

Run `pnpm build` after every 4-5 files.

### Phase 4: Replace Non-Destructive Confirmations

These use the same hook but with `destructive: false`:

| File | Dialog | Confirm Label |
|------|--------|--------------|
| `email/email-composer-shell.tsx` | Discard draft | "Discard" |
| `tasks/task-split-panel.tsx` | Submit for approval | "Submit" |
| `tasks/task-sheet.tsx` | Submit for approval | "Submit" |
| `tasks/approval-drawer.tsx` | Reject approval | "Reject" |
| `approvals/approval-detail-view.tsx` | Decline approval | "Decline" |
| `approvals/approval-detail-view.tsx` | Cancel request | "Cancel Request" |
| `control-center/users-client.tsx` | Grant super admin | "Grant Access" |

Run `pnpm build`.

### Phase 5: Update CLAUDE.md

Add to Critical Rules:

```markdown
16. **All confirmation dialogs use `useConfirm()` hook.** Import from `@/components/shared/ConfirmDialog`. Never build inline AlertDialog JSX for confirmations. Call `const ok = await confirm({ title, description, confirmLabel, destructive })` and check the boolean return. The `<ConfirmProvider>` in the authenticated layout handles rendering.
```

### Phase 6: Cleanup

1. Verify no remaining direct AlertDialog usage for confirmations (AlertDialog is still fine for non-confirmation uses like complex forms)
2. Remove unused imports across all modified files
3. Run `pnpm build` — zero errors
4. Run `pnpm lint` — no unused import warnings

---

## Before / After Example

### Before (delete-contact-button.tsx — 119 lines, 8 imports)

```tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

// ... 119 lines of component code with state management, JSX, etc.
```

### After (inline in parent — ~15 lines)

```tsx
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { Trash2 } from "lucide-react";

function ContactActions({ contactId, contactName }) {
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete contact?",
      description: `This will remove "${contactName}" from the CRM. This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    const result = await deleteCrmContactAction(contactId);
    // ... handle result
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
```

**Result:** 119 lines → 15 lines. 8 imports → 1 import. Zero boilerplate.

---

## Scope

### IN
- `useConfirm()` hook with `<ConfirmProvider>` context
- Replacement of all 30 AlertDialog confirmation patterns across 26 files
- Deletion of 4 standalone delete dialog components
- CLAUDE.md rule

### OUT
- AlertDialog usage for non-confirmation purposes (complex forms inside dialogs, multi-step wizards)
- Undo toast pattern (future enhancement; can add `onUndo` callback to confirm options later)
- Async loading state in the dialog itself (the hook returns a boolean; loading happens in the caller after confirmation. If we need in-dialog loading later, we can add an `onConfirm` async callback variant)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Some dialogs have custom content (input fields, textareas for rejection reason) | These are NOT simple confirmations. Leave them as custom AlertDialog instances. Only convert simple confirm/cancel patterns. |
| `delete-contact-button.tsx` is used as a standalone component in multiple places | Replace usage in parent components with inline `useConfirm()` + button. May need to check all import sites. |
| Provider not available in public routes | Only add to authenticated layout. Public routes don't have destructive actions. |
| Promise-based hook may confuse developers | Pattern is well-established (browser `confirm()`, Material UI `useConfirm`). Document in CLAUDE.md. |

---

## Success Criteria

1. `useConfirm()` hook exists and works from any authenticated page
2. All simple confirm/cancel dialogs use the hook (no inline AlertDialog JSX)
3. 4 standalone delete dialog component files deleted
4. Destructive actions have red confirm buttons, non-destructive have default styling
5. All confirmations have clear titles and descriptions
6. `pnpm build` passes with zero errors
7. CLAUDE.md updated with the rule
8. Net code reduction of ~500+ lines across the portal

---

## Files Reference

### New Files
| File | Role |
|------|------|
| `components/shared/ConfirmDialog.tsx` | Hook + Provider + Dialog |

### Files to Delete
| File | Replaced By |
|------|-------------|
| `components/admin/email-templates/delete-confirm-dialog.tsx` | `useConfirm()` |
| `components/admin/document-delete-dialog.tsx` | `useConfirm()` |
| `components/crm/delete-contact-button.tsx` | `useConfirm()` |
| `components/crm/delete-company-button.tsx` | `useConfirm()` |

### Files to Modify (26 files)
All files listed in Phase 3 and Phase 4 tables above.
