# Toast Standards — Tasks

## Phase 1: Foundation
- [x] Create lib/toast.ts wrapper
- [x] Create dev docs
- [x] Verify build passes with new file

## Phase 2: Migrate useToast files (~104 files)
- [x] Batch 1: CRM components (25 files)
- [x] Batch 2: Admin components (43 files)
- [x] Batch 3: Pipeline components (26 files)
- [x] Batch 4: Remaining components (62 files)
- [x] Fix leftover TS errors (scenario-header, underwriting-assumptions, approval-drawer)
- [x] Migrate i/account and b/account pages
- [x] Build check after Phase 2

## Phase 3: Migrate direct sonner files
- [x] (Handled in parallel with Phase 2 — agents migrated both useToast and sonner files)

## Phase 4: CLAUDE.md update
- [x] Add toast rule #16 to Critical Rules

## Phase 5: Final verification
- [x] pnpm typecheck passes (zero errors)
- [x] useToast only in shadcn internal (toaster.tsx)
- [x] sonner only in lib/toast.ts and sonner.tsx
- [x] Zero `title: "Error"` patterns remaining
- [x] "successfully" cleaned from toast calls

## COMPLETE

## Last Updated: 2026-03-21
