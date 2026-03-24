# Inline Editor V2 - Tasks

## Phase 1: Section Config
- [ ] Create SectionConfigPopover component (rename, icon select, delete with confirm)
- [ ] Integrate into EditableSection (click section label to open)
- [ ] Wire to updateSection/deleteSection server actions
- [ ] Handle section deletion in InlineLayoutContext (remove from local state)

## Phase 2: Tab Management
- [ ] Create TabManager component (shown in toolbar when editing)
- [ ] Add tab rename (inline edit on tab labels)
- [ ] Add "new tab" button
- [ ] Add tab delete with confirmation
- [ ] Wire to addTab/updateTab/deleteTab server actions
- [ ] Update DealDetailPage tab bar to show edit controls

## Phase 3: Inline Field Config
- [ ] Create FieldConfigPopover component (label, type, dropdown options)
- [ ] Integrate into EditableFieldSlot (click field label to open)
- [ ] Wire to updateFieldConfig server action
- [ ] Handle dropdown options editing (add/remove/reorder)

## Phase 4: Quick Create Field
- [ ] Create CreateFieldDialog component
- [ ] Add "Create New Field" button to FieldPicker
- [ ] Auto-generate field_key from label
- [ ] Wire to createField + addFieldToLayout actions
- [ ] Invalidate picker cache after creation

## Final
- [ ] TypeScript compiles with zero errors
- [ ] Manual testing of all new features

## Last Updated: 2026-03-14
