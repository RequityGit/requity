# Motion Tokens — Implementation Prompt

## Objective

Define a centralized motion/animation system for RequityOS via CSS custom properties in `globals.css` and corresponding Tailwind utilities. This prevents animation divergence as we add realtime board updates, stage transition animations, panel slides, and micro-interactions. Small foundational effort now; prevents inconsistency across every future animation.

---

## Current State

- **Zero motion library** (no framer-motion, no shared animation config)
- **4 ad-hoc `@keyframes`** in globals.css: `rq-shimmer`, `swipe-hint`, `slide-up-sheet`, `slide-down-sheet`
- **66 files** use Tailwind `transition-colors`, `transition-all`, `transition-opacity`, `duration-*`, or `ease-*` classes directly, each choosing their own duration and easing
- **No consistent duration or easing** across the portal. Some components use `duration-150`, others `duration-200`, `duration-300`, etc.
- **One reduced-motion rule** exists (line 651 in globals.css: `transition-duration: 0.01ms !important`) but it's scoped narrowly

---

## Design Decisions

### Why CSS Custom Properties (Not Framer Motion)

1. **Bundle size:** Zero JS added. CSS handles 90% of portal animations (hover states, reveals, panel opens, fades).
2. **Tailwind integration:** Custom properties can be referenced in `tailwind.config.ts` as `transitionDuration` and `transitionTimingFunction` tokens.
3. **Reduced motion:** One `prefers-reduced-motion` block disables everything. Framer Motion requires per-component handling.
4. **Future-compatible:** If we add framer-motion later for complex orchestrations (realtime board card animations), the tokens still apply as base values.

### The Token Set

Three duration tiers and two easing curves cover every interaction pattern:

| Token | Value | Use Cases |
|-------|-------|-----------|
| `--duration-fast` | `120ms` | Hover states, toggle switches, checkbox ticks, tooltip appears |
| `--duration-normal` | `200ms` | Dropdown opens, card hover-reveal, inline field focus, tab switch |
| `--duration-slow` | `350ms` | Modal/sheet open/close, panel slide, page transitions, stage move animation |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things appearing/entering (decelerate into rest). Modals, dropdowns, panels. |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Things moving position (smooth both ends). Card drags, stage transitions, reorder. |

These are intentionally opinionated. Two curves is enough. Three durations is enough. Fewer choices = more consistency.

---

## Implementation

### Step 1: Add Motion Tokens to `globals.css`

Add to the `:root` block (after `--radius`):

```css
:root {
  /* ... existing color tokens ... */

  --radius: 0.5rem;

  /* ─── Motion tokens ─── */
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

No dark-mode overrides needed. Motion tokens are theme-independent.

### Step 2: Add Global Reduced-Motion Rule

Replace the existing narrow reduced-motion rule (line ~651) with a comprehensive one. Add this at the end of `globals.css`, outside any `@layer`:

```css
/* ─── Reduced motion: respect user preference ─── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is the nuclear option for accessibility. If a user has reduced motion enabled, every animation and transition collapses to effectively instant. No per-component work needed.

### Step 3: Add Tailwind Config Tokens

In `apps/requity-os/tailwind.config.ts`, extend the theme:

```typescript
// Inside theme.extend:
transitionDuration: {
  fast: 'var(--duration-fast)',
  normal: 'var(--duration-normal)',
  slow: 'var(--duration-slow)',
},
transitionTimingFunction: {
  'ease-out-rq': 'var(--ease-out)',
  'ease-in-out-rq': 'var(--ease-in-out)',
},
```

This enables Tailwind classes like:
- `duration-fast` (120ms)
- `duration-normal` (200ms)
- `duration-slow` (350ms)
- `ease-out-rq` (deceleration curve)
- `ease-in-out-rq` (smooth curve)

### Step 4: Add Reusable Transition Utility Classes to `globals.css`

Add these in the `@layer utilities` section:

```css
/* ─── Motion utility classes ─── */

/* Standard transition for hover states (color, background, border changes) */
.rq-transition {
  transition-property: color, background-color, border-color, opacity;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);
}

/* Transition for elements that move or resize (panels, cards, drawers) */
.rq-transition-transform {
  transition-property: transform, opacity;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}

/* Transition for modals, sheets, and full panels */
.rq-transition-panel {
  transition-property: transform, opacity;
  transition-duration: var(--duration-slow);
  transition-timing-function: var(--ease-out);
}

/* Transition for all properties (use sparingly — prefer specific properties) */
.rq-transition-all {
  transition-property: all;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}
```

### Step 5: Update Existing `@keyframes` to Use Tokens

Update the existing keyframe animations in globals.css to reference the new tokens:

```css
/* Update rq-shimmer — keep as-is (infinite loop, has its own timing) */

/* Update slide-up-sheet */
@keyframes slide-up-sheet {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
/* Usage should reference: animation: slide-up-sheet var(--duration-slow) var(--ease-out) */

/* Update slide-down-sheet */
@keyframes slide-down-sheet {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
```

### Step 6: Add Common Animation Keyframes for Future Use

Add these keyframes that will be needed for realtime board, peek panel, and other upcoming features:

```css
/* ─── Reusable keyframes ─── */

/* Fade in (modals, toasts, overlays) */
@keyframes rq-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade out */
@keyframes rq-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide in from right (peek panel, drawers) */
@keyframes rq-slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Slide out to right */
@keyframes rq-slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

/* Scale in (popovers, dropdowns) */
@keyframes rq-scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Pulse once (alert attention, deal alert state) */
@keyframes rq-pulse-once {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 0 4px hsl(var(--primary) / 0.15); }
}

/* ─── Animation utility classes ─── */
.rq-animate-fade-in {
  animation: rq-fade-in var(--duration-normal) var(--ease-out) forwards;
}
.rq-animate-slide-in-right {
  animation: rq-slide-in-right var(--duration-slow) var(--ease-out) forwards;
}
.rq-animate-scale-in {
  animation: rq-scale-in var(--duration-normal) var(--ease-out) forwards;
}
.rq-animate-pulse-once {
  animation: rq-pulse-once var(--duration-slow) var(--ease-in-out) 1;
}
```

### Step 7: Update CLAUDE.md

Add to the Critical Rules section:

```markdown
14. **All animations and transitions use motion tokens from `globals.css`.** Never hardcode `duration-150`, `duration-200`, `duration-300`, or `ease-in`, `ease-out` directly. Use the token-based classes: `duration-fast` (120ms), `duration-normal` (200ms), `duration-slow` (350ms), `ease-out-rq`, `ease-in-out-rq`. For common patterns, use the utility classes: `.rq-transition` (hover states), `.rq-transition-transform` (movement), `.rq-transition-panel` (modals/sheets). Available animation classes: `.rq-animate-fade-in`, `.rq-animate-slide-in-right`, `.rq-animate-scale-in`, `.rq-animate-pulse-once`. All animations respect `prefers-reduced-motion` automatically.
```

Add to the Global CSS Utility Classes table:

| Class | Purpose | Use Instead Of |
|-------|---------|----------------|
| `.rq-transition` | Hover state transitions (color, bg, border, opacity) | `transition-colors duration-150` |
| `.rq-transition-transform` | Movement transitions (transform + opacity) | `transition-all duration-200` |
| `.rq-transition-panel` | Modal/sheet/panel transitions | `transition-all duration-300` |
| `.rq-transition-all` | All-property transition (use sparingly) | `transition-all duration-200 ease-in-out` |
| `.rq-animate-fade-in` | Fade in animation | Custom keyframes |
| `.rq-animate-slide-in-right` | Slide from right (peek panels, drawers) | Custom keyframes |
| `.rq-animate-scale-in` | Scale-up entrance (popovers, dropdowns) | Custom keyframes |
| `.rq-animate-pulse-once` | Single attention pulse (alerts, notifications) | Custom keyframes |

---

## Usage Guide (For Reference in CLAUDE.md or Inline Comments)

### Choosing the Right Duration

```
Fast (120ms)  — Anything the user's finger/cursor is directly touching
               Hover bg change, toggle flip, checkbox tick, tooltip show

Normal (200ms) — UI state changes that need to be noticed
                Dropdown open, tab content swap, card expand, focus ring

Slow (350ms)  — Large surface area changes
               Modal open/close, sheet slide, panel expand, page transition
```

### Choosing the Right Easing

```
ease-out-rq    — DEFAULT for almost everything. Things that appear or enter.
                 Fast start, gentle stop. Feels responsive.

ease-in-out-rq — Things that move from point A to point B.
                 Smooth start and stop. Card drags, reorder animations.
```

### Examples

```tsx
// Hover state on a card (use utility class)
<div className="rq-transition hover:bg-muted/40">

// Or with Tailwind tokens directly
<div className="transition-colors duration-fast ease-out-rq hover:bg-muted/40">

// Panel slide-in
<div className="rq-animate-slide-in-right">

// Custom transition with tokens
<div className="transition-transform duration-slow ease-out-rq">
```

---

## Optional Phase 2: Backfill Existing Components

This is NOT required in the initial implementation. But once the tokens exist, a future sweep can replace ad-hoc Tailwind transition classes with the token-based equivalents. The scope:

- ~66 files currently use `transition-colors`, `transition-all`, etc. with default or hardcoded durations
- Most of these are `transition-colors` on hover states and can be replaced with `.rq-transition`
- This backfill is lower priority than the format library sweep since the visual difference is subtle (120ms vs Tailwind's default 150ms)

---

## Scope

### IN
- CSS custom properties in `globals.css` `:root` block
- Tailwind config extensions for `transitionDuration` and `transitionTimingFunction`
- Utility classes in `globals.css` `@layer utilities`
- Reusable keyframes and animation classes
- Global `prefers-reduced-motion` rule
- CLAUDE.md rule addition + utility class table update

### OUT
- Backfilling existing components (future sweep)
- Installing framer-motion (not needed yet)
- Changing any existing component behavior (tokens are additive)
- Dark mode motion changes (motion is theme-independent)

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/requity-os/app/globals/globals.css` | Add motion tokens to `:root`, utility classes, keyframes, reduced-motion rule |
| `apps/requity-os/tailwind.config.ts` | Extend `transitionDuration` and `transitionTimingFunction` |
| `CLAUDE.md` | Add rule 14 + update utility class table |

**Total: 3 files.** This is a small, contained change with zero risk of breaking anything.

---

## Success Criteria

1. Motion tokens (`--duration-fast`, `--duration-normal`, `--duration-slow`, `--ease-out`, `--ease-in-out`) exist in `:root`
2. Tailwind classes `duration-fast`, `duration-normal`, `duration-slow`, `ease-out-rq`, `ease-in-out-rq` are usable in any component
3. Utility classes `.rq-transition`, `.rq-transition-transform`, `.rq-transition-panel` work correctly
4. Animation classes `.rq-animate-fade-in`, `.rq-animate-slide-in-right`, `.rq-animate-scale-in`, `.rq-animate-pulse-once` work correctly
5. `prefers-reduced-motion` disables all animations globally
6. `pnpm build` passes with zero errors
7. CLAUDE.md documents all new tokens and classes
8. No existing component behavior changes (purely additive)

---

## Why This Matters Now

The realtime pipeline board prompt (already queued) will need:
- Card move animations between columns → `rq-transition-transform` + `ease-in-out-rq`
- New deal card entrance → `rq-animate-fade-in` or `rq-animate-scale-in`
- Alert pulse for stale deals → `rq-animate-pulse-once`
- Peek panel slide → `rq-animate-slide-in-right`

Without tokens, each of those will pick its own duration and easing. With tokens, they're all consistent from day one.
