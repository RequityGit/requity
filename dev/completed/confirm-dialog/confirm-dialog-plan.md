# ConfirmDialog Hook — Implementation Plan

## Objective
Replace 30 independent AlertDialog confirmation patterns across 26 files with a single `useConfirm()` hook and `<ConfirmProvider>` component.

## Scope
- IN: All simple confirm/cancel dialogs (destructive and non-destructive)
- OUT: Complex dialogs with input fields, multi-step wizards, non-confirmation AlertDialog uses

## Approach
1. Create `components/shared/ConfirmDialog.tsx` (context + hook + provider + dialog)
2. Add `<ConfirmProvider>` to authenticated layout
3. Delete 4 standalone dialog components, update their parents
4. Convert 17 files with inline destructive AlertDialogs
5. Convert 5 files with non-destructive confirmations
6. Update CLAUDE.md, final build/lint

## Files to Create
- `components/shared/ConfirmDialog.tsx`

## Files to Delete
- `components/admin/email-templates/delete-confirm-dialog.tsx`
- `components/admin/document-delete-dialog.tsx`
- `components/crm/delete-contact-button.tsx`
- `components/crm/delete-company-button.tsx`

## Files to Modify
- `app/(authenticated)/layout.tsx` — add ConfirmProvider
- 22+ component files — replace inline AlertDialog with useConfirm()

## Risks
- Some dialogs have custom content (inputs, textareas) — leave as-is
- delete-contact-button.tsx used in multiple places — find all import sites
- Layout is server component — ConfirmProvider is client, but this works fine in React

## Success Criteria
- `useConfirm()` works from any authenticated page
- All simple confirm/cancel dialogs use the hook
- 4 standalone files deleted
- `pnpm build` passes with zero errors
- Net code reduction of ~500+ lines
