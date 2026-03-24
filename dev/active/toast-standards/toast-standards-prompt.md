# Toast Standards — Implementation Prompt

## Objective

Consolidate the portal onto a single toast library (sonner) with a thin wrapper in `lib/toast.ts` that enforces consistent messaging patterns. Right now, two different toast systems are in use with inconsistent titles, descriptions, and error messaging across 60+ files. This prompt unifies them.

---

## Current State: Two Toast Systems, Zero Standards

### Two Libraries

**Library 1: shadcn `useToast()` hook** — ~25 files
```tsx
import { useToast } from "@/components/ui/use-toast";
const { toast } = useToast();
toast({ title: "Contact deleted" });
toast({ title: "Error", description: result.error, variant: "destructive" });
```
- Requires a hook call (only works in components)
- Uses `{ title, description, variant }` object syntax
- `variant: "destructive"` for errors

**Library 2: sonner `toast` function** — ~55 files
```tsx
import { toast } from "sonner";
toast.success("Document saved");
toast.error("Failed to generate PDF");
toast.loading("Preparing email...");
```
- Direct function call (works anywhere, including lib files)
- Uses `.success()`, `.error()`, `.loading()` method syntax
- Supports toast IDs for loading → success/error transitions

### The Inconsistencies

**Error titles are all over the place:**
```
toast({ title: "Error", description: "..." })                    ← Generic "Error"
toast({ title: "Error deleting contact", description: "..." })   ← Specific action
toast({ title: "Error saving", description: "..." })             ← Partial specificity
toast({ title: "Not authenticated", variant: "destructive" })    ← Technical jargon
toast({ title: "Failed to complete task: " + error })            ← Error in title
toast.error("Session expired. Please sign in again.")            ← User-friendly
toast.error("Could not load document content")                   ← User-friendly
toast({ title: "Name required", variant: "destructive" })        ← Validation as error
```

**Success messages vary:**
```
toast({ title: "Contact deleted" })          ← Past tense, no description
toast({ title: "Saved" })                    ← Ultra-brief
toast({ title: "Template saved" })           ← Object + action
toast({ title: "Role granted successfully" }) ← "successfully" is redundant
toast.success("Document saved")              ← Clean
toast.success("Contact created and added as borrower")  ← Too much detail
```

**Loading → result transitions only exist in sonner files:**
```tsx
const toastId = toast.loading("Generating PDF...");
// ... async work ...
toast.success("PDF downloaded", { id: toastId });
toast.error("Failed to generate PDF", { id: toastId });
```
Files using `useToast()` have no equivalent pattern. Users see no feedback during long operations.

---

## Decision: Sonner Wins

**Sonner is the canonical toast library.** Reasons:

1. **Already dominant** — 55 files vs 25 files
2. **Works outside components** — Can be called from lib functions, server action handlers, utility files. `useToast()` requires React component context.
3. **Loading toast pattern** — `toast.loading()` → `toast.success(msg, { id })` is elegant and impossible with shadcn's hook-based system.
4. **Simpler API** — `toast.success("Saved")` vs `toast({ title: "Saved" })`.
5. **Already styled for our theme** — `components/ui/sonner.tsx` applies our design tokens.

### What Happens to `useToast()`

- Keep the shadcn `useToast` files (`use-toast.ts`, `toast.tsx`, `toaster.tsx`) in the codebase for now (some shadcn components may reference them internally)
- Stop using `useToast()` in application code
- All new toast calls use sonner via `lib/toast.ts`
- Existing `useToast()` call sites get migrated to sonner

---

## The Wrapper: `lib/toast.ts`

A thin wrapper around sonner that enforces messaging patterns:

```typescript
// lib/toast.ts

import { toast as sonnerToast } from "sonner";

/**
 * Standardized toast notifications.
 *
 * Usage:
 *   showSuccess("Contact deleted")
 *   showError("Could not delete contact", error)
 *   showLoading("Generating PDF...")  → returns ID for showSuccess/showError
 *   showWarning("This action is irreversible")
 *   showInfo("Email draft saved")
 */

/** Success — action completed */
export function showSuccess(message: string) {
  sonnerToast.success(message);
}

/** Error — action failed. Accepts string or Error object. */
export function showError(message: string, error?: unknown) {
  const description = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : undefined;
  sonnerToast.error(message, { description });
}

/** Warning — action succeeded with caveats */
export function showWarning(message: string, description?: string) {
  sonnerToast.warning(message, { description });
}

/** Info — neutral notification */
export function showInfo(message: string, description?: string) {
  sonnerToast(message, { description });
}

/** Loading — starts a persistent toast, returns ID for updating */
export function showLoading(message: string): string | number {
  return sonnerToast.loading(message);
}

/** Resolve a loading toast to success */
export function resolveLoading(id: string | number, message: string) {
  sonnerToast.success(message, { id });
}

/** Resolve a loading toast to error */
export function rejectLoading(id: string | number, message: string, error?: unknown) {
  const description = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : undefined;
  sonnerToast.error(message, { id, description });
}

/** Dismiss a specific toast or all toasts */
export function dismissToast(id?: string | number) {
  sonnerToast.dismiss(id);
}
```

### Why a Wrapper Instead of Direct Sonner Calls?

1. **One import path** — `import { showSuccess, showError } from "@/lib/toast"` everywhere. If we ever swap toast libraries again, one file changes.
2. **Enforced error handling** — `showError` automatically extracts `.message` from Error objects. No more `toast.error(err.message)` vs `toast.error(String(err))` inconsistency.
3. **Naming convention** — `showSuccess`/`showError` reads clearly at call sites. `toast.success` could be either library.
4. **Searchable** — `showError` is globally unique and grepable. `toast.error` matches both sonner and potential future libraries.

---

## Messaging Standards

### Success Messages
```
Pattern: "[Object] [past-tense verb]"
Examples:
  "Contact deleted"
  "Document saved"
  "Template activated"
  "Role granted"
  "Email sent"

Never:
  "Contact deleted successfully"     ← "successfully" is redundant (it's a success toast)
  "Template saved!"                  ← No exclamation marks
  "Success"                          ← Too generic
  "Done"                             ← Too generic
```

### Error Messages
```
Pattern: "Could not [verb] [object]"
Examples:
  "Could not delete contact"
  "Could not save document"
  "Could not send email"
  "Could not load data"

Never:
  "Error"                            ← Too generic
  "Error deleting contact"           ← Use "Could not" instead of "Error [verb]ing"
  "Failed to complete task: ..."     ← Don't put error details in the title
  "An unexpected error occurred"     ← Too vague, not actionable

Error details go in the description (second parameter), not the title:
  showError("Could not delete contact", result.error)
  → Title: "Could not delete contact"
  → Description: "Contact has linked deals that must be removed first"
```

### Loading Messages
```
Pattern: "[Verb]ing [object]..."
Examples:
  "Generating PDF..."
  "Sending email..."
  "Uploading document..."
  "Saving changes..."
```

### Validation Messages
```
Don't use toasts for validation. Use inline field errors.
If a toast is truly needed:
  showWarning("Name is required")

Not: showError("Name required")  ← Validation isn't an "error" in the system sense
```

---

## Implementation Phases

### Phase 1: Create `lib/toast.ts`

1. Create `lib/toast.ts` with the wrapper functions
2. Run `pnpm build` to verify

### Phase 2: Migrate `useToast()` Call Sites (~25 files)

For each file that imports `useToast`:
1. Remove `import { useToast } from "@/components/ui/use-toast"`
2. Remove `const { toast } = useToast()`
3. Add `import { showSuccess, showError, showWarning } from "@/lib/toast"`
4. Replace each toast call:

**Mapping:**
```
toast({ title: "Contact deleted" })
  → showSuccess("Contact deleted")

toast({ title: "Error", description: result.error, variant: "destructive" })
  → showError("Could not complete action", result.error)

toast({ title: "Error deleting contact", description: result.error, variant: "destructive" })
  → showError("Could not delete contact", result.error)

toast({ title: "Error saving", description: result.error, variant: "destructive" })
  → showError("Could not save changes", result.error)

toast({ title: "Name required", variant: "destructive" })
  → showWarning("Name is required")

toast({ title: "Role granted successfully" })
  → showSuccess("Role granted")
```

**Files to migrate (useToast → sonner wrapper):**

| File | Toast Calls |
|------|------------|
| `notifications/notification-preferences-client.tsx` | 2 |
| `approvals/submit-for-approval-dialog.tsx` | 2 |
| `approvals/approval-detail-view.tsx` | 8 |
| `approvals/routing-rules-manager.tsx` | 4 |
| `control-center/add-user-dialog.tsx` | 2 |
| `control-center/user-email-templates/TemplateEditor.tsx` | 8 |
| `control-center/user-email-templates/TemplateListPage.tsx` | 4 |
| `control-center/underwriting-assumptions-client.tsx` | 6 |
| `control-center/users-client.tsx` | 8 |
| `control-center/conditions-client.tsx` | ~4 |
| `shared/UnifiedNotes/index.tsx` | 8 |
| `shared/profile-photo-upload.tsx` | 6 |
| `shared/gmail-integration.tsx` | 10 |
| `admin/user-management-client.tsx` | ~4 |
| `admin/underwriting/uw-editor-client.tsx` | ~4 |
| `admin/contribution-form.tsx` | ~4 |
| `admin/conditions-dashboard.tsx` | ~4 |
| `admin/distribution-form.tsx` | ~4 |
| `operations/OperationsView.tsx` | ~4 |
| `operations/AddTaskDialog.tsx` | ~2 |
| `operations/AddProjectDialog.tsx` | ~2 |
| `app/(authenticated)/(admin)/account/page.tsx` | ~4 |
| `crm/contacts-view.tsx` | ~4 |
| `crm/companies-view.tsx` | ~4 |
| `crm/company-360/tabs/overview-tab.tsx` | ~6 |
| `crm/contact-360/contact-detail-sidebar.tsx` | ~4 |
| `crm/contact-360/contact-header.tsx` | ~2 |
| `crm/contact-360/tabs/detail-borrower-tab.tsx` | ~4 |
| `crm/contact-360/tabs/detail-tasks-tab.tsx` | ~4 |
| `crm/company-360/tabs/files-tab.tsx` | ~6 |
| `crm/company-360/tabs/tasks-tab.tsx` | ~4 |
| `crm/contact-file-list.tsx` | ~2 |
| `crm/contact-file-upload.tsx` | ~2 |
| `crm/company-file-list.tsx` | ~2 |
| `crm/email-compose-sheet.tsx` | ~2 |

Run `pnpm build` after every 5-6 files.

### Phase 3: Migrate Direct Sonner Call Sites (~55 files)

These already use sonner but bypass the wrapper. For each:
1. Replace `import { toast } from "sonner"` with `import { showSuccess, showError, showLoading, resolveLoading, rejectLoading } from "@/lib/toast"`
2. Replace calls:

```
toast.success("Document saved")     → showSuccess("Document saved")
toast.error("Could not load data")  → showError("Could not load data")
toast.loading("Generating PDF...")   → const id = showLoading("Generating PDF...")
toast.success("Done", { id })       → resolveLoading(id, "PDF downloaded")
toast.error("Failed", { id })       → rejectLoading(id, "Could not generate PDF")
```

3. Also fix message wording to match the standards (e.g., "Failed to generate PDF" → "Could not generate PDF")

**Files to migrate (grouped by module):**

**Pipeline (~20 files):**
- `pipeline/EditableOverview.tsx`
- `pipeline/SecureUploadLinkDialog.tsx`
- `pipeline/DocumentReviewPanel.tsx`
- `pipeline/UnderwritingPanel.tsx`
- `pipeline/NewDealDialog.tsx`
- `pipeline/DealOverviewSummary.tsx`
- `pipeline/tabs/sources-uses/SourcesUsesSubTab.tsx`
- `pipeline/tabs/DocumentsTab.tsx`
- `pipeline/tabs/ConditionsTab.tsx`
- `pipeline/tabs/DiligenceTab.tsx`
- `pipeline/tabs/UnderwritingTab.tsx`
- `pipeline/tabs/ContactsTab.tsx`
- `pipeline/tabs/PropertyTab.tsx`
- `pipeline/tabs/FormsTab.tsx`
- `pipeline/tabs/FinancialsTab.tsx`
- `pipeline/tabs/financials/AncillaryIncomeSection.tsx`
- `pipeline/tabs/financials/T12SubTab.tsx`
- `pipeline/tabs/financials/UnitMixSection.tsx`
- `pipeline/tabs/financials/OccupancyIncomeSection.tsx`
- `pipeline/tabs/financials/ScopeOfWorkSubTab.tsx`
- `pipeline/tabs/financials/RentRollSubTab.tsx`
- `pipeline/tabs/financials/ClosingCostsSubTab.tsx`
- `pipeline/tabs/financials/AssumptionsSubTab.tsx`

**Borrower (~6 files):**
- `borrower/BorrowerContactsTab.tsx`
- `borrower/CreateContactDialog.tsx`
- `borrower/BorrowingEntityCard.tsx`
- `borrower/AddBorrowerDialog.tsx`
- `borrower/BorrowerMemberRow.tsx`
- `borrower/BorrowerMemberTable.tsx`

**Documents (~7 files):**
- `documents/editor/DocumentEditor.tsx`
- `documents/SendDocumentEmailDialog.tsx`
- `documents/CreateDocumentDialog.tsx`
- `documents/GeneratedDocumentsTable.tsx`
- `documents/GenerateDocumentDialog.tsx`
- `documents/layout-editor/LayoutEditor.tsx`
- `admin/document-rename-dialog.tsx`

**Inline Layout Editor (~5 files):**
- `inline-layout-editor/SectionConfigPopover.tsx`
- `inline-layout-editor/FieldConfigPopover.tsx`
- `inline-layout-editor/TabManager.tsx`
- `inline-layout-editor/CreateFieldDialog.tsx`
- `inline-layout-editor/InlineLayoutToolbar.tsx`
- `inline-layout-editor/InlineRelationshipDialog.tsx`

**CRM (~2 files):**
- `crm/crm-v2-page.tsx`
- `pipeline/PipelineKanban.tsx` (uses useToast, check)

**Admin (~4 files):**
- `admin/document-list-table.tsx`
- `admin/document-preview-dialog.tsx`
- `deal-team/DealTeamSection.tsx`
- `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx`

**Control Center (~4 files):**
- `app/(authenticated)/control-center/document-templates/editor/[id]/template-editor-client.tsx`
- `app/(authenticated)/control-center/document-templates/document-templates-view.tsx`
- `app/(authenticated)/control-center/document-templates/template-sheet.tsx`
- `app/(authenticated)/control-center/forms/[id]/page.tsx`

**Other:**
- `forms/FormEngine.tsx`
- `lib/export-pdf.ts`

Run `pnpm build` after each module group.

### Phase 4: Update CLAUDE.md

Add to Critical Rules:

```markdown
17. **All toast notifications use `lib/toast.ts` helpers.** Never import `useToast` from shadcn or `toast` from sonner directly. Import `showSuccess`, `showError`, `showWarning`, `showInfo`, `showLoading`, `resolveLoading`, `rejectLoading` from `@/lib/toast`. Success messages use past tense ("[Object] [verb]ed"). Error messages use "Could not [verb] [object]". Loading messages use "[Verb]ing [object]...". Never put error details in the message; pass them as the second argument to `showError`. Never use "successfully" in success messages (it's redundant). Never use generic "Error" as a toast title.
```

### Phase 5: Final Verification

1. Run `pnpm build` — zero errors
2. Run `pnpm lint` — no unused imports
3. Grep for remaining direct usage:
   - `grep "useToast" --include="*.tsx" --include="*.ts"` — should only appear in `use-toast.ts` and `toast.tsx` definitions
   - `grep 'from "sonner"' --include="*.tsx" --include="*.ts"` — should only appear in `lib/toast.ts` and `components/ui/sonner.tsx`
4. Grep for banned patterns:
   - `grep 'title: "Error"' --include="*.tsx"` — zero results
   - `grep 'successfully' --include="*.tsx"` — check context, remove from toasts

---

## Scope

### IN
- New `lib/toast.ts` wrapper
- Migration of all ~25 `useToast()` files to sonner wrapper
- Migration of all ~55 direct sonner files to wrapper
- Message wording standardization
- CLAUDE.md rule

### OUT
- Deleting `use-toast.ts` / `toast.tsx` / `toaster.tsx` (keep for shadcn internal use)
- Custom toast styling changes (sonner.tsx theming is already correct)
- Toast position or duration changes (current defaults are fine)
- Undo-toast pattern (future enhancement; can add `showSuccessWithUndo` later)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `useToast()` is used in shadcn UI primitives internally | We only remove it from application code. The shadcn component files stay untouched. |
| Some `useToast` call sites are in the same component as other hooks | Just swap the toast calls; the hook removal is straightforward. |
| Loading toast IDs need to be passed between functions | `showLoading` returns the ID. Same pattern as direct sonner, just renamed. |
| Wrapper adds one layer of indirection | It's 40 lines of code. The indirection buys us library independence and enforced error extraction. Worth it. |
| Message rewording might change meaning | Keep rewording conservative. "Error deleting contact" → "Could not delete contact" preserves meaning. |

---

## Success Criteria

1. Zero `useToast()` imports in application code (only in shadcn UI definitions)
2. Zero `import { toast } from "sonner"` in application code (only in `lib/toast.ts` and `components/ui/sonner.tsx`)
3. All error toasts use "Could not [verb] [object]" pattern
4. All success toasts use "[Object] [past-tense verb]" pattern (no "successfully")
5. All long-running operations show loading → result toast transitions
6. `pnpm build` passes with zero errors
7. CLAUDE.md updated with the rule
8. `lib/toast.ts` is the single import path for all toast calls

---

## Files Reference

### New Files
| File | Role |
|------|------|
| `lib/toast.ts` | Toast wrapper (single import point) |

### Files to Modify
~80 files total across Phase 2 and Phase 3 (see tables above for full list)
