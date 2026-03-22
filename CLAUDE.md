# CLAUDE.md - RequityOS Development Workflow

> Monorepo: Turborepo with shared packages (`@repo/lib`, `@repo/types`, `@repo/ui`, `@repo/db`)
> Portal: app.requitygroup.com | App: `requity-os` | Stack: Next.js + Supabase | Project ID: `edhlkknvlczhbowasjna`
> Marketing Site: requitygroup.com | App: `requity-group` | Stack: Next.js (same monorepo, shares packages with requity-os)
> Lending Site: requitylending.com | Stack: Next.js (separate)
> Living Site: trg-living | App: `trg-living` (same monorepo)
> GitHub Org: RequityGit

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start all apps (Turbo)
pnpm build                  # Production build (ALWAYS run after edits to catch TS errors)
pnpm typecheck              # TypeScript check without full build
pnpm lint                   # ESLint

# Supabase
npx supabase db push        # Push migrations
npx supabase gen types      # Regenerate TypeScript types after schema changes
npx supabase db reset        # Reset local DB (destructive)

# Testing
pnpm test                   # Run test suite
pnpm test:watch             # Watch mode
```

---

## Critical Rules (Never Violate)

1. **Design System v3 is mandatory.** Read the `requity-ui-design` skill before ANY UI work. No navy, no gold, no serifs, no bounce animations. shadcn/ui primitives only.
2. **Auth uses `user_roles` table**, not `profiles.role`. The `app_role` enum defines roles: super_admin, admin, investor, borrower.
3. **CRM contacts table is `crm_contacts`**, not `contacts`.
4. **Draw requests table is `draw_requests`**, not `construction_draws`.
5. **Loans use `status` (enum `loan_status`) and `stage` (text column).**
6. **RLS is enforced on every table.** Borrower-role isolation cannot be validated from service role; requires borrower-login testing.
7. **Supabase MCP (`https://mcp.supabase.com/mcp`) is standard for all DB operations.**
8. **No em dashes in any generated documents or content.** Use commas, periods, or semicolons.
9. **Chatter (deal room messaging) was deleted.** Do not reference it or build on it.
10. **Both requity-os and requity-group are Next.js apps in the same Turborepo.** They share `@repo/lib`, `@repo/types`, `@repo/ui`, and `@repo/db` packages. requity-os runs the portal (app.requitygroup.com), requity-group runs the marketing site (requitygroup.com). requitylending.com is a separate Next.js project. Do not confuse the three.
11. **All editable fields platform-wide use the hover-to-reveal pattern via global CSS classes.** Apply `className="inline-field"` to any `<Input>`, `<SelectTrigger>`, `<Textarea>`, or button trigger. Apply `className="inline-field-label"` to field labels. These classes are defined in `globals.css` and override shadcn defaults (`h-10`, `bg-background`, `border-input`, `px-3 py-2`) to produce clean text at rest with hover/focus reveal. No persistent borders, no dashed underlines, no visible backgrounds at rest. Inline saves use optimistic updates; never call `revalidateDeal` after inline field saves. See the "Inline Editing Pattern" section below for full details.
12. **Field Manager is the single source of truth for ALL field definitions.** The `field_configurations` table (managed at `/control-center/field-manager`) defines every field's label, type, and options. All page layouts, card type editors, and detail pages MUST pull field metadata from `field_configurations` via `useFieldConfigurations(module)` or `useResolvedCardType()`. Never define field labels, types, or dropdown options inline in components, JSONB columns, or constants. Card types store `*_field_refs` (references by `field_key` + `module`) with per-card-type overrides (`required`, `object`, `sort_order`) only. The modules `uw_deal`, `uw_property`, `uw_borrower` cover pipeline underwriting fields. See `/control-center/field-manager` for the admin UI and `hooks/useFieldConfigurations.ts` + `hooks/useResolvedCardType.ts` for consumption patterns.
13. **All formatting goes through `lib/format.ts`.** Never use raw `.toLocaleDateString()`, `new Intl.NumberFormat()`, or define local `formatDate`/`formatCurrency`/`formatPercent` functions. Import from `@/lib/format`. Available formatters: `formatCurrency`, `formatCurrencyDetailed`, `formatCompactCurrency`, `formatDate`, `formatDateShort`, `formatDateTime`, `formatTime`, `formatPercent`, `formatRatio`, `formatPhoneNumber`, `smartDate`, `timeAgo`, `formatFieldValue`. All return `"—"` for null/undefined values. If you need a new format variant, add it to `lib/format.ts` with tests.
14. **All animations and transitions use motion tokens from `globals.css`.** Never hardcode `duration-150`, `duration-200`, `duration-300`, or `ease-in`, `ease-out` directly. Use the token-based classes: `duration-fast` (120ms), `duration-normal` (200ms), `duration-slow` (350ms), `ease-out-rq`, `ease-in-out-rq`. For common patterns, use the utility classes: `.rq-transition` (hover states), `.rq-transition-transform` (movement), `.rq-transition-panel` (modals/sheets). Available animation classes: `.rq-animate-fade-in`, `.rq-animate-slide-in-right`, `.rq-animate-scale-in`, `.rq-animate-pulse-once`. All animations respect `prefers-reduced-motion` automatically.
15. **All confirmation dialogs use `useConfirm()` hook.** Import from `@/components/shared/ConfirmDialog`. Never build inline AlertDialog JSX for confirmations. Call `const ok = await confirm({ title, description, confirmLabel, destructive })` and check the boolean return. The `<ConfirmProvider>` in the authenticated layout handles rendering. AlertDialog is still used directly for complex dialogs with custom content (input fields, textareas, multi-step flows).

---

## Dev Docs System

This is the most important workflow discipline. Every significant task gets three files. No exceptions for anything that will take more than one session or touch more than 3 files.

### Starting a New Task

When beginning any feature, bugfix involving multiple files, or refactor:

```
mkdir -p dev/active/[task-name]/
```

Create three files:

**1. `[task-name]-plan.md`** - The approved implementation plan
```markdown
# [Task Name] - Implementation Plan

## Objective
[One sentence: what are we building and why]

## Scope
- IN: [what is included]
- OUT: [what is explicitly excluded]

## Approach
[Phases, steps, key decisions]

## Files to Modify
[List every file that will be touched, grouped by module]

## Database Changes
[Any schema changes, migrations, RLS policies]

## Risks
[What could go wrong, edge cases]

## Success Criteria
[How do we know this is done and correct]
```

**2. `[task-name]-context.md`** - Living context document
```markdown
# [Task Name] - Context

## Key Files
[File paths and what they do, relevant to this task]

## Decisions Made
[Architectural decisions with reasoning, add as you go]

## Gotchas Discovered
[Things that surprised us during implementation]

## Dependencies
[What this task depends on, what depends on this task]

## Last Updated: [timestamp]
## Next Steps: [what to do when resuming]
```

**3. `[task-name]-tasks.md`** - Checklist
```markdown
# [Task Name] - Tasks

## Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2
- [x] Task 3 (completed)

## Phase 2: [Name]
- [ ] Task 4
- [ ] Task 5

## Blockers
- [any current blockers]

## Last Updated: [timestamp]
```

### Rules for Dev Docs

- **Update tasks immediately** when completing them. Do not batch updates.
- **Update context** when making architectural decisions or discovering gotchas.
- **Before resuming any task**, read all three files first. Every time.
- **Before context gets low**, update all three files with current state and next steps.
- **When a task is complete**, move the folder to `dev/completed/[task-name]/`.

---

## Planning Workflow

Planning is mandatory. Never start implementing without an approved plan.

### Step 1: Research and Plan

Enter plan mode. Research the codebase thoroughly before producing a plan. Check:
- Existing patterns in similar modules
- Database schema and RLS policies
- Design system requirements (read the skill)
- Related files and potential side effects

### Step 2: Produce the Plan

Output a structured plan covering: objective, scope (in/out), approach with phases, files to modify, database changes, risks, and success criteria.

### Step 3: Review

**Stop and wait for approval.** Do not proceed until the plan is explicitly approved. If there are concerns, iterate on the plan.

### Step 4: Create Dev Docs

After plan approval, create the three dev doc files before writing any code.

### Step 5: Implement in Chunks

Implement one phase or section at a time. After each chunk:
- Run `pnpm build` to catch TypeScript errors
- Update the task checklist
- Pause for review if the chunk is substantial

### Step 6: Self-Review

After implementation is complete, review your own changes:
- Check for missing error handling
- Verify RLS implications
- Confirm design system compliance
- Look for hardcoded values that should be configurable
- Check for console.logs or debug code left behind

---

## Build Discipline

### After Every Set of Edits

Run `pnpm build` (or `pnpm typecheck`) after completing a logical unit of work. Do not wait until the end of a session.

If errors are found:
- **Under 5 errors:** Fix them immediately.
- **5+ errors:** List them all, group by category, fix systematically. Do not just fix the first one and move on.

### Never Say "Unrelated Errors"

If a build produces errors in files you did not edit, investigate whether your changes caused them through type propagation, import changes, or interface modifications. If they are genuinely pre-existing, note them in the task context file but still verify.

---

## Code Quality Checklist

Before considering any implementation complete, verify:

### Error Handling
- [ ] All async operations have try/catch with meaningful error messages
- [ ] Supabase queries check for errors: `if (error) throw error`
- [ ] User-facing errors are clear and actionable, not raw database messages
- [ ] Loading states exist for all async UI

### Database
- [ ] Supabase types regenerated after schema changes (`npx supabase gen types`)
- [ ] RLS policies tested (not just assumed from service role)
- [ ] Migrations are clean and reversible
- [ ] No raw SQL in application code (use Supabase client)

### UI (RequityOS Portal)
- [ ] Light and dark mode both work
- [ ] Uses shadcn/ui primitives (not custom components where shadcn covers it)
- [ ] Financial figures use `.num` class
- [ ] Empty states have guidance
- [ ] Loading states use Skeleton components
- [ ] No banned patterns (navy, gold, serifs, bounce, emoji)

### General
- [ ] No console.logs left in production code
- [ ] No hardcoded URLs, IDs, or secrets
- [ ] TypeScript strict mode passes
- [ ] Imports are clean (no unused imports)

---

## Global CSS Utility Classes

All reusable UI patterns are defined as global CSS classes in `apps/requity-os/app/globals/globals.css`. Use these instead of writing inline className strings. This is the single source of truth for visual consistency across the portal.

### Available Classes

| Class | Purpose | Use Instead Of |
|-------|---------|----------------|
| `.inline-field` | Hover-to-reveal editable field (Input, Select, Textarea) | `h-10 bg-background border-input px-3 py-2` |
| `.inline-field-label` | Label above inline field (`<span>`, not `<Label>`) | `text-xs text-muted-foreground` |
| `.rq-section-title` | Section heading on detail pages/cards | `text-[13px] font-semibold text-foreground` |
| `.rq-micro-label` | Uppercase micro label (KPI labels, table group headers) | `text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground` |
| `.rq-th` | Table header cell (commercial UW, pro forma grids) | `text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2` |
| `.rq-stat-value` | Large bold number in KPI/stat blocks | `text-xl font-bold tabular-nums` |
| `.rq-numeric-input` | Editable number cell in financial tables | `rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none` |
| `.rq-action-btn` | Ghost-style action button (add/edit/remove) | `inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-medium...` |
| `.rq-action-btn-sm` | Small variant of action button | Same but `px-2.5 py-[5px] text-[11px]` |
| `.rq-empty-state` | Centered empty content placeholder | `py-12 text-center text-muted-foreground` |
| `.rq-value-positive` | Green text for positive financial values | `text-emerald-600 dark:text-emerald-400` |
| `.rq-value-negative` | Red text for negative financial values | `text-red-600 dark:text-red-400` |
| `.rq-value-warn` | Amber text for warning/caution values | `text-amber-600 dark:text-amber-400` |
| `.rq-total-row` | Total row in financial tables (`<tr>` or flex wrapper) | `border-t-2 border-border bg-muted/30 font-semibold` |
| `.rq-subtotal-row` | Subtotal row (lighter than total) | `border-t border-border font-medium` |
| `.rq-td` | Financial table data cell (counterpart to `.rq-th`) | `px-[14px] py-[9px] text-[13px] tabular-nums align-middle` |
| `.rq-field-grid` | 2-column responsive grid for detail pages | `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4` |
| `.rq-field-grid-3` | 3-column grid for denser layouts | `grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4` |
| `.rq-field-stack` | Tight vertical stack for drawers/forms | `flex flex-col space-y-3` |
| `.rq-link` | Inline text link (primary color, hover underline) | `text-sm text-primary hover:underline underline-offset-4` |
| `.rq-link-muted` | Subtle text link (muted, brightens on hover) | `text-sm text-muted-foreground hover:text-foreground` |
| `.rq-divider` | Horizontal section divider | `border-t border-border` |
| `.rq-card` | Card padding (20px) | `p-5` |
| `.rq-panel` | Panel padding (24px) | `p-6` |
| `.rq-tab-content` | Tab content area padding (24px) | `p-6` |
| `.rq-page-content` | Page content padding (responsive) | `p-6 lg:p-8` |
| `.num` | Tabular figures for financial data | `font-variant-numeric: tabular-nums` |
| `.rq-transition` | Hover state transitions (color, bg, border, opacity) | `transition-colors duration-150` |
| `.rq-transition-transform` | Movement transitions (transform + opacity) | `transition-all duration-200` |
| `.rq-transition-panel` | Modal/sheet/panel transitions | `transition-all duration-300` |
| `.rq-transition-all` | All-property transition (use sparingly) | `transition-all duration-200 ease-in-out` |
| `.rq-animate-fade-in` | Fade in animation | Custom keyframes |
| `.rq-animate-slide-in-right` | Slide from right (peek panels, drawers) | Custom keyframes |
| `.rq-animate-scale-in` | Scale-up entrance (popovers, dropdowns) | Custom keyframes |
| `.rq-animate-pulse-once` | Single attention pulse (alerts, notifications) | Custom keyframes |

### When Building New Components

1. Check this table first. If a class exists for the pattern, use it.
2. Never copy long className strings from existing components. Use the global class.
3. If you find a repeated pattern with no global class, add one to globals.css before proceeding.

---

## Inline Editing Pattern (Platform-Wide)

ALL editable fields across the entire portal (pipeline deal pages, CRM contact/company detail, loan servicing) use a unified hover-to-reveal inline editing pattern enforced via **global CSS classes** in `globals.css`. This is mandatory for any editable field anywhere in the platform.

### Global CSS Classes (Single Source of Truth)

Defined in `apps/requity-os/app/globals/globals.css`:

```css
.inline-field {
  @apply h-auto min-h-[32px] bg-transparent px-2 py-1
    border border-transparent rounded-md transition-colors;
}
.inline-field:hover {
  @apply border-border bg-muted/40;
}
.inline-field:focus,
.inline-field:focus-visible {
  @apply border-primary/60 bg-background ring-1 ring-primary/20 ring-offset-0 outline-none;
}
.inline-field-label {
  @apply text-[11px] font-medium text-muted-foreground leading-tight;
}
```

### How to Use

```tsx
// Any Input, SelectTrigger, Textarea, AddressAutocomplete, DatePicker:
<Input className="inline-field" />
<SelectTrigger className="inline-field" />

// Labels (use <span>, not <Label>, to avoid shadcn Label default styles):
<span className="inline-field-label">Field Name</span>

// Wrapper spacing (tight, no gap between label and field):
<div className="space-y-0">
  <span className="inline-field-label">Label</span>
  <Input className="inline-field" />
</div>
```

### What .inline-field Overrides from shadcn Input

| shadcn Default | .inline-field Override | Why |
|---------------|----------------------|-----|
| `h-10` (40px) | `h-auto min-h-[32px]` | Compact, matches plain text height |
| `bg-background` | `bg-transparent` | No visible background at rest |
| `border border-input` | `border border-transparent` | No visible border at rest |
| `px-3 py-2` | `px-2 py-1` | Tighter padding, text-like density |

### Visual States

```
Rest:    Clean text, no borders, no background. Looks like plain text.
Hover:   Subtle container appears. border-border bg-muted/40
Focus:   Active input. border-primary/60 bg-background ring-1 ring-primary/20
Saved:   Brief green checkmark flash, then back to rest state.
```

### Never Do

- Persistent dashed underlines (`border-b border-dashed`) on editable fields
- Persistent input borders at rest (no `border-input` on inline fields)
- Visible background at rest (no `bg-background` or `bg-muted` on inline fields)
- shadcn Input height (`h-10`) on inline fields
- `<Label className="text-xs">` for inline field labels (use `<span className="inline-field-label">`)
- `space-y-1.5` between label and field (use `space-y-0`)
- Per-component className constants for inline styling (use the global classes)
- Full-page re-fetch after inline field saves (use optimistic updates)
- `revalidateDeal`/`revalidatePath` after inline saves (causes loading flash)
- `new Date()` on date-only strings (timezone shift bug; split ISO strings directly)
- Blanket "$0" placeholder for non-currency fields

### Pipeline Component Map

| Tab | Component | Editing Primitive | Notes |
|-----|-----------|-------------------|-------|
| Overview | `UwField` + `ReadValue` | Field-config-aware read/edit toggle | Uses `useResolvedCardType()` |
| Property | `UwField` + `ReadValue` | Same as Overview | Same field config system |
| Borrower | `InlineField` | Direct inline text/number/currency/percent/date/select | Standalone, no field config dependency |
| Underwriting | `SUFieldRow` | Input with hover-reveal border | For Sources & Uses editable fields |
| Underwriting | `InputRow` (Assumptions) | Span with hover-reveal border | For exit/financing assumption fields |
| Underwriting | ProForma cell inputs | Inline inputs in spreadsheet context | Hover-reveal on individual cells |

### CRM Component Map

| Page | Component | Notes |
|------|-----------|-------|
| Contact 360 | `shared-field-renderer.tsx` | Renders all field types via `renderDynamicFieldsInline()`, all use `.inline-field` |
| Contact 360 | `detail-overview-tab.tsx` | Address section uses `.inline-field` on all inputs |
| Company 360 | `overview-tab.tsx` | All company fields use `.inline-field` and `.inline-field-label` |

### InlineField Types (`components/ui/inline-field.tsx`)

Supports: `text`, `number`, `currency`, `percent`, `select`, `date`

Type-aware placeholders: currency = "$0", percent = "0%", number = "0", text = "Add..."

### ReadValue Styling (`components/pipeline/ReadValue.tsx`)

```tsx
className={cn(
  "w-full min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
  "border border-transparent",
  onClick && "hover:border-border hover:bg-muted/40 cursor-pointer",
)}
```

### Label Styling (Consistent Across All Pages)

```
<span className="inline-field-label">Label Text</span>
// Resolves to: text-[11px] font-medium text-muted-foreground leading-tight
```

### Optimistic Update Pattern

```
1. User edits field inline
2. Update local state immediately (optimistic)
3. Fire DB write in background (no await blocking UI)
4. On success: no re-fetch needed, local state IS truth
5. On error: rollback local state, show error toast
6. Structural changes only (add/remove rows) trigger silent re-fetch via load(true)
```

### Borrower Tab Architecture

```
BorrowerContactsTab (orchestrator)
  -> BorrowingEntityCard (entity fields, uses InlineField)
  -> BorrowerMemberTable (member grid with inline editing)
     -> BorrowerMemberRow (per-row optimistic saves, no onUpdated callback)
        Footer: rollup stats (Ownership %, Lowest FICO, Combined Liquidity/Net Worth)

Key: onStructuralChange (add/remove) triggers re-fetch.
     Inline field saves are optimistic-only, no re-fetch.
```

---

## Schema Quick Reference

### Key Tables
| Table | Purpose | Notes |
|-------|---------|-------|
| `user_roles` | Role assignments | NOT `profiles.role` |
| `crm_contacts` | CRM contacts | NOT `contacts` |
| `crm_companies` | CRM companies | |
| `opportunities` | Loan pipeline deals | Has `stage` column |
| `loans` | Funded loans | `status` enum (`loan_status`), `stage` text |
| `draw_requests` | Construction draws | NOT `construction_draws` |
| `equity_deals` | Equity pipeline | With `equity_deal_stage_history` |
| `documents` | Document metadata | Supabase Storage is file storage layer |
| `ops_projects` | Internal project tracking | Operational projects |
| `ops_tasks` | Project tasks | Task board items |
| `field_configurations` | **Master field registry** | Single source of truth for ALL field labels, types, options |
| `unified_card_types` | Pipeline card type definitions | Uses `uw_field_refs` to reference `field_configurations` |
| `unified_deals` | Pipeline deals | `uw_data` JSONB stores field values keyed by `field_key` |
| `form_definitions` | Form engine blueprints | Slug-based, multi-step, conditional logic, admin-managed |
| `form_submissions` | Form responses | Session token resume, auto-save, links to entities |
| `deal_application_links` | Token-based public form access | Pre-fills borrower forms with deal/contact data |
| `entity_audit_log` | Field change audit trail | Tracks every form-driven entity change |

### Field Configuration Architecture
```
field_configurations (master registry)
  -> useFieldConfigurations(module)     # CRM, loan detail, servicing pages
  -> useResolvedCardType(cardType)      # Pipeline deal pages (resolves uw_field_refs)
  -> Field Manager UI                   # Admin edits labels, types, options
  -> Page Layout editors                # Admin assigns fields to page sections

Modules: uw_deal, uw_property, uw_borrower (pipeline UW)
         loan_details, property, borrower_entity (servicing)
         company_info, contact_profile, borrower_profile, investor_profile (CRM)
         + 15 more (see Field Manager sidebar)

Card types store REFERENCES only:
  uw_field_refs: [{field_key, module, required?, object?, sort_order}]
  NOT inline definitions like {key, label, type} -- those are resolved at runtime
```

### Monorepo Architecture
```
requity-monorepo/
  apps/
    requity-os/          # Portal (app.requitygroup.com) - authenticated, data-heavy
    requity-group/       # Marketing site (requitygroup.com) - public-facing, SEO
    trg-living/          # TRG Living site
  packages/
    db/                  # Supabase client, migrations, types
    lib/                 # Shared business logic
    types/               # Shared TypeScript types
    ui/                  # Shared UI components

Both requity-os and requity-group are Next.js apps. They CAN and SHOULD share
pages, components, and logic through the shared packages. When building features
that span both apps (e.g., form engine renders on marketing site, submits to
portal's Supabase), extract shared code into @repo/lib or @repo/ui.
```

### Form Engine Architecture
```
Form Builder (admin):     requity-os /control-center/forms/[id]
Form Renderer (public):   requity-os /forms/[slug] (can also render in requity-group)
Form Submission API:      requity-os /api/forms/submit
Deal Token API:           requity-os /api/forms/deal-token

Core libraries:           lib/form-engine/ (types, evaluator, autosave, submission-handler)
Components:               components/forms/ (FormEngine, StepRenderer, FormField, etc.)

Submission flow: form_submissions -> creates/updates crm_contacts, companies,
                 properties, opportunities, unified_deals -> entity_audit_log
```

### Auth Pattern
```typescript
// Getting current user's role
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();
```

### RLS Pattern
Every table must have RLS enabled. Standard policies:
- super_admin: full access
- admin: full access to company data
- investor: read own investments, documents, distributions
- borrower: read/write own loan data

---

## Team Reference

| Person | Role | Context |
|--------|------|---------|
| Dylan Marma | CEO | Portal architect, final approver |
| Luis | Originations | Primary lending pipeline user |
| Estefania Espinal | Lending Ops / super_admin | Portal power user, QA partner |
| Jet | Acquisitions / Asset Mgmt | Equity pipeline, property ops |
| Grethel | Operations / IR | Content, investor comms |
| Mike | Financial Controller | Servicing data, Excel exports |

---

## Documentation Structure

```
dev/
  active/              # Current task dev docs (plan, context, tasks)
  completed/           # Finished task docs (archive)

docs/
  architecture/        # System architecture, data flows
  api/                 # API references, endpoint docs
  modules/             # Per-module documentation
  runbooks/            # Operational procedures
```

When creating documentation:
- Architecture docs explain HOW the system works
- Module docs explain HOW TO work with specific modules
- Runbooks explain HOW TO perform specific operations
- Dev docs (active tasks) explain WHAT we are building right now

---

## Session Management

### Starting a Session
1. Check `dev/active/` for in-progress tasks
2. If resuming: read all three dev doc files before doing anything
3. If starting fresh: follow the Planning Workflow above

### Mid-Session
- Update dev docs after completing each phase
- Run builds after each logical unit of edits
- If context is getting long, proactively summarize state in dev docs

### Ending a Session / Low Context
Before context runs out:
1. Update all three dev doc files with current state
2. Note exact next steps in the context file
3. List any decisions that were made but not yet documented
4. Ensure the task checklist is current

### Compacting
When compacting conversation:
- All state should already be in dev docs
- A simple "continue" with the task name should be sufficient to resume
- If dev docs are current, zero context is lost

---

---

## Prompt Principles (For Dylan's Reference)

These are reminders for getting the best output:

1. **Be specific.** "Add a status filter to the loans table that filters by loan_status enum values and persists the selection in URL params" beats "add filtering to loans."

2. **Scope explicitly.** State what is IN and what is OUT of scope. "Only modify the table component, do not touch the API layer" prevents scope creep.

3. **Provide file paths.** Reference exact files when you know them. "@app/routes/loans.tsx" removes ambiguity.

4. **Ask for plans first.** For anything non-trivial, ask for a plan before implementation.

5. **Review in chunks.** Request implementation in phases and review between each phase.

6. **Re-prompt when quality drops.** If output quality degrades, start a fresh prompt with the same intent plus knowledge of what you don't want.

7. **Don't lead.** When asking for feedback on an approach, describe the situation neutrally. "What are the tradeoffs of this approach?" beats "Is this a good approach?"

8. **Step in when needed.** If a fix is obvious and quick, just do it yourself. No shame. Come back to Claude for the next chunk.
