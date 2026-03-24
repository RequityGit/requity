# EmptyState Component — Implementation Prompt

## Objective

Create a shared `<EmptyState>` component and enforce its use across every empty collection, table, tab, and card in the portal. Right now, 96 files render "No X found/yet" strings with inconsistent styling, no icons, and no guidance. This makes the portal feel unfinished. A single component replaces all of them with a consistent, polished pattern.

---

## Current State

### What Exists
- `.rq-empty-state` CSS class in `globals.css`: `py-12 text-center text-muted-foreground text-sm`
- `DataTable` component has an `emptyMessage` string prop (used in ~45 files)
- 15 components use `.rq-empty-state` class directly

### The Problem: 96 Files, Zero Consistency

**108 total "No X found/yet" occurrences across 96 files.** Here's how they break down:

**Pattern 1: Inline text (most common, ~50 files)**
```tsx
// Every one of these is styled differently
<p className="text-sm text-muted-foreground">No messages yet</p>
<p className="text-muted-foreground text-sm">No rate sheets uploaded yet.</p>
<div className="py-6 text-center text-[13px] text-[#71717a]">No versions yet.</div>
<p className="text-muted-foreground">No lender partners yet</p>
```
Problems: different font sizes (text-sm vs text-[13px]), some centered some not, hardcoded colors (`#71717a`), no icons, no guidance, no action button.

**Pattern 2: DataTable emptyMessage prop (~45 files)**
```tsx
<DataTable columns={columns} data={data} emptyMessage="No loans found." />
<DataTable columns={columns} data={data} emptyMessage="No billing cycles generated yet." />
<DataTable columns={columns} data={data} emptyMessage="No payoff statements have been generated for this loan yet." />
```
Problem: text-only, no visual weight, looks like the table broke rather than intentionally empty.

**Pattern 3: .rq-empty-state class (15 files)**
```tsx
<div className="rq-empty-state">No conditions yet</div>
<div className="px-5 rq-empty-state">No documents</div>
<CardContent className="rq-empty-state">No borrower record</CardContent>
```
Problem: consistent styling but still text-only, no icons or actions.

---

## Target: Shared `<EmptyState>` Component

### Component API

```tsx
// components/shared/EmptyState.tsx

interface EmptyStateProps {
  icon?: LucideIcon;              // Optional icon (from lucide-react)
  title: string;                  // Primary message: "No documents yet"
  description?: string;           // Optional guidance: "Upload or generate your first document"
  action?: {                      // Optional CTA button
    label: string;                // "Upload Document"
    onClick: () => void;          // Click handler
    icon?: LucideIcon;            // Optional button icon (Plus, Upload, etc.)
  };
  compact?: boolean;              // Reduced padding for inline/card contexts (default false)
  className?: string;             // Additional classes for custom spacing
}
```

### Visual Design

```
┌──────────────────────────────────────────────┐
│                                              │
│              [Icon: muted, 40px]             │  ← icon (optional, text-muted-foreground/50)
│                                              │
│           No documents yet                   │  ← title (text-sm text-muted-foreground font-medium)
│                                              │
│     Upload or generate your first document   │  ← description (text-xs text-muted-foreground/70)
│                                              │
│           [ + Upload Document ]              │  ← action button (rq-action-btn)
│                                              │
└──────────────────────────────────────────────┘

Compact variant: py-6 instead of py-12, icon 32px instead of 40px
```

### Component Implementation

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12",
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "text-muted-foreground/40 mb-3",
            compact ? "h-8 w-8" : "h-10 w-10"
          )}
          strokeWidth={1.5}
        />
      )}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70 max-w-[280px]">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rq-action-btn-sm mt-4"
        >
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          {action.label}
        </button>
      )}
    </div>
  );
}
```

### Key Design Decisions

1. **Icon is optional** — many contexts (table cells, small cards) are too tight for icons. But when present, icons make empty states scannable.
2. **Compact mode** — `py-6` instead of `py-12` for cards, drawers, inline sections. Full padding for full-tab or full-page empty states.
3. **Description is guidance** — not just restating the title. "Upload or generate your first document" tells the user what to do next. Not every context needs this.
4. **Action button uses `.rq-action-btn-sm`** — consistent with the existing action button pattern in the design system.
5. **No icons by default** — keeps it simple for DataTable and other auto-rendered contexts. Developer opts in to icons for important empty states.

---

## Implementation Phases

### Phase 1: Create the Component

1. Create `components/shared/EmptyState.tsx` with the implementation above
2. Export from `components/shared/index.ts` if barrel exists
3. Run `pnpm build` to verify

### Phase 2: Upgrade DataTable

Update `components/shared/data-table.tsx` to accept the new pattern:

```tsx
// Before:
interface DataTableProps<T> {
  emptyMessage?: string;
}

// After:
interface DataTableProps<T> {
  emptyMessage?: string;                    // Keep for backward compat
  emptyState?: React.ReactNode;             // New: full EmptyState component
}
```

In the render:
```tsx
// When no data:
{data.length === 0 && (
  <TableRow>
    <TableCell colSpan={columns.length} className="h-24">
      {emptyState ?? (
        <EmptyState title={emptyMessage ?? "No data found."} compact />
      )}
    </TableCell>
  </TableRow>
)}
```

This is backward-compatible. Existing `emptyMessage="No loans found."` props still work, but now render through `<EmptyState>` with consistent styling. New code can pass `emptyState={<EmptyState icon={FileText} title="..." action={...} />}` for richer empty states.

Run `pnpm build` to verify.

### Phase 3: Replace Inline Empty States (High-Traffic Pages First)

Replace ad-hoc empty state markup with `<EmptyState>` across the portal. Prioritize by user traffic:

**Pipeline (highest traffic)**

| File | Current | Replace With |
|------|---------|-------------|
| `pipeline/PipelineTable.tsx:57` | `No deals found` | `<EmptyState icon={Layers} title="No deals found" description="Adjust your filters or create a new deal" compact />` |
| `pipeline/DealMessagesPanel.tsx:193` | `<p className="text-sm text-muted-foreground">No messages yet</p>` | `<EmptyState icon={MessageSquare} title="No messages yet" compact />` |
| `pipeline/DealOverviewSummary.tsx:308` | `No contacts found` | `<EmptyState title="No contacts found" compact />` |
| `pipeline/tabs/ConditionsTab.tsx:217` | `<div className="rounded-xl border bg-card px-5 rq-empty-state">` | `<EmptyState icon={ClipboardCheck} title="No conditions yet" description="Add conditions from the condition templates" />` |
| `pipeline/tabs/DocumentsTab.tsx:327` | `<div className="px-5 rq-empty-state">` | `<EmptyState icon={FileText} title="No documents yet" description="Upload or generate documents for this deal" />` |
| `pipeline/tabs/DiligenceTab.tsx:1563,2699` | Two `.rq-empty-state` divs | Replace both with `<EmptyState>` |
| `pipeline/tabs/sources-uses/SourcesUsesSubTab.tsx:654,752` | `No value-add items yet` / `No ground-up items yet` | `<EmptyState title="..." compact />` |
| `pipeline/tabs/financials/UnitMixSection.tsx:237` | `.rq-empty-state` | `<EmptyState icon={Building2} title="No units defined" compact />` |
| `pipeline/EntitySearchPopover.tsx:130` | `No matching {displayLabel}s found` | `<EmptyState title={...} compact />` |

**CRM (high traffic)**

| File | Current | Replace With |
|------|---------|-------------|
| `crm/contact-360/tabs/detail-borrower-tab.tsx:370` | `<CardContent className="rq-empty-state">` | `<EmptyState icon={User} title="No borrower record" compact />` |
| `crm/contact-360/tabs/detail-investor-tab.tsx:311` | `<CardContent className="rq-empty-state">` | `<EmptyState icon={TrendingUp} title="No investor record" compact />` |
| `crm/contact-360/tabs/detail-deals-tab.tsx:38` | `<CardContent className="rq-empty-state">` | `<EmptyState icon={Layers} title="No linked deals" compact />` |
| `crm/contacts-view.tsx` | inline empty message | `<EmptyState icon={Users} title="No contacts found" />` |
| `crm/companies-table.tsx:242` | `emptyMessage="No companies found."` | Will auto-upgrade via DataTable Phase 2 |
| `crm/email-activity-feed.tsx` | inline empty | `<EmptyState icon={Mail} title="No emails yet" compact />` |

**Servicing / Admin (moderate traffic)**

| File | Current | Replace With |
|------|---------|-------------|
| `admin/servicing/servicing-tabs.tsx` | 7 `emptyMessage` props | Auto-upgraded via DataTable |
| `admin/servicing/billing-tabs.tsx` | 3 `emptyMessage` props | Auto-upgraded via DataTable |
| `admin/loan-list-view.tsx:384` | `emptyMessage="No loans found."` | Auto-upgraded via DataTable |
| `admin/document-list-table.tsx:258` | `emptyMessage="No documents found."` | Auto-upgraded via DataTable |
| `admin/conditions-dashboard.tsx:535` | inline text | `<EmptyState icon={ClipboardCheck} title="No conditions found" />` |

**Investor Portal (important for investor experience)**

| File | Current | Replace With |
|------|---------|-------------|
| `i/distributions/page.tsx:273` | long `emptyMessage` | `<EmptyState icon={DollarSign} title="No distributions found" description="Adjust your filters or check back later" />` |
| `i/capital-calls/page.tsx:207` | long `emptyMessage` | `<EmptyState icon={ArrowUpRight} title="No contributions found" description="Adjust your filters or check back later" />` |
| `i/funds/[id]/page.tsx` | 3 `emptyMessage` props | Auto-upgraded via DataTable |

**Borrower Portal**

| File | Current | Replace With |
|------|---------|-------------|
| `b/draws/page.tsx:153` | long `emptyMessage` | `<EmptyState icon={HardHat} title="No draw requests found" description="Submit your first draw request using the button above" />` |
| `borrower/payments-table.tsx:151` | `emptyMessage` | Auto-upgraded via DataTable |
| `borrower/documents-table.tsx:171` | `emptyMessage` | Auto-upgraded via DataTable |

**Operations / Tasks**

| File | Current | Replace With |
|------|---------|-------------|
| `shared/UnifiedNotes/index.tsx:470` | `No notes yet` | `<EmptyState icon={StickyNote} title="No notes yet" compact />` |
| `tasks/recurring-templates-table.tsx:287` | `No templates found.` | `<EmptyState title="No templates found" compact />` |
| `admin/workflow-builder/workflow-builder-shell.tsx:135` | `No workflows yet` | `<EmptyState icon={Workflow} title="No workflows yet" description="Create your first workflow" />` |

**Documents**

| File | Current | Replace With |
|------|---------|-------------|
| `documents/GeneratedDocumentsTable.tsx:190` | `No generated documents found.` | `<EmptyState icon={FileText} title="No generated documents" compact />` |
| `documents/GenerateDocumentDialog.tsx:271` | `No active templates found` | `<EmptyState title="No active templates found" compact />` |
| `documents/CreateDocumentDialog.tsx:343,376` | Two inline messages | `<EmptyState title="..." compact />` |
| `documents/layout-editor/SectionsEditor.tsx:151` | `No sections yet. Add your first section below.` | `<EmptyState title="No sections yet" description="Add your first section below" compact />` |

**Control Center**

| File | Current | Replace With |
|------|---------|-------------|
| `control-center/forms/page.tsx:168,174` | `.rq-empty-state` TableCells | `<EmptyState title="..." compact />` |
| `control-center/users-client.tsx:537` | `No users found matching your filters.` | `<EmptyState icon={Users} title="No users found" description="Adjust your filters" compact />` |

**Other Admin**

| File | Current | Replace With |
|------|---------|-------------|
| `admin/underwriting/version-history.tsx:78` | Hardcoded `#71717a` color | `<EmptyState title="No versions yet" compact />` |
| `admin/underwriting/uw-editor-client.tsx:343` | `No versions yet` | `<EmptyState title="No versions yet" compact />` |
| `admin/email-templates/version-history.tsx:50` | Multi-line text | `<EmptyState title="No version history yet" description="Versions are created automatically when you save changes" compact />` |
| `admin/email-templates/template-list.tsx:101` | `No templates found.` | `<EmptyState icon={Mail} title="No templates found" />` |
| `admin/email-templates/variable-inserter.tsx:85` | `No matching variables found.` | `<EmptyState title="No matching variables" compact />` |
| `admin/dscr/rate-sheet-manager.tsx:287` | inline paragraph | `<EmptyState title="No rate sheets uploaded yet" compact />` |
| `admin/dscr/lenders-list.tsx:150` | inline paragraph | `<EmptyState icon={Building} title="No lender partners yet" />` |
| `admin/dscr/lender-detail.tsx:330` | inline text | `<EmptyState title="No rate sheets uploaded yet" compact />` |
| `admin/term-sheet-template-editor.tsx:249` | inline text | `<EmptyState title="No term sheet templates found" compact />` |
| `admin/quote-detail-client.tsx:613` | `No activity yet.` | `<EmptyState title="No activity yet" compact />` |
| `admin/role-management-dialog.tsx:269,305` | `No investor/borrower records found` | `<EmptyState title="..." description="Create a record first" compact />` |
| `admin/borrower-entity-list.tsx:79` | `No entities yet` | `<EmptyState title="No entities yet" compact />` |

**Remaining Components (Search Popovers / Dialogs)**

These are dropdown/popover contexts where a compact text-only empty state is appropriate:

| File | Context | Replace With |
|------|---------|-------------|
| `deal-team/AddDealTeamDialog.tsx:286` | Search results | `<EmptyState title="No contacts found" compact />` |
| `approvals/submit-for-approval-dialog.tsx:412` | Search results | `<EmptyState title="No contacts found" compact />` |
| `shared/mention-input.tsx:309` | Mention dropdown | `<EmptyState title="No team members found" compact />` |
| `layout/user-search-modal.tsx:109` | User search | `<EmptyState title="No users match your search" compact />` |
| `sops/SOPSearchBar.tsx:51` | SOP search | `<EmptyState title="No SOPs found" compact />` |
| `admin/originations/new-deal-form.tsx:556` | Borrower search | `<EmptyState title="No borrowers found" compact />` |
| `admin/create-loan-dialog.tsx:365` | Borrower search | `<EmptyState title="No borrowers found" compact />` |

### Phase 4: Icon Selection Guide

For consistency, follow this icon mapping when adding icons to empty states:

| Content Type | Icon (lucide-react) |
|-------------|-------------------|
| Deals/Pipeline | `Layers` |
| Documents | `FileText` |
| Contacts/Users | `Users` or `User` |
| Companies | `Building2` |
| Messages/Email | `MessageSquare` or `Mail` |
| Notes | `StickyNote` |
| Tasks | `CheckSquare` |
| Conditions | `ClipboardCheck` |
| Payments/Money | `DollarSign` |
| Investments | `TrendingUp` |
| Properties/Units | `Building2` or `Home` |
| Templates | `FileCode` |
| Workflows | `Workflow` |
| Versions/History | `History` |
| Draw Requests | `HardHat` |
| Rate Sheets | `Table` |
| Search (no results) | No icon (compact text only) |

### Phase 5: Update CLAUDE.md

Add to the Critical Rules section:

```markdown
15. **All empty collection states use the `<EmptyState>` component.** Import from `@/components/shared/EmptyState`. Never write inline "No X found" text with ad-hoc styling. Use `compact` prop for cards, drawers, and table cells. Use `icon` prop for full-tab and full-page empty states. DataTable's `emptyMessage` string prop auto-renders through EmptyState. For richer empty states in tables, use the `emptyState` prop with a full `<EmptyState>` component.
```

Update the Global CSS Utility Classes table to note that `.rq-empty-state` is deprecated in favor of the component:

```markdown
| `.rq-empty-state` | **DEPRECATED** — use `<EmptyState>` component instead | `py-12 text-center text-muted-foreground` |
```

---

## Scope

### IN
- New `<EmptyState>` component
- `DataTable` upgrade to support `emptyState` prop (backward compatible)
- Replacement sweep across all 96 files
- Icon consistency guide
- CLAUDE.md rule

### OUT
- Illustration/SVG empty states (too heavy for V1; can add later as an optional `illustration` prop)
- Animated empty states (motion tokens are in place; can add entrance animation later)
- Custom empty state components per module (the shared component covers all cases)

---

## Implementation Order

1. Create `components/shared/EmptyState.tsx`
2. Upgrade `components/shared/data-table.tsx` (backward compatible)
3. Run `pnpm build`
4. Replace pipeline empty states (highest traffic)
5. Run `pnpm build`
6. Replace CRM empty states
7. Run `pnpm build`
8. Replace admin/servicing empty states
9. Run `pnpm build`
10. Replace investor/borrower portal empty states
11. Run `pnpm build`
12. Replace remaining (operations, documents, control center, dialogs/popovers)
13. Run `pnpm build`
14. Update CLAUDE.md
15. Final grep verification: search for remaining inline "No X found/yet" patterns

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| DataTable `emptyMessage` prop change breaks existing code | Fully backward compatible. `emptyMessage` string still works; it just renders through `<EmptyState>` now. |
| Some empty states are inside `<TableCell>` with `colSpan` | `<EmptyState compact />` works in table cells. The component is a plain `<div>`, not a table element. |
| Search popovers need ultra-compact empty state | `compact` mode + no icon + no description = minimal footprint. |
| Too many icons makes the portal feel busy | Icon is optional. Use icons only for full-tab/full-page empty states. Search results and small card contexts stay text-only. |
| Different contexts need different vertical padding | `compact` handles most cases. For truly custom spacing, the `className` prop allows overrides. |

---

## Success Criteria

1. `<EmptyState>` component exists and is documented
2. `DataTable` renders empty states through the component
3. Zero inline "No X found/yet" text with ad-hoc styling remains
4. All empty states are visually consistent (same font, spacing, color)
5. High-traffic empty states (pipeline, CRM) have icons and guidance
6. `pnpm build` passes with zero errors
7. CLAUDE.md updated with the rule
8. Grep verification confirms no remaining ad-hoc patterns

---

## Files Reference

### New Files
| File | Role |
|------|------|
| `components/shared/EmptyState.tsx` | Shared empty state component |

### Modified Files
| File | Change |
|------|--------|
| `components/shared/data-table.tsx` | Add `emptyState` prop, render through `<EmptyState>` |
| `CLAUDE.md` | Add rule 15 |
| ~96 component files | Replace inline empty states with `<EmptyState>` |
