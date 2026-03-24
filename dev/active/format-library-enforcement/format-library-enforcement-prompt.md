# Format Library Enforcement — Implementation Prompt

## Objective

Eliminate all inline/duplicate formatting across the RequityOS portal. Every date, currency, percent, phone, and null-value display must flow through `lib/format.ts`. This makes the portal visually consistent (one null representation, one date style, one currency style) and prevents future drift.

---

## The Problem

`lib/format.ts` exists and is well-tested. But 40+ components ignore it and roll their own formatting inline. The result:

- **11 duplicate `formatDate` functions** scattered across individual component files
- **4 duplicate `formatCurrency`/`formatCurrencyDisplay` functions** with different behaviors
- **2 duplicate `formatPercent` functions** with different null returns
- **40+ raw `.toLocaleDateString()` calls** with inconsistent option objects
- **Null values render as either `"—"` (em dash) or `"--"` (double hyphen)** depending on which formatter was used

---

## The Canonical Source: `lib/format.ts`

This file is the single source of truth. All formatting must import from here.

```
File: apps/requity-os/lib/format.ts

Exports:
  formatCurrency(amount)          → "$1,234,567" or "—" for null
  formatCurrencyDetailed(amount)  → "$1,234.50" (2 decimal places)
  formatCompactCurrency(amount)   → "$2.5M" / "$750k" / "TBD" for null/0
  formatDate(date)                → "Jan 15, 2024" or "—" for null
  formatPercent(value)            → "8.50%" or "—" for null
  formatPhoneNumber(phone)        → "(555) 123-4567" or "—" for null
  formatPhoneInput(value)         → live formatting for phone input fields
  smartDate(date)                 → { text: "3d ago", title: "Jan 15, 2024" }
  timeAgo(dateStr)                → "3d ago" / "Yesterday" / "Just now"
  formatFieldValue(value, type)   → type-aware formatting for dynamic fields
  isFieldEmpty(value)             → boolean null/empty check
  isFinancialFieldType(type)      → boolean check for numeric field types
  getMonthLabel(date)             → "Jan"
```

### Null Value Standard
All formatters return `"—"` (em dash, Unicode U+2014) for null/undefined/empty values. This is the portal-wide standard. No component should ever return `"--"` (double hyphen) or `""` (empty string) for missing data.

**Exception:** `formatCompactCurrency` returns `"TBD"` for null/zero because compact currency is used in summary contexts where "TBD" is more meaningful than a dash.

---

## What Needs to Change

### Phase 1: Kill Duplicate Function Definitions

These files define their own local `formatDate` that does the exact same thing as `lib/format.ts`. Delete the local function and replace with an import.

| File | Local Function | Action |
|------|---------------|--------|
| `components/sops/SOPCard.tsx:12` | `function formatDate(dateStr: string)` | Delete, import from `@/lib/format` |
| `components/sops/SOPVersionHistory.tsx:11` | `function formatDate(dateStr: string)` | Delete, import from `@/lib/format` |
| `components/pipeline/tabs/ConditionsTab.tsx:108` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `components/pipeline/tabs/DocumentsTab.tsx:64` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `components/pipeline/tabs/DiligenceTab.tsx:178` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `components/admin/underwriting/uw-editor-client.tsx:507` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `components/admin/commercial-uw/rent-roll-version-history.tsx:23` | `function formatDate(dateStr: string)` | Delete, import from `@/lib/format` |
| `app/(authenticated)/(admin)/models/[type]/page.tsx:290` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `app/(authenticated)/(admin)/models/[type]/scenarios/page.tsx:260` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `app/(authenticated)/(admin)/models/[type]/scenarios/[scenarioId]/scenario-header.tsx:315` | `function formatDate(d: string \| null \| undefined)` | Delete, import from `@/lib/format` |
| `app/(authenticated)/sops/[slug]/sop-detail-client.tsx:32` | `function formatDate(dateStr: string)` | Delete, import from `@/lib/format` |
| `app/(authenticated)/sops/admin/sop-admin-client.tsx:50` | `function formatDate(dateStr: string)` | Delete, import from `@/lib/format` |

These files define duplicate currency/percent formatters:

| File | Local Function | Action |
|------|---------------|--------|
| `components/pipeline/pipeline-types.ts:197` | `formatCurrency(value, compact?)` | See Phase 2 below |
| `components/pipeline/pipeline-types.ts:211` | `formatPercent(value)` | See Phase 2 below |
| `components/pipeline/UwField.tsx:30` | `formatCurrencyDisplay(val: unknown)` | Delete, import `formatCurrency` from `@/lib/format` |
| `components/crm/shared-field-renderer.tsx:319` | `formatCurrencyDisplay(val: unknown)` | Delete, import `formatCurrency` from `@/lib/format` |
| `app/(public)/apply/page.tsx:232` | `formatCurrency(value: string)` | Delete, import from `@/lib/format` |

### Phase 2: Consolidate pipeline-types.ts Formatters

`pipeline-types.ts` exports its own `formatCurrency` and `formatPercent` that return `"--"` (double hyphen) instead of `"—"` (em dash). Multiple pipeline components import from here.

**Step 1:** Update `pipeline-types.ts` to re-export from `lib/format.ts` instead of defining its own:

```typescript
// pipeline-types.ts — REPLACE the local formatCurrency and formatPercent with:
export { formatCurrency, formatPercent } from "@/lib/format";

// Keep formatCurrency's compact mode by adding it to lib/format.ts:
// The compact variant is already covered by formatCompactCurrency in lib/format.ts.
// Pipeline card metrics that need compact format should use formatCompactCurrency instead.
```

**Step 2:** The `formatCurrency` in pipeline-types has a `compact` flag used by `PipelineKanban.tsx` column headers and `getCardMetricValue`. These call sites need to switch to `formatCompactCurrency` from `lib/format.ts`.

**Affected call sites:**
- `pipeline-types.ts:258` — `getCardMetricValue` uses `formatCurrency(value, true)` → change to `formatCompactCurrency(value)`
- `PipelineKanban.tsx:201-204` — column header total uses `formatCurrency(totalAmount, true)` → change to `formatCompactCurrency(totalAmount)`

**Step 3:** Also update the `formatRatio` function in pipeline-types.ts to use em dash:
```typescript
// Current: returns "--" for null
// Change to: return "—" for null (consistent with lib/format.ts)
export function formatRatio(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value).toFixed(2)}x`;
}
```

### Phase 3: Replace Inline `.toLocaleDateString()` Calls

Every raw `toLocaleDateString` call should be replaced with the appropriate `lib/format.ts` function. Here is the mapping:

**Standard date display** (`"Jan 15, 2024"`) → use `formatDate(dateString)`

| File | Line | Current Code | Replace With |
|------|------|-------------|-------------|
| `components/tasks/deal-tasks.tsx` | 100 | `new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })` | `formatDate(task.due_date)` |
| `components/tasks/task-card.tsx` | 155 | `new Date(task.due_date + "T00:00:00").toLocaleDateString(...)` | `formatDate(task.due_date)` |
| `components/tasks/approval-card.tsx` | 104 | `new Date(task.due_date + "T00:00:00").toLocaleDateString(...)` | `formatDate(task.due_date)` |
| `components/tasks/recurring-templates-table.tsx` | 367 | `new Date(t.next_due_date + "T00:00:00").toLocaleDateString(...)` | `formatDate(t.next_due_date)` |
| `components/tasks/approval-drawer.tsx` | 257 | `.toLocaleDateString("en-US", {...})` | `formatDate(...)` |
| `components/admin/underwriting/version-history.tsx` | 115 | `new Date(v.created_at).toLocaleDateString("en-US", {...})` | `formatDate(v.created_at)` |
| `components/admin/email-templates/version-history.tsx` | 90 | `new Date(v.created_at).toLocaleDateString("en-US", {...})` | `formatDate(v.created_at)` |
| `components/admin/servicing/billing-tabs.tsx` | 211, 356 | `.toLocaleDateString("en-US", {...})` | `formatDate(...)` |
| `components/admin/servicing/payoff-statement-generator.tsx` | 474 | `.toLocaleDateString("en-US", {...})` | `formatDate(...)` |
| `components/admin/loan-list-view.tsx` | 150 | `new Date(l.created_at).toLocaleDateString()` | `formatDate(l.created_at)` |
| `components/admin/term-sheet-template-editor.tsx` | 547 | `new Date(current.last_edited_at).toLocaleDateString(...)` | `formatDate(current.last_edited_at)` |
| `components/documents/editor/EditorSidebar.tsx` | 190 | `new Date(documentInfo.generatedAt).toLocaleDateString()` | `formatDate(documentInfo.generatedAt)` |
| `components/dialer/DialerListsPage.tsx` | 183 | `new Date(list.created_at).toLocaleDateString()` | `formatDate(list.created_at)` |
| `components/dialer/ContactInfoPanel.tsx` | 46 | `new Date(contact.contact.last_contacted_at).toLocaleDateString()` | `formatDate(contact.contact.last_contacted_at)` |
| `components/public/LoanIndexes.tsx` | 39 | `date.toLocaleDateString('en-US', {...})` | `formatDate(dateStr)` |
| `components/shared/UnifiedNotes/index.tsx` | 441 | `d.toLocaleDateString("en-US", { month: "short", day: "numeric" })` | `formatDate(dateStr)` (note: this drops year, which is fine for notes) |
| `components/operations/badges.tsx` | 194 | `due.toLocaleDateString("en-US", {...})` | `formatDate(dateStr)` |
| `components/operations/OperationsView.tsx` | 161, 918 | `new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })` | See note below |
| `components/pipeline/SecureUploadLinkDialog.tsx` | 53 | `new Date(expiresAt).toLocaleDateString("en-US", {...})` | `formatDate(expiresAt)` |

**Short date (no year)** — Some call sites intentionally show only month + day (e.g., notes timestamps, operations badges). Add a new `formatDateShort` to `lib/format.ts`:

```typescript
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
```

Then replace short-date call sites with `formatDateShort(...)`.

**Date + Time** — A few call sites show date + time. Add a `formatDateTime` to `lib/format.ts`:

```typescript
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
```

Replace these call sites:
- `components/tasks/task-split-panel.tsx:811` → `formatDateTime(taskApproval.responded_at)`
- `components/tasks/task-sheet.tsx:762` → `formatDateTime(taskApproval.responded_at)`
- `components/approvals/approval-detail-view.tsx:482` → `formatDateTime(entry.created_at)`
- `components/admin/budget-draws/audit-log-sub-tab.tsx:160` → `formatDateTime(timestamp)`

**Time only** — Two call sites show time only. Add `formatTime`:

```typescript
export function formatTime(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
```

Replace:
- `components/pipeline/tabs/CommercialUnderwritingTab.tsx:227` → `formatTime(uw?.updated_at)`
- `components/documents/editor/DocumentEditor.tsx:352` → `formatTime(lastSaved)`

### Phase 4: Replace Inline `Intl.NumberFormat` Calls

| File | Line | Current | Replace With |
|------|------|---------|-------------|
| `components/pipeline/FieldMergeRow.tsx:26` | `new Intl.NumberFormat("en-US", { style: "currency", ... })` | `formatCurrency(...)` from `@/lib/format` |

### Phase 5: Pipeline DealMessagesPanel Date Helpers

`DealMessagesPanel.tsx` has two local date formatters (lines 49 and 78) used for message grouping and timestamps. These are context-specific (message UI), but should still use the shared library as building blocks:

```typescript
// Line 49: formatMessageTime — shows "12:34 PM" for today, "Jan 15, 12:34 PM" for older
// Replace with: use formatTime for today, formatDateTime for older

// Line 78: formatDateSeparator — shows "Today", "Yesterday", or "January 15, 2024"
// This is unique enough to stay local, but should use formatDate for the fallback case
```

---

## New Functions to Add to `lib/format.ts`

Before starting the sweep, add these missing formatters:

```typescript
// Add to lib/format.ts:

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value).toFixed(2)}x`;
}
```

Also add tests for the new functions in `__tests__/format.test.ts`.

---

## Implementation Order

### Step 1: Expand `lib/format.ts` (add new functions)
Add `formatDateShort`, `formatDateTime`, `formatTime`, `formatRatio` to `lib/format.ts`.
Add corresponding tests to `__tests__/format.test.ts`.
Run `pnpm build` to verify.

### Step 2: Kill duplicate `formatDate` definitions (Phase 1)
Work through the 12 files with local `formatDate` functions. For each:
1. Delete the local function definition
2. Add `import { formatDate } from "@/lib/format"` (or add to existing import)
3. Verify no signature mismatch (most are identical; a few take `string` instead of `string | null | undefined` which is compatible)
Run `pnpm build` after every 3-4 files.

### Step 3: Consolidate pipeline-types.ts (Phase 2)
1. Remove `formatCurrency` and `formatPercent` function bodies from `pipeline-types.ts`
2. Re-export from `lib/format.ts`: `export { formatCurrency, formatPercent } from "@/lib/format"`
3. Update `getCardMetricValue` to use `formatCompactCurrency` for the compact case
4. Update `PipelineKanban.tsx` column header to use `formatCompactCurrency`
5. Update `formatRatio` in pipeline-types.ts to return `"—"` instead of `"--"`
Run `pnpm build`.

### Step 4: Replace inline `.toLocaleDateString()` calls (Phase 3)
Work through the ~30 call sites listed above. Group by directory:
- `components/tasks/` (5 files)
- `components/admin/` (6 files)
- `components/pipeline/` (5 files)
- `components/documents/` (2 files)
- `components/operations/` (2 files)
- `components/shared/` (1 file)
- `components/dialer/` (2 files)
- `components/public/` (1 file)
- `components/approvals/` (1 file)
- `components/crm/` (if any)
Run `pnpm build` after each directory group.

### Step 5: Replace duplicate currency formatters (Phase 4)
- `UwField.tsx` — delete `formatCurrencyDisplay`, import `formatCurrency`
- `shared-field-renderer.tsx` — delete `formatCurrencyDisplay`, import `formatCurrency`
- `FieldMergeRow.tsx` — replace inline `Intl.NumberFormat` with `formatCurrency`
- `apply/page.tsx` — delete local `formatCurrency`, import from `@/lib/format`
Run `pnpm build`.

### Step 6: Update CLAUDE.md
Add a new rule to the Critical Rules section:

```markdown
13. **All formatting goes through `lib/format.ts`.** Never use raw `.toLocaleDateString()`, `new Intl.NumberFormat()`, or define local `formatDate`/`formatCurrency`/`formatPercent` functions. Import from `@/lib/format`. Available formatters: `formatCurrency`, `formatCurrencyDetailed`, `formatCompactCurrency`, `formatDate`, `formatDateShort`, `formatDateTime`, `formatTime`, `formatPercent`, `formatRatio`, `formatPhoneNumber`, `smartDate`, `timeAgo`, `formatFieldValue`. All return `"—"` for null/undefined values. If you need a new format variant, add it to `lib/format.ts` with tests.
```

### Step 7: Final verification
1. Run `pnpm build` — zero TypeScript errors
2. Run `pnpm test` — all format tests pass
3. Grep for remaining violations: search for `toLocaleDateString`, `new Intl.NumberFormat`, `function formatDate`, `function formatCurrency` outside of `lib/format.ts`
4. Any remaining hits should be justified exceptions (documented in code comments)

---

## Scope

### IN
- All files under `apps/requity-os/`
- New formatter functions in `lib/format.ts`
- New tests in `__tests__/format.test.ts`
- CLAUDE.md rule addition
- Null value standardization to em dash `"—"`

### OUT
- `apps/requity-group/` (marketing site) — separate sweep if needed
- `apps/trg-living/` — separate sweep if needed
- `packages/` shared packages — no formatting logic lives here currently
- Changing what dates/currencies actually display (e.g., changing from "Jan 15, 2024" to "1/15/24") — keep current display formats, just centralize them

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Signature mismatch between local `formatDate(dateStr: string)` and `lib/format.ts` `formatDate(date: string \| null \| undefined)` | The shared version accepts a superset. All existing call sites pass strings, so they're compatible. |
| Pipeline `formatCurrency` with `compact` flag has callers that depend on the `$` prefix in compact output | `formatCompactCurrency` in lib/format.ts already includes the `$` prefix. Verify output matches. |
| `formatCompactCurrency` returns `"TBD"` for null/0 but pipeline column headers currently show nothing for $0 | Check if `PipelineKanban` conditionally renders the total. It does: `{totalAmount > 0 && ...}`. So `formatCompactCurrency`'s "TBD" won't show for zero. Compatible. |
| Some `toLocaleDateString` calls intentionally omit the year | That's why we're adding `formatDateShort`. Map those call sites to the short variant. |
| `DealMessagesPanel` date helpers have message-specific logic (Today/Yesterday) | Keep the "Today"/"Yesterday" logic local but have it call `formatDate` for the fallback. Or move to lib/format.ts as `formatMessageDate`. |
| Em dash `"—"` vs CLAUDE.md rule 8 "No em dashes in generated documents" | Rule 8 applies to document content (term sheets, emails, reports). Format lib em dashes are for UI display of missing data, not generated prose. These are different contexts. No conflict. |

---

## Success Criteria

1. Zero local `formatDate`, `formatCurrency`, `formatPercent` function definitions outside `lib/format.ts`
2. Zero raw `.toLocaleDateString()` or `new Intl.NumberFormat()` calls in component files (except `lib/format.ts` itself)
3. All null/missing values display as `"—"` consistently across the portal
4. `pnpm build` passes with zero errors
5. `pnpm test` passes (including new format test cases)
6. CLAUDE.md updated with formatting rule
7. Grep verification confirms no remaining violations

---

## Files Reference

### Source of Truth
| File | Role |
|------|------|
| `lib/format.ts` | All formatting functions (THE canonical source) |
| `__tests__/format.test.ts` | Format function tests |

### Files With Duplicate Functions to Delete (12 files)
| File | Duplicate |
|------|-----------|
| `components/sops/SOPCard.tsx` | `formatDate` |
| `components/sops/SOPVersionHistory.tsx` | `formatDate` |
| `components/pipeline/tabs/ConditionsTab.tsx` | `formatDate` |
| `components/pipeline/tabs/DocumentsTab.tsx` | `formatDate` |
| `components/pipeline/tabs/DiligenceTab.tsx` | `formatDate` |
| `components/pipeline/UwField.tsx` | `formatCurrencyDisplay` |
| `components/crm/shared-field-renderer.tsx` | `formatCurrencyDisplay` |
| `components/admin/underwriting/uw-editor-client.tsx` | `formatDate` |
| `components/admin/commercial-uw/rent-roll-version-history.tsx` | `formatDate` |
| `app/(authenticated)/(admin)/models/[type]/page.tsx` | `formatDate` |
| `app/(authenticated)/(admin)/models/[type]/scenarios/page.tsx` | `formatDate` |
| `app/(authenticated)/(admin)/models/[type]/scenarios/[scenarioId]/scenario-header.tsx` | `formatDate` |
| `app/(authenticated)/sops/[slug]/sop-detail-client.tsx` | `formatDate` |
| `app/(authenticated)/sops/admin/sop-admin-client.tsx` | `formatDate` |
| `app/(public)/apply/page.tsx` | `formatCurrency` |
| `components/pipeline/pipeline-types.ts` | `formatCurrency`, `formatPercent` |

### Files With Inline `.toLocaleDateString()` to Replace (~25 files)
| File | Approximate Lines |
|------|------------------|
| `components/tasks/deal-tasks.tsx` | 100 |
| `components/tasks/task-split-panel.tsx` | 811 |
| `components/tasks/task-card.tsx` | 155 |
| `components/tasks/approval-card.tsx` | 104 |
| `components/tasks/approval-drawer.tsx` | 257 |
| `components/tasks/recurring-templates-table.tsx` | 367 |
| `components/tasks/template-sheet.tsx` | 645 |
| `components/admin/underwriting/version-history.tsx` | 115 |
| `components/admin/email-templates/version-history.tsx` | 90 |
| `components/admin/servicing/billing-tabs.tsx` | 211, 356 |
| `components/admin/servicing/payoff-statement-generator.tsx` | 474 |
| `components/admin/loan-list-view.tsx` | 150 |
| `components/admin/term-sheet-template-editor.tsx` | 547 |
| `components/admin/budget-draws/audit-log-sub-tab.tsx` | 160 |
| `components/documents/editor/EditorSidebar.tsx` | 190 |
| `components/documents/editor/DocumentEditor.tsx` | 352 |
| `components/documents/actions.ts` | 35, 40 |
| `components/dialer/DialerListsPage.tsx` | 183 |
| `components/dialer/ContactInfoPanel.tsx` | 46 |
| `components/public/LoanIndexes.tsx` | 39 |
| `components/shared/UnifiedNotes/index.tsx` | 441 |
| `components/operations/badges.tsx` | 194 |
| `components/operations/OperationsView.tsx` | 161, 918 |
| `components/pipeline/SecureUploadLinkDialog.tsx` | 53 |
| `components/pipeline/tabs/CommercialUnderwritingTab.tsx` | 227 |
| `components/pipeline/DealMessagesPanel.tsx` | 49, 87 |
| `components/pipeline/FieldMergeRow.tsx` | 26 |
| `components/approvals/approval-detail-view.tsx` | 482 |
