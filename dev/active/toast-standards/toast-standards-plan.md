# Toast Standards — Implementation Plan

## Objective
Consolidate portal onto sonner via `lib/toast.ts` wrapper with standardized messaging patterns.

## Scope
- IN: New `lib/toast.ts` wrapper, migration of ~104 useToast files and ~53 direct sonner files, message standardization, CLAUDE.md rule
- OUT: Deleting shadcn toast files, custom styling changes, toast position/duration changes

## Approach
1. Phase 1: Create `lib/toast.ts` (done)
2. Phase 2: Migrate useToast files (~104 files) in batches of ~15
3. Phase 3: Migrate direct sonner files (~53 files) in batches of ~15
4. Phase 4: Update CLAUDE.md
5. Phase 5: Final verification (build, lint, grep checks)

## Success Criteria
1. Zero `useToast()` imports in application code
2. Zero `import { toast } from "sonner"` in application code (only in lib/toast.ts and sonner.tsx)
3. All error toasts use "Could not [verb] [object]" pattern
4. All success toasts use "[Object] [past-tense verb]" pattern
5. `pnpm build` passes
