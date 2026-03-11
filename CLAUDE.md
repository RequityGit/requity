# CLAUDE.md - RequityOS Development Workflow

> Portal: portal.requitygroup.com | Stack: Remix + Supabase | Project ID: `edhlkknvlczhbowasjna`
> Lending Site: requitylending.com | Stack: Next.js
> GitHub Org: RequityGit

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start Remix dev server
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
10. **This is Remix, not Next.js.** The lending site (requitylending.com) is Next.js. Do not confuse them.
11. **Field Manager is the single source of truth for ALL field definitions.** The `field_configurations` table (managed at `/control-center/field-manager`) defines every field's label, type, and options. All page layouts, card type editors, and detail pages MUST pull field metadata from `field_configurations` via `useFieldConfigurations(module)` or `useResolvedCardType()`. Never define field labels, types, or dropdown options inline in components, JSONB columns, or constants. Card types store `*_field_refs` (references by `field_key` + `module`) with per-card-type overrides (`required`, `object`, `sort_order`) only. The modules `uw_deal`, `uw_property`, `uw_borrower` cover pipeline underwriting fields. See `/control-center/field-manager` for the admin UI and `hooks/useFieldConfigurations.ts` + `hooks/useResolvedCardType.ts` for consumption patterns.

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
| `documents` | Document metadata | Google Drive is file storage layer |
| `project_tracker` | Internal project tracking | Update when working on Requity projects |
| `project_notes` | Project note log | Include timestamps |
| `field_configurations` | **Master field registry** | Single source of truth for ALL field labels, types, options |
| `unified_card_types` | Pipeline card type definitions | Uses `uw_field_refs` to reference `field_configurations` |
| `unified_deals` | Pipeline deals | `uw_data` JSONB stores field values keyed by `field_key` |

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

## Project Tracker Updates

When working on any RequityOS task, update the Supabase `project_tracker` table:

```sql
-- Log a note
INSERT INTO project_notes (project_id, note, created_at)
VALUES ('[project-id]', '[description of work done]', now());
```

Do this at the start and end of each significant work session.

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
