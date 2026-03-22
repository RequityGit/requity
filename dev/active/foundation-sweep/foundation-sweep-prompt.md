# Foundation Stack Sweep - Comprehensive Audit & Fix Prompt

## Objective

Scan the entire RequityOS portal codebase and fix every remaining violation of the foundation standards established in CLAUDE.md. This is not about building new features; it is about making every existing file conform to the patterns that are already defined and partially adopted. The goal is 100% consistency across the portal.

---

## Pre-Work: Read These First

Before making any changes, read the following files to understand the standards:

```
apps/requity-os/lib/format.ts          # Canonical formatters
apps/requity-os/lib/toast.ts           # Toast wrapper
apps/requity-os/components/shared/ConfirmDialog.tsx    # useConfirm hook
apps/requity-os/components/shared/EmptyState.tsx       # Empty state component
apps/requity-os/components/shared/ErrorFallback.tsx    # Error boundary UI
apps/requity-os/components/shared/SectionErrorBoundary.tsx  # Client error boundary
apps/requity-os/components/shared/skeletons/index.ts   # Shared skeletons
apps/requity-os/app/globals/globals.css                # Motion tokens, utility classes
CLAUDE.md                                              # All rules
```

---

## Sweep 1: Format Library Violations (4 files with local formatters, 10 files with inline date formatting)

### 1A. Remove Local Format Functions

These files define their own `formatCurrencyDisplay` or `formatDateDisplay` instead of importing from `lib/format.ts`. Delete the local functions and replace all call sites with the canonical import.

| File | Local Function | Replace With |
|------|---------------|-------------|
| `components/pipeline/UwField.tsx` | `formatCurrencyDisplay`, `formatDateDisplay` | `formatCurrency`, `formatDate` from `@/lib/format` |
| `components/ui/inline-field.tsx` | `formatCurrencyDisplay` | `formatCurrency` from `@/lib/format` |
| `components/crm/shared-field-renderer.tsx` | `formatCurrencyDisplay`, `formatDateDisplay` | `formatCurrency`, `formatDate` from `@/lib/format` |
| `components/pipeline/IntakeReviewModal.tsx` | `formatCurrencyDisplay` or `formatDateDisplay` | `formatCurrency`, `formatDate` from `@/lib/format` |

**Pattern:**
```typescript
// BEFORE (delete this)
function formatCurrencyDisplay(val: number) { ... }

// AFTER (add this import)
import { formatCurrency } from "@/lib/format";
```

**Check:** After removing each local function, run `pnpm typecheck` to catch any call-site signature mismatches. The canonical `formatCurrency` accepts `number | null | undefined` and returns a string (or "---" for nulls). If the local function had different behavior (e.g. returning empty string for null), verify the replacement handles it.

### 1B. Replace Inline toLocaleDateString / toLocaleTimeString

These 10 files call `.toLocaleDateString()` or `.toLocaleTimeString()` directly instead of using `formatDate`, `formatDateTime`, or `formatTime` from `lib/format.ts`. (Exclude `lib/format.ts` itself and server-side email/notification files where the browser locale context does not apply.)

| File | Action |
|------|--------|
| `components/pipeline/DealMessagesPanel.tsx` | Replace with `formatDateTime` or `formatTime` |
| `components/admin/commercial-uw/commercial-uw-client.tsx` | Replace with `formatDate` or `formatDateTime` |
| `components/tasks/template-sheet.tsx` | Replace with `formatDate` |
| `components/admin/commercial-uw/historicals-tab.tsx` | Replace with `formatDate` |
| `app/(public)/upload/[token]/SecureUploadClient.tsx` | Replace with `formatDate` |
| `app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx` | Replace with `formatDate` |
| `components/documents/actions.ts` | Replace with `formatDate` (if client-side) |
| `app/(authenticated)/(admin)/loans/[id]/commercial-uw/t12-actions.ts` | Replace with `formatDate` (if client-side) |
| `lib/notifications.ts` | **Evaluate**: if server-side email generation, may keep; if client-facing, replace |
| `lib/comment-utils.ts` | Replace with `formatDateTime` or `timeAgo` |
| `lib/emails/condition-notifications.ts` | **Evaluate**: server-side email template, may keep `toLocaleDateString` for explicit locale control |

**Decision rule for server-side files:** If the file generates emails or push notifications (runs on server, not in browser), it is acceptable to keep `toLocaleDateString` with explicit locale like `"en-US"` since `lib/format.ts` is designed for client-side display. But if the file runs client-side, always use `lib/format.ts`.

---

## Sweep 2: Null Display Standardization ("--" to "---")

The portal standard for null/empty values is the em dash "---" (U+2014), not double hyphen "--". These files still use "--":

| File | Approximate Lines |
|------|-------------------|
| `components/pipeline/PipelineTable.tsx` | Line ~101 |
| `components/pipeline/FieldMergeRow.tsx` | Lines ~23, ~105, ~146 |
| `components/pipeline/IntakeCard.tsx` | Line ~19 |
| `components/pipeline/GridProForma.tsx` | Line ~29 |
| `components/pipeline/uw/ProFormaSection.tsx` | Lines ~801, ~805 |
| `components/pipeline/DealCard.tsx` | Lines ~101, ~197 |
| `components/pipeline/tabs/DiligenceTab.tsx` | Line ~171 |
| `components/admin/pipeline/loan-detail-drawer.tsx` | Lines ~45, ~70, ~145, ~153 |
| `components/admin/pipeline/lending-pipeline-table.tsx` | Lines ~90, ~444 |

**Fix:** Find-and-replace `"--"` with `"\u2014"` in display contexts. Be careful NOT to replace `"--"` in contexts where it means something else (e.g., CLI flags, comment separators, markdown). Only replace when it is used as a null/empty placeholder for display.

**Preferred approach:** Where possible, replace the raw `"--"` with a call to a format function that already returns "---" for null. For example, `value ?? "--"` becomes `formatCurrency(value)` or `formatDate(value)` if the value is a known type. For generic text values, use `value ?? "\u2014"` or `value || "\u2014"`.

---

## Sweep 3: AlertDialog to useConfirm() Migration (3 remaining files)

These files still use inline `<AlertDialog>` for simple confirmations instead of `useConfirm()`:

| File | Current Pattern | Action |
|------|----------------|--------|
| `components/admin/quote-detail-client.tsx` | Inline AlertDialog for delete | Migrate to `useConfirm()` |
| `components/admin/borrower-entity-list.tsx` | Inline AlertDialog for delete | Migrate to `useConfirm()` |
| `components/approvals/routing-rules-manager.tsx` | Inline AlertDialog | Migrate to `useConfirm()` |

**Excluded (correct usage):**
- `components/shared/ConfirmDialog.tsx` -- this IS the implementation
- `components/ui/alert-dialog.tsx` -- this is the shadcn primitive

**Migration pattern:**
```typescript
// BEFORE: Inline AlertDialog JSX (delete all of this)
const [showDelete, setShowDelete] = useState(false);
// ... 20+ lines of AlertDialog JSX ...

// AFTER: useConfirm hook (replace with this)
import { useConfirm } from "@/components/shared/ConfirmDialog";

const confirm = useConfirm();

async function handleDelete() {
  const ok = await confirm({
    title: "Delete [thing]?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    destructive: true,
  });
  if (!ok) return;
  // ... actual delete logic ...
}
```

---

## Sweep 4: Route-Level loading.tsx Files (0 exist, ~20 needed)

**Zero `loading.tsx` files exist anywhere in the app.** Every route with server-side data fetching needs one. These use the shared skeleton components from `@/components/shared/skeletons`.

### Priority 1: High-Traffic Admin Routes

| Route | Skeleton to Use |
|-------|----------------|
| `(authenticated)/(admin)/pipeline/loading.tsx` | `<KanbanSkeleton />` |
| `(authenticated)/(admin)/pipeline/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/contacts/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/contacts/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/companies/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/crm/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/loans/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/loans/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/servicing/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/servicing/[loanId]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/originations/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/documents/loading.tsx` | `<TableSkeleton />` |

### Priority 2: Secondary Admin Routes

| Route | Skeleton to Use |
|-------|----------------|
| `(authenticated)/(admin)/investors/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/investors/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/borrowers/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/borrowers/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/funds/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/funds/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/(admin)/distributions/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/operations/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/tasks/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/conditions/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/(admin)/users/loading.tsx` | `<TableSkeleton />` |

### Priority 3: Borrower & Investor Portal Routes

| Route | Skeleton to Use |
|-------|----------------|
| `(authenticated)/b/loading.tsx` | `<CardGridSkeleton />` |
| `(authenticated)/b/loans/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/b/documents/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/b/payments/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/b/draws/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/i/loading.tsx` | `<CardGridSkeleton />` |
| `(authenticated)/i/funds/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `(authenticated)/i/distributions/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/i/capital-calls/loading.tsx` | `<TableSkeleton />` |

### Priority 4: Control Center Routes

| Route | Skeleton to Use |
|-------|----------------|
| `(authenticated)/control-center/loading.tsx` | `<CardGridSkeleton />` |
| `(authenticated)/control-center/conditions/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/control-center/email-templates/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/control-center/document-templates/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/control-center/users/loading.tsx` | `<TableSkeleton />` |
| `(authenticated)/control-center/underwriting/loading.tsx` | `<TableSkeleton />` |

**Template for loading.tsx:**
```typescript
import { TableSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return <TableSkeleton />;
}
```

Replace `TableSkeleton` with the appropriate skeleton from the table above.

---

## Sweep 5: Route-Level not-found.tsx Files (0 exist, ~8 needed)

Only dynamic `[id]` routes need `not-found.tsx`. These handle cases where a deal, contact, loan, etc. does not exist.

| Route | Context Title |
|-------|---------------|
| `(authenticated)/(admin)/pipeline/[id]/not-found.tsx` | "Deal not found" |
| `(authenticated)/(admin)/contacts/[id]/not-found.tsx` | "Contact not found" |
| `(authenticated)/(admin)/companies/[id]/not-found.tsx` | "Company not found" |
| `(authenticated)/(admin)/loans/[id]/not-found.tsx` | "Loan not found" |
| `(authenticated)/(admin)/servicing/[loanId]/not-found.tsx` | "Loan not found" |
| `(authenticated)/(admin)/investors/[id]/not-found.tsx` | "Investor not found" |
| `(authenticated)/(admin)/funds/[id]/not-found.tsx` | "Fund not found" |
| `(authenticated)/b/loans/[id]/not-found.tsx` | "Loan not found" |
| `(authenticated)/i/funds/[id]/not-found.tsx` | "Fund not found" |

**Template for not-found.tsx:**
```typescript
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Deal not found"
      description="This deal may have been deleted or you may not have access."
      backHref="/pipeline"
      backLabel="Back to Pipeline"
    />
  );
}
```

Adjust title, description, backHref, and backLabel for each route context.

---

## Sweep 6: SectionErrorBoundary Coverage

Currently `<SectionErrorBoundary>` is only used in 2 files:
- `components/crm/contact-360/contact-detail-client.tsx`
- `components/borrower/loan-detail-tabs.tsx`

Every detail page with multiple tabs or card sections should wrap each tab panel in `<SectionErrorBoundary>` so a crash in one tab does not take down the whole page.

### Files to add SectionErrorBoundary:

| File | Wrap What |
|------|-----------|
| Pipeline deal `[id]` page tabs | Each tab content panel (Overview, Property, Borrower, UW, Docs, etc.) |
| Company 360 tabs | Each tab in company detail |
| Investor detail tabs | Each tab panel |
| Fund detail tabs | Each tab panel |
| Servicing `[loanId]` tabs | Each tab panel |
| Loan `[id]` tabs | Each tab panel |

**Pattern:**
```tsx
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";

// Wrap each lazy tab panel:
<SectionErrorBoundary context="Overview">
  <OverviewTab deal={deal} />
</SectionErrorBoundary>
```

---

## Sweep 7: Remaining Ad-Hoc Empty States

EmptyState component is imported in 91 files, which is excellent. But there are still ~97 files with raw "No X found" / "No X yet" text patterns. Many of these may already use EmptyState (the grep hits the description prop). **Audit required:** Open each file in the grep results and check if the "No X found" text is inside an `<EmptyState>` component or is raw inline text. Only fix files where it is raw inline text.

**Quick heuristic:** If a file imports from `@/components/shared/EmptyState` AND contains "No X found", it is likely already using EmptyState (the text is the `title` or `description` prop). Skip those. Focus on files that do NOT import EmptyState but contain ad-hoc empty state text.

**Pattern to fix:**
```tsx
// BEFORE (ad-hoc)
<div className="text-center text-muted-foreground py-8">
  No documents found
</div>

// AFTER (standardized)
import { EmptyState } from "@/components/shared/EmptyState";

<EmptyState
  title="No documents yet"
  description="Upload or generate documents to see them here."
  compact
/>
```

---

## Execution Order

Run these sweeps in this order, building after each:

1. **Sweep 1** (Format library) -- smallest scope, highest signal; removes code duplication
2. **Sweep 2** (Null display) -- quick find-and-replace, high visual impact
3. **Sweep 3** (AlertDialog) -- only 3 files, fast
4. **Sweep 4** (loading.tsx) -- bulk file creation, uses existing skeletons
5. **Sweep 5** (not-found.tsx) -- bulk file creation, uses existing ErrorFallback
6. **Sweep 6** (SectionErrorBoundary) -- moderate effort, high resilience value
7. **Sweep 7** (Empty states audit) -- largest scope, requires per-file judgment

After each sweep, run `pnpm build` to verify no type errors were introduced.

---

## Verification Checklist

After completing all sweeps, run these checks to confirm 100% compliance:

```bash
# No local format functions remain
grep -r "formatCurrencyDisplay\|formatDateDisplay" apps/requity-os/components/ --include="*.tsx" --include="*.ts"
# Expected: 0 results

# No inline date formatting (client-side)
grep -r "toLocaleDateString\|toLocaleTimeString" apps/requity-os/components/ --include="*.tsx"
# Expected: 0 results

# No double-hyphen null placeholders in components
grep -rn '"--"' apps/requity-os/components/ --include="*.tsx" | grep -v "CLI\|flag\|comment\|separator"
# Expected: 0 results (or only non-display contexts)

# No inline AlertDialog except ConfirmDialog.tsx and alert-dialog.tsx
grep -rl "AlertDialog" apps/requity-os/components/ --include="*.tsx" | grep -v "ConfirmDialog\|alert-dialog\|ui/"
# Expected: 0 results

# Every admin route has loading.tsx
find apps/requity-os/app/\(authenticated\) -name "page.tsx" -exec dirname {} \; | while read d; do [ ! -f "$d/loading.tsx" ] && echo "MISSING: $d/loading.tsx"; done
# Expected: minimal missing (public/static routes are OK to skip)

# Every [id] route has not-found.tsx
find apps/requity-os/app/\(authenticated\) -path "*/\[*\]*" -name "page.tsx" -exec dirname {} \; | while read d; do [ ! -f "$d/not-found.tsx" ] && echo "MISSING: $d/not-found.tsx"; done
# Expected: 0 results for core entity routes

# No direct sonner imports (only lib/toast.ts and sonner.tsx allowed)
grep -rl 'from "sonner"\|from '\''sonner'\''' apps/requity-os/ --include="*.tsx" --include="*.ts" | grep -v "lib/toast.ts\|ui/sonner.tsx"
# Expected: 0 results

# No useToast imports (only shadcn definition files allowed)
grep -rl "useToast" apps/requity-os/ --include="*.tsx" --include="*.ts" | grep -v "ui/use-toast.ts\|ui/toaster.tsx"
# Expected: 0 results
```

---

## Success Criteria

- Zero local format functions anywhere in components
- Zero inline `toLocaleDateString` calls in client components
- Zero `"--"` null placeholders in display contexts (all replaced with em dash or format function)
- Zero inline AlertDialog confirmations outside of `ConfirmDialog.tsx` and `alert-dialog.tsx`
- Every route with server data fetching has a `loading.tsx`
- Every `[id]` route has a `not-found.tsx`
- SectionErrorBoundary wraps tab panels on all detail pages
- `pnpm build` passes clean
