# Requity Group — Design System v3 (shadcn/ui)

This is the single source of truth for the Requity Group Portal's visual design. It reflects the **actual implementation** built on [shadcn/ui](https://ui.shadcn.com) (new-york style, neutral base color) with Tailwind CSS.

**Previous versions (v1 "Cinematic Institutional", v2 custom token system) are retired.** This document matches what ships in `globals.css`, `tailwind.config.ts`, `components.json`, and `components/ui/`.

---

## Design Philosophy

Requity Group is a $150M+ vertically integrated real estate investment and lending company. The UI communicates competence, speed, and clarity — not luxury.

**Reference products:** Ramp, Robinhood, AppFolio, Slack.

**Prime Directive:** If it looks like a SaaS template, a navy-gradient fintech mockup, or anything with serif headings and gold accents — it's wrong.

---

## Foundation: shadcn/ui

### Configuration (`components.json`)

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### UI Components

All primitives live in `components/ui/` and are standard shadcn components (Radix UI + CVA + `cn()`):

| Component | File | Notes |
|-----------|------|-------|
| Button | `button.tsx` | Variants: default, destructive, outline, secondary, ghost, link |
| Card | `card.tsx` | Standard with rounded-lg, shadow-sm |
| Badge | `badge.tsx` | Extended with `success`, `warning`, `info` variants |
| Input | `input.tsx` | Standard shadcn |
| Table | `table.tsx` | Standard shadcn |
| Dialog | `dialog.tsx` | Standard shadcn |
| DropdownMenu | `dropdown-menu.tsx` | Standard shadcn |
| Select | `select.tsx` | Standard shadcn |
| Tabs | `tabs.tsx` | Standard shadcn |
| Tooltip | `tooltip.tsx` | Standard shadcn |
| Sheet | `sheet.tsx` | Standard shadcn |
| Form | `form.tsx` | React Hook Form + Zod integration |
| Toast/Toaster | `toast.tsx`, `toaster.tsx` | Standard shadcn |
| Popover | `popover.tsx` | Standard shadcn |
| Command | `command.tsx` | Standard shadcn (cmdk) |
| AlertDialog | `alert-dialog.tsx` | Standard shadcn |
| ScrollArea | `scroll-area.tsx` | Standard shadcn |
| Separator | `separator.tsx` | Standard shadcn |
| Skeleton | `skeleton.tsx` | Standard shadcn |
| Label | `label.tsx` | Standard shadcn |
| HoverCard | `hover-card.tsx` | Standard shadcn |
| Avatar | `avatar.tsx` | Standard shadcn |
| Collapsible | `collapsible.tsx` | Standard shadcn |
| Textarea | `textarea.tsx` | Standard shadcn |

**Rule:** Always prefer composing existing shadcn primitives. Only create custom components when shadcn doesn't cover the pattern.

---

## Dual Theme System

Every screen supports light and dark mode via a user toggle. Dark mode is first-class.

### Theme Provider

Custom `ThemeProvider` in `components/theme-provider.tsx`:
- Toggles `.dark` class on `<html>` element
- Persists to `localStorage`
- Falls back to `prefers-color-scheme`
- `darkMode: ["class"]` in Tailwind config

### CSS Variables (HSL format)

All color tokens use shadcn's HSL convention: `H S% L%` (no `hsl()` wrapper). Applied via `hsl(var(--token))` in Tailwind config.

#### Light Mode (`:root`)

| Token | HSL Value | Approx Hex | Usage |
|-------|-----------|------------|-------|
| `--background` | `0 0% 100%` | `#FFFFFF` | Main background |
| `--foreground` | `0 0% 10%` | `#1A1A1A` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `0 0% 10%` | `#1A1A1A` | Card text |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popover backgrounds |
| `--popover-foreground` | `0 0% 10%` | `#1A1A1A` | Popover text |
| `--primary` | `0 0% 10%` | `#1A1A1A` | Primary buttons, active elements |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Primary button text |
| `--secondary` | `240 5% 97%` | `#F7F7F8` | Secondary surfaces |
| `--secondary-foreground` | `0 0% 10%` | `#1A1A1A` | Secondary text |
| `--muted` | `240 5% 97%` | `#F7F7F8` | Muted backgrounds |
| `--muted-foreground` | `0 0% 42%` | `#6B6B6B` | Muted text, labels |
| `--accent` | `240 5% 97%` | `#F7F7F8` | Accent backgrounds |
| `--accent-foreground` | `0 0% 10%` | `#1A1A1A` | Accent text |
| `--destructive` | `4 78% 57%` | `#E54D42` | Destructive actions |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Destructive text |
| `--border` | `240 6% 90%` | `#E4E4E7` | Borders, dividers |
| `--input` | `240 6% 90%` | `#E4E4E7` | Input borders |
| `--ring` | `0 0% 10%` | `#1A1A1A` | Focus rings |
| `--radius` | `0.5rem` | — | Base border radius |

#### Dark Mode (`.dark`)

| Token | HSL Value | Approx Hex | Usage |
|-------|-----------|------------|-------|
| `--background` | `0 0% 5%` | `#0D0D0D` | Main bg (true black/charcoal, NOT navy) |
| `--foreground` | `0 0% 96%` | `#F5F5F5` | Primary text |
| `--card` | `0 0% 9%` | `#171717` | Card backgrounds |
| `--card-foreground` | `0 0% 96%` | `#F5F5F5` | Card text |
| `--popover` | `0 0% 9%` | `#171717` | Popover backgrounds |
| `--popover-foreground` | `0 0% 96%` | `#F5F5F5` | Popover text |
| `--primary` | `0 0% 85%` | `#D9D9D9` | Primary buttons |
| `--primary-foreground` | `0 0% 5%` | `#0D0D0D` | Primary button text |
| `--secondary` | `0 0% 12%` | `#1F1F1F` | Secondary surfaces |
| `--secondary-foreground` | `0 0% 96%` | `#F5F5F5` | Secondary text |
| `--muted` | `0 0% 12%` | `#1F1F1F` | Muted backgrounds |
| `--muted-foreground` | `0 0% 54%` | `#8A8A8A` | Muted text |
| `--accent` | `0 0% 12%` | `#1F1F1F` | Accent backgrounds |
| `--accent-foreground` | `0 0% 96%` | `#F5F5F5` | Accent text |
| `--destructive` | `4 78% 57%` | `#E54D42` | Destructive (same both modes) |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Destructive text |
| `--border` | `0 0% 16%` | `#292929` | Borders |
| `--input` | `0 0% 16%` | `#292929` | Input borders |
| `--ring` | `0 0% 96%` | `#F5F5F5` | Focus rings |

#### Sidebar Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-bg` | `240 5% 97%` | `0 0% 8%` |
| `--sidebar-fg` | `0 0% 10%` | `0 0% 94%` |
| `--sidebar-border` | `240 6% 90%` | `0 0% 16%` |
| `--sidebar-active` | `0 0% 0% / 0.06` | `0 0% 100% / 0.12` |
| `--sidebar-hover` | `0 0% 0% / 0.04` | `0 0% 100% / 0.07` |

#### Dashboard Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--dash-bg` | `0 0% 97%` | `0 0% 5%` |
| `--dash-surface` | `0 0% 100%` | `0 0% 10%` |
| `--dash-surface-alt` | `0 0% 97%` | `0 0% 13%` |
| `--dash-surface-hover` | `0 0% 95%` | `0 0% 16%` |
| `--dash-text-sec` | `0 0% 42%` | `0 0% 90%` |
| `--dash-text-mut` | `0 0% 60%` | `0 0% 53%` |
| `--dash-text-faint` | `0 0% 70%` | `0 0% 38%` |

Plus hardcoded dashboard semantic colors:
- `dash-success`: `#1B7A44`
- `dash-warning`: `#B8822A`
- `dash-danger`: `#B23225`
- `dash-info`: `#2E6EA6`

---

## Custom Tailwind Extensions

Defined in `tailwind.config.ts` beyond standard shadcn:

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `sidebar.*` | CSS vars | Sidebar bg, fg, border, active, hover |
| `dash.*` | CSS vars + hardcoded | Dashboard-specific surfaces and text |
| `gold.DEFAULT` | `#C5975B` | Financial accent (used sparingly) |
| `gold.light` | `#D4AD72` | Gold lighter variant |
| `gold.pale` | `#E8D5B0` | Gold pale variant |
| `badge.pink` | `#F0719B` | Notification unread count pill |

### Animations

| Name | CSS | Usage |
|------|-----|-------|
| `fade-up` | translateY(6px) + opacity | Page section entrance |
| `scale-in` | scale(0.8) + opacity | Modal/popover entrance |
| `accordion-down/up` | Radix height | Accordion expand/collapse |

### Plugins

- `tailwindcss-animate` — shadcn animation utilities
- Custom `tabular-nums` utility — `font-variant-numeric: tabular-nums`

---

## Typography

### Font Families

| Purpose | Font | Tailwind Class | Loaded Via |
|---------|------|----------------|------------|
| All UI | Inter | `font-sans` | Google Fonts CDN in `app/layout.tsx` |
| Monospace / numeric data | JetBrains Mono | `font-mono` | Google Fonts CDN in `app/layout.tsx` |

Weights loaded: Inter 300-700, JetBrains Mono 400-700.

### The `.num` Rule

Any element rendering a **number, currency, percentage, date, or timestamp** must use the `num` CSS class. This uses Inter with tabular figures (not JetBrains Mono) for consistent column alignment.

```css
.num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  letter-spacing: -0.025em;
}
```

Use `font-mono` (JetBrains Mono) only for code blocks, technical displays, or when explicitly specified in a component. For financial data in tables, KPI cards, and badges, prefer `.num` on Inter.

### Usage Patterns (as implemented)

| Context | Classes | Example |
|---------|---------|---------|
| Page heading | `text-xl md:text-2xl font-bold tracking-[-0.04em] text-foreground` | PageHeader |
| KPI label | `text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground` | KpiCard |
| KPI value | `num text-[22px] md:text-[26px] font-bold tracking-tight text-foreground` | KpiCard |
| KPI description | `text-[11px] text-muted-foreground` | KpiCard |
| Nav items | `text-[13px] font-medium` (inactive) / `font-semibold` (active) | Sidebar |
| Brand wordmark | `text-[15px] font-bold tracking-[-0.03em]` | Sidebar |
| Table header | `h-12 px-4 font-medium text-muted-foreground` | shadcn Table |
| Status badge | `text-xs font-medium` | StatusBadge |

### Chart Typography

Recharts axis labels use the `NumericTick` component (`components/ui/charts/numeric-tick.tsx`):

```tsx
<text
  fill="hsl(var(--muted-foreground))"
  fontSize={11}
  fontFamily="Inter, sans-serif"
  style={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}
>
```

### Banned Fonts

- Any serif font (Cormorant Garamond, Georgia, etc.)
- Source Sans 3
- Roboto, Poppins, Arial as primary

---

## Shared Components

### PageHeader (`components/shared/page-header.tsx`)

Standard page title + optional description + optional action button.

### KpiCard (`components/shared/kpi-card.tsx`)

Uses shadcn `Card` with custom padding. Label is uppercase 11px, value uses `.num` class.

### StatusBadge (`components/shared/status-badge.tsx`)

Uses shadcn `Badge` (outline variant) with a colored dot indicator. Status-to-color mapping covers all loan stages, draw statuses, fund statuses, CRM statuses, etc. Colors use Tailwind's standard palette (green-500, blue-500, etc.) not custom tokens.

### DataTable (`components/shared/data-table.tsx`)

Built on shadcn `Table` with:
- Mobile swipe hint on first use
- Optional `onRowClick` with chevron indicator
- Empty state message
- `bg-card` background with `rounded-md border`

### LoanStageTracker (`components/shared/loan-stage-tracker.tsx`)

Step indicator using numbered circles. Uses `bg-primary`, `bg-green-600` for completed, `border-border` for upcoming.

---

## Sidebar Navigation

**Width:** 220px (collapsed: 64px). **Background:** `bg-sidebar`. **Border:** `border-sidebar-border`.

### Brand Area
- 28x28px square with `bg-foreground`, white "R" (Inter extrabold 13px)
- "Requity" wordmark: 15px bold, -0.03em tracking

### Nav Item Styling

| Property | Value |
|----------|-------|
| Padding | `px-3 py-[9px]` |
| Border-radius | `rounded-lg` |
| Icon | 18px, strokeWidth 1.5 |
| Label | 13px Inter |
| Gap | 2.5 (gap-2.5) |
| Active | `bg-sidebar-active text-sidebar-foreground font-semibold` |
| Inactive | `text-sidebar-foreground/60 hover:bg-sidebar-hover font-medium` |

### Nav Groups (Collapsible)

CRM and Pipeline use `Collapsible` from shadcn with child items indented at `pl-7`, `text-[12px]`.

### Admin Nav Items

Dashboard, CRM (Contacts/Companies), Pipeline (Debt/Equity), DSCR Pricing, Servicing, Investments, Documents, Operations, Power Dialer

### Bottom Nav Items

Chatter (with unread badge), Knowledge Base, Control Center (super admin only)

### Notification Badge

Pink pill (`#F0719B`) with white text, 10px bold, 17px height, pill-shaped (`rounded-full`), `min-w-[20px] px-[7px]`.

---

## Topbar

- Sticky, `h-14 md:h-16`, `border-b bg-card`
- Mobile: hamburger + centered logo
- Desktop: left impersonation indicator, center CommandSearch, right actions
- Theme toggle: Sun/Moon icons via `useTheme()`
- User avatar: 32px rounded-lg, `bg-primary` fallback with initials
- Dropdown: shadcn DropdownMenu with account options

---

## Dark Mode Utility Overrides

`globals.css` includes overrides for common Tailwind gray classes (slate-50 through slate-900, gray-50 through gray-900) to ensure they map to the monochrome dark theme. These use `!important` to catch any hardcoded gray usage:

- `bg-gray-50/100` -> `hsl(0 0% 11-13%)`
- `bg-gray-200/300` -> `hsl(0 0% 16-20%)`
- `text-gray-500/600` -> `hsl(0 0% 53%)`
- `text-gray-900` -> `hsl(0 0% 94%)`

**Prefer shadcn tokens** (`bg-muted`, `text-muted-foreground`, etc.) over raw Tailwind gray classes.

---

## Animations

### Defined Keyframes

| Name | Effect | Usage |
|------|--------|-------|
| `fade-up` | translateY(6px) + opacity | Page sections |
| `scale-in` | scale(0.8) + opacity | Modals, popovers |
| `skeleton-shimmer` | Horizontal gradient sweep | Loading skeletons |
| `slide-up-sheet` / `slide-down-sheet` | translateY(100%) | Mobile bottom sheets |
| `swipe-hint` | translateX(8px) pulse | Table scroll hint |

### Timing Rules

- Hover transitions: `transition-colors` (150ms default)
- Card hover: `transition-all duration-200`
- Sidebar collapse: `transition-all duration-200`
- Theme toggle: 300ms on background/color
- **No bounce, no overshoot, no playful easing**

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
```

---

## Mobile

### Breakpoints

| Width | Sidebar | Layout |
|-------|---------|--------|
| >= 768px (md) | Visible | Desktop layout |
| < 768px | Hidden, hamburger toggle | Mobile bottom nav, stacked layout |

### Mobile Components

- `MobileBottomNav` — fixed bottom navigation
- `MobileSidebar` — slide-over sidebar via sheet
- `MobileLayoutWrapper` — context provider for mobile nav state
- `.mobile-press:active` — scale(0.98) touch feedback
- `.mobile-tap-target` — min 44px touch targets
- `.mobile-scroll` — iOS smooth scrolling, hidden scrollbars
- `.mobile-table-sticky` — sticky first column on tables < 1024px

---

## Icons

- **Library:** Lucide React only
- **Default strokeWidth:** 1.5
- **Nav icons:** 18px (`h-[18px] w-[18px]`)
- **Inline icons:** 14-16px
- **No emoji in UI**

---

## Anti-Patterns (Hard Bans)

### Visual
1. Navy blue backgrounds — use charcoal/black via `--background`
2. Gold glow effects, gold gradients, gold borders (flat gold accent only, sparingly)
3. Serif fonts anywhere
4. Borders thicker than 1px on cards
5. Bounce/overshoot animations
6. Emoji in UI (Lucide icons only)
7. Pure white `#FFFFFF` as text in dark mode — use `--foreground` (`0 0% 96%`)

### UX
1. Dead-end states — every screen needs a clear next action
2. Raw database values shown to users (use `StatusBadge`, `formatCurrency()`, etc.)
3. Forms longer than 5 fields without stepping
4. Loading spinners without context labels
5. Tables without empty states
6. Generic error messages ("Something went wrong")
7. Modals for non-destructive confirmations

### Code
1. Custom hex colors instead of CSS variable tokens — use `bg-background`, `text-foreground`, `bg-card`, etc.
2. Hardcoded gray classes (use shadcn semantic tokens; dark overrides exist as safety net only)
3. Custom token names from v2 (`bgSecondary`, `bgTertiary`, `bgHover`, etc.) — these don't exist in the implementation
4. Inline styles for theming — use Tailwind classes with CSS variables

---

## Accessibility

- **Focus states:** `ring-2 ring-ring ring-offset-2` (shadcn default)
- **Contrast:** minimum 4.5:1 body text, 3:1 large text
- `aria-label` on all icon-only buttons
- Keyboard navigation for all interactive elements
- `prefers-reduced-motion`: all animations disabled

---

## File Reference

| File | Purpose |
|------|---------|
| `app/globals/globals.css` | CSS variables, dark mode overrides, `.num` class, mobile styles |
| `tailwind.config.ts` | shadcn color mappings, fonts, animations, plugins |
| `components.json` | shadcn/ui configuration |
| `components/theme-provider.tsx` | Theme toggle provider (class-based dark mode) |
| `components/ui/` | shadcn primitives |
| `components/shared/` | App-specific shared components (KpiCard, DataTable, etc.) |
| `components/layout/sidebar.tsx` | Main sidebar navigation |
| `components/layout/topbar.tsx` | Top bar with search, theme toggle, user menu |
| `components/ui/charts/numeric-tick.tsx` | Recharts axis tick component |
| `lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `lib/format.ts` | `formatCurrency()`, `formatCurrencyDetailed()` |
| `lib/constants.ts` | Pipeline stages, loan stage labels, business constants |
