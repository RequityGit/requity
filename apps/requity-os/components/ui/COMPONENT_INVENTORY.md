# shadcn/ui Component Inventory — RequityOS Portal

Last updated: 2026-03-07

## Installed Components (31 shadcn + 2 custom)

| Component | File | Usage |
|-----------|------|-------|
| `AlertDialog` | alert-dialog.tsx | Destructive confirmation modals (delete, cancel, revoke) |
| `Avatar` | avatar.tsx | Contact/user avatars with consistent sizing |
| `Badge` | badge.tsx | Status badges, relationship type pills, tags |
| `Breadcrumb` | breadcrumb.tsx | Navigation breadcrumbs on detail pages |
| `Button` | button.tsx | All clickable actions (default, secondary, ghost, outline, destructive, link) |
| `Calendar` | calendar.tsx | Date pickers, date range filters |
| `Card` | card.tsx | Content containers with CardHeader, CardContent, CardFooter |
| `Checkbox` | checkbox.tsx | Bulk selection in tables, form checkboxes |
| `Collapsible` | collapsible.tsx | Sidebar nav sections that expand/collapse |
| `Command` | command.tsx | Cmd+K global search, combobox patterns |
| `DatePicker` | date-picker.tsx | Date input fields (custom, built on Calendar + Popover) |
| `Dialog` | dialog.tsx | Modal dialogs for forms, confirmations |
| `DropdownMenu` | dropdown-menu.tsx | Action menus, context menus, row actions |
| `Form` | form.tsx | React Hook Form integration with label/input spacing |
| `HoverCard` | hover-card.tsx | Rich hover previews for links and references |
| `Input` | input.tsx | Standard text input fields |
| `Label` | label.tsx | Form labels with standardized spacing |
| `Popover` | popover.tsx | Filter dropdowns, date pickers, floating content |
| `Resizable` | resizable.tsx | Draggable panel resizing (detail panel width adjustment) |
| `ScrollArea` | scroll-area.tsx | Scrollable containers with consistent behavior |
| `Select` | select.tsx | Dropdown select inputs |
| `Separator` | separator.tsx | Visual dividers between sections |
| `Sheet` | sheet.tsx | Slide-in panels (loan detail, contact detail, deal drawer) |
| `Skeleton` | skeleton.tsx | Loading state placeholders |
| `Sonner` | sonner.tsx | Toast notifications (alternative to toast.tsx) |
| `Switch` | switch.tsx | Toggle switches for settings, feature flags |
| `Table` | table.tsx | Data tables with consistent cell padding |
| `Tabs` | tabs.tsx | Tab navigation on detail pages |
| `Textarea` | textarea.tsx | Multi-line text input (notes, descriptions) |
| `Toast` | toast.tsx, toaster.tsx, use-toast.ts | Transient feedback notifications |
| `Tooltip` | tooltip.tsx | Icon button tooltips, truncated text hover |
| **Charts** | charts/ | Chart primitives (Recharts wrappers) |
| **ClickToCallNumber** | ClickToCallNumber.tsx | Custom phone number click-to-call |

## Usage Rules

1. **ALWAYS use shadcn components over raw HTML/divs** when a shadcn component exists for that pattern.
2. **Never hand-roll** cards, tabs, inputs, textareas, dialogs, sheets, or toasts — use the installed shadcn component.
3. **Card + CardHeader + CardContent** enforces padding — never use a raw div with `rounded-xl` and manual padding when Card exists.
4. **Sheet** is the standard for all slide-in panels — never use a positioned div with transform animation.
5. **Separator** is the standard for all visual dividers — never use `border-b` or `<hr>` directly.
6. **Tabs + TabsContent** enforces tab content padding — never put tab content in a raw div below a custom tab bar.
7. **ScrollArea** for any scrollable container — never use `overflow-auto` on a raw div.
8. **Checkbox** for all checkboxes — never use raw `<input type="checkbox">`.
9. **Switch** for all toggles — never use a custom toggle div.
10. **Breadcrumb** for all breadcrumb navigation — never hand-roll breadcrumb links.

## When to Add New Components

If you need a UI pattern and there's a shadcn component for it, install it:
```bash
npx shadcn@latest add [component-name]
```
Check available components: https://ui.shadcn.com/docs/components
