# Requity Group — Master Design System v2

This replaces all previous design references including "Cinematic Institutional", navy-gold, and any serif-based UI patterns. If it looks like Goldman Sachs or a hedge fund lobby, it's wrong. If it looks like Ramp, Robinhood, or AppFolio — you're on the right track.

## Design Philosophy

Requity Group is a $150M+ vertically integrated real estate investment and lending company scaling toward $1B+. The UI must communicate competence, speed, and clarity — not luxury. Our tools should feel like the best fintech products on the market: addictive to use, fast, clean, and dense with useful information.

**Reference products (in priority order):**

1. **Ramp** — Clean white space, functional density, sharp typography
2. **Robinhood** — Crisp dark mode, satisfying micro-interactions, monochrome with pops of color
3. **AppFolio** — Property management context, organizational clarity, data tables done right
4. **Slack** — Channel organization, notification patterns, online indicators

**The Prime Directive:** If it looks like a SaaS template, a navy-gradient fintech mockup, or anything with serif headings and gold accents — it's wrong. Requity's UI should feel like it was built by a team that ships fast and respects their users' time.

---

## Dual Theme System

Every screen must support both light and dark mode with a user-togglable switch. Dark mode is not an afterthought — it's a first-class experience.

### Light Mode Tokens

#### Background

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#FFFFFF` | Main background |
| `bgSecondary` | `#F7F7F8` | Sidebar, panels, secondary surfaces |
| `bgTertiary` | `#EFEFEF` | Inputs, filter bars, cards, segmented controls |
| `bgHover` | `#F0F0F2` | Hover states |
| `bgActive` | `#E8E8EC` | Active/pressed states |
| `bgCard` | `#FFFFFF` | Card backgrounds |

#### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `border` | `rgba(0,0,0,0.08)` | Standard dividers, card borders |
| `borderLight` | `rgba(0,0,0,0.04)` | Subtle separators, table row borders |
| `borderFocus` | `rgba(0,0,0,0.16)` | Input focus borders |

#### Text

| Token | Value | Usage |
|-------|-------|-------|
| `text` | `#1A1A1A` | Primary text, headings |
| `textSecondary` | `#6B6B6B` | Subtitles, metadata, secondary labels |
| `textTertiary` | `#999999` | Placeholders, timestamps, disabled labels |
| `textMuted` | `#BFBFBF` | Disabled text, inactive elements |

#### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#1A8754` | Funded, approved, active, occupancy ≥93% |
| `successSoft` | `rgba(26,135,84,0.08)` | Success backgrounds |
| `warning` | `#CC7A00` | Pending, in review, days-in-stage alerts |
| `warningSoft` | `rgba(204,122,0,0.08)` | Warning backgrounds |
| `danger` | `#D42620` | Overdue, rejected, critical alerts |
| `dangerSoft` | `rgba(212,38,32,0.08)` | Danger backgrounds |
| `blue` | `#2563EB` | Informational, due diligence, links |
| `blueSoft` | `rgba(37,99,235,0.06)` | Blue backgrounds |
| `gold` | `#B8860B` | Financial accent (used sparingly) |
| `goldSoft` | `rgba(184,134,11,0.08)` | Gold backgrounds |

#### Interactive

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#1A1A1A` | Primary buttons, active nav |
| `accentSoft` | `rgba(26,26,26,0.06)` | Soft button backgrounds |
| `accentHover` | `rgba(26,26,26,0.1)` | Soft button hover |

#### Surfaces

| Token | Value |
|-------|-------|
| `shadow` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` |
| `shadowHover` | `0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| `shadowFloat` | `0 8px 24px rgba(0,0,0,0.08)` |
| `headerBlur` | `rgba(255,255,255,0.88)` |

#### Charts

| Token | Value |
|-------|-------|
| `chartLine` | `#1A1A1A` |
| `chartFill` | `rgba(26,26,26,0.06)` |
| `chartGrid` | `rgba(0,0,0,0.04)` |
| `tooltipBg` | `#1A1A1A` |
| `tooltipText` | `#FFFFFF` |

#### Chat Bubbles

| Token | Value | Usage |
|-------|-------|-------|
| `ownBubble` | `#1A1A1A` | Current user's messages |
| `ownBubbleText` | `#FFFFFF` | |
| `otherBubble` | `#F0F0F2` | Other users' messages |
| `otherBubbleText` | `#1A1A1A` | |

---

### Dark Mode Tokens

#### Background

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0C0C0C` | Main background (true black, NOT navy) |
| `bgSecondary` | `#141414` | Sidebar, panels |
| `bgTertiary` | `#1C1C1C` | Inputs, filter bars, cards |
| `bgHover` | `#1E1E1E` | Hover states |
| `bgActive` | `#262626` | Active/pressed states |
| `bgCard` | `#161616` | Card backgrounds |

#### Borders

| Token | Value |
|-------|-------|
| `border` | `rgba(255,255,255,0.07)` |
| `borderLight` | `rgba(255,255,255,0.04)` |
| `borderFocus` | `rgba(255,255,255,0.16)` |

#### Text

| Token | Value | Usage |
|-------|-------|-------|
| `text` | `#F0F0F0` | Primary text |
| `textSecondary` | `#888888` | Subtitles, metadata |
| `textTertiary` | `#606060` | Placeholders, timestamps |
| `textMuted` | `#404040` | Disabled, inactive |

#### Semantic Colors

| Token | Value |
|-------|-------|
| `success` | `#34C77B` |
| `successSoft` | `rgba(52,199,123,0.1)` |
| `warning` | `#F0A030` |
| `warningSoft` | `rgba(240,160,48,0.1)` |
| `danger` | `#EF4444` |
| `dangerSoft` | `rgba(239,68,68,0.1)` |
| `blue` | `#3B82F6` |
| `blueSoft` | `rgba(59,130,246,0.1)` |
| `gold` | `#D4A84B` |
| `goldSoft` | `rgba(212,168,75,0.1)` |

#### Interactive

| Token | Value |
|-------|-------|
| `accent` | `#F0F0F0` |
| `accentSoft` | `rgba(240,240,240,0.06)` |
| `accentHover` | `rgba(240,240,240,0.1)` |

#### Surfaces

| Token | Value |
|-------|-------|
| `shadow` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` |
| `shadowHover` | `0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)` |
| `shadowFloat` | `0 8px 24px rgba(0,0,0,0.5)` |
| `headerBlur` | `rgba(12,12,12,0.88)` |

#### Charts

| Token | Value |
|-------|-------|
| `chartLine` | `#F0F0F0` |
| `chartFill` | `rgba(240,240,240,0.06)` |
| `chartGrid` | `rgba(255,255,255,0.04)` |
| `tooltipBg` | `#2A2A2A` |
| `tooltipText` | `#F0F0F0` |

#### Chat Bubbles

| Token | Value |
|-------|-------|
| `ownBubble` | `#2A2A2A` |
| `ownBubbleText` | `#F0F0F0` |
| `otherBubble` | `#1A1A1A` |
| `otherBubbleText` | `#E0E0E0` |

---

### Universal Tokens (Both Modes)

#### Notifications

| Token | Value | Notes |
|-------|-------|-------|
| `badge` | `#F0719B` | Unread count pill background |
| `badgeText` | `#000000` (dark) / `#FFFFFF` (light) | Adapts to mode |
| `badgeRadius` | `20px` | Pill-shaped |
| `badgePadding` | `0 7px` | |
| `badgeHeight` | `17px` | |

#### Online Indicators (Slack-style)

| Token | Value | Notes |
|-------|-------|-------|
| `onlineDot` | `#2BAC76` | Green, only shown for online/active users |
| `dotSize` | `12px` | In channel/contact lists |
| `dotBorder` | `2px solid [surrounding background color]` | |
| `dotPosition` | `bottom: -8, right: -3` | Relative to avatar |

---

## Typography

### Font Families

| Purpose | Font | Weights |
|---------|------|---------|
| Primary (all UI) | Inter | 400, 500, 600, 700, 800 |
| Monospace (data) | JetBrains Mono | 400, 500, 600, 700 |

**Google Fonts imports:**
```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap
https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap
```

### Usage Rules

| Context | Font | Weight | Size |
|---------|------|--------|------|
| Page headings | Inter | 700 | 24px, tracking -0.04em |
| Section headings | Inter | 600 | 13-16px |
| Body text | Inter | 400-500 | 13-14px |
| Labels / uppercase | Inter | 600 | 10-11px, uppercase, tracking 0.05em |
| Buttons | Inter | 600 | 12-13px |
| Nav items | Inter | 500 (inactive), 600 (active) | 13px |
| Dollar amounts | JetBrains Mono | 600-700 | Varies (12-28px) |
| Percentages | JetBrains Mono | 600 | Varies |
| Timestamps | JetBrains Mono | 400 | 10-11px |
| Table numeric cells | JetBrains Mono | 500-600 | 12-13px |
| Chart axes/tooltips | JetBrains Mono | 400-500 | 11px |
| File sizes | JetBrains Mono | 400 | 11px |

### Banned Fonts

- Cormorant Garamond (or ANY serif font)
- Source Sans 3
- Roboto, Poppins, Arial
- Any system-default font as the visible font

---

## Avatars

Rounded squares with colorful backgrounds and white initials.

| Property | Value |
|----------|-------|
| Border-radius | 28% of size (e.g., 36px avatar → ~10px radius) |
| Colors | Cycle based on first character of initials: `["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#14B8A6"]` |
| Initials | 2 characters max, white (`#FFFFFF`), Inter 600, fontSize: 34% of avatar size |
| Border | None |
| Shadow | None |

### Standard Sizes

| Context | Size |
|---------|------|
| Sidebar channel list | 36px |
| Chat message | 30px |
| Top bar / user menu | 28-30px |
| Details panel header | 52px |
| Detail panel member list | 26px |

---

## Sidebar Navigation

**Width:** 220px, fixed. **Background:** bgSecondary. **Right border:** border.

### Brand Area

- Padding: `18px 16px`
- 28×28px square, text color background, white "R" (Inter 800, 13px)
- "Requity" wordmark: Inter 700, 15px, -0.03em tracking

### Nav Items

**Top group (main navigation):**

| Icon | Label |
|------|-------|
| Home | Dashboard |
| Users | CRM |
| Building2 | Originations |
| BarChart3 | DSCR Pricing |
| CreditCard | Servicing |
| Briefcase | Investments |
| FileText | Documents |
| Layers | Operations |

**Bottom group (pinned to bottom via flex justify-content: space-between):**

| Icon | Label | Badge |
|------|-------|-------|
| MessageSquare | Messages | Pink pill when unread |
| HelpCircle | Knowledge Base | — |
| Settings | Control Center | — |

### Nav Item Styling

| Property | Value |
|----------|-------|
| Padding | `9px 12px` |
| Border-radius | `8px` |
| Icon | 18px, strokeWidth 1.5 |
| Label | Inter 13px |
| Gap | 10px between icon and label |
| Active | background: sidebarActive, text: text, font-weight 600 |
| Inactive | background: transparent, text: textSecondary, font-weight 500 |
| Hover | background: bgHover |

> Do NOT add, remove, or reorder these nav items. They match the existing portal and must stay consistent.

### User Footer

- Top border separator
- Avatar (28px) + Name (12px, 600) + Role label (11px, textTertiary)

---

## Component Patterns

### Cards

| Property | Value |
|----------|-------|
| Background | bgCard |
| Border | 1px solid border |
| Border-radius | 12px |
| Shadow | shadow |
| Padding | 18-20px |
| Hover | shadowHover + translateY(-1px) (when clickable) |
| Transition | all 0.2s |

### Metric Cards

| Element | Style |
|---------|-------|
| Label | 11px, uppercase, 0.05em tracking, textTertiary |
| Value | JetBrains Mono 700, 22-28px, -0.04em tracking |
| Change badge | 12px, Inter 600, green/red + ArrowUpRight/ArrowDownRight icon |
| Subtitle | 11px, textMuted |

### Data Tables

| Element | Style |
|---------|-------|
| Header row | bgSecondary background |
| Header text | 11px, uppercase, 0.05em tracking, textTertiary, Inter 600 |
| Row padding | 10-12px horizontal |
| Row borders | 1px solid borderLight |
| Row hover | bgHover background |
| Numeric cells | JetBrains Mono, right-aligned |
| Status cells | Stage pills (see below) |

### Stage Pills

**Border-radius:** 6px | **Padding:** 2px 8px | **Font:** 11px, Inter 600

| Stage | Background | Text |
|-------|------------|------|
| Lead | accentSoft | textSecondary |
| Application | blueSoft | blue |
| Underwriting | warningSoft | warning |
| Approval | goldSoft | gold |
| Closing | goldSoft | gold |
| Funded | successSoft | success |
| Due Diligence | blueSoft | blue |
| Overdue | dangerSoft | danger |
| Rejected | dangerSoft | danger |
| Closed | accentSoft | textTertiary |

### Buttons

#### Primary

| Property | Value |
|----------|-------|
| Background | text (black in light, white in dark) |
| Text | bg (inverted) |
| Font | Inter 600, 12px |
| Padding | 5px 10px (small), 8px 16px (medium), 12px 24px (large) |
| Border-radius | 6-8px |
| Shadow | none |
| Hover | slight opacity change or scale(1.02) |

#### Secondary / Soft

| Property | Value |
|----------|-------|
| Background | accentSoft |
| Text | textSecondary |
| Hover | accentHover |
| Same font/padding as primary | |

#### Ghost / Text

| Property | Value |
|----------|-------|
| Background | transparent |
| Text | textSecondary |
| Hover | bgHover background |
| No border | |

### Inputs

| Property | Value |
|----------|-------|
| Background | bgTertiary |
| Border | 1px solid borderLight |
| Border-radius | 8px |
| Padding | 8px 10px (with icon: 8px 10px 8px 32px) |
| Font | Inter 13px |
| Focus | borderColor → borderFocus, optional subtle box-shadow ring |
| Placeholder | textTertiary |

#### Search Inputs

- Search icon (14px) positioned inside left padding
- On focus: border darkens, optionally expand width

### Notification Badges (Unread Counts)

| Property | Value |
|----------|-------|
| Background | `#F0719B` |
| Text | `#000000` (dark mode), `#FFFFFF` (light mode) |
| Font | Inter 700, 10px |
| Height | 17px |
| Min-width | 20px |
| Border-radius | 20px (pill shape) |
| Padding | 0 7px |

### Online Status Dots

| Property | Value |
|----------|-------|
| Color | `#2BAC76` (only for online/active — no dot for offline) |
| Size | 12px (in lists), 10px (in detail views) |
| Border | 2px solid [surrounding background color] |
| Position | Absolute, bottom: -8, right: -3 relative to avatar |

---

## Charts (Recharts)

### Area Charts

| Element | Style |
|---------|-------|
| Stroke | chartLine, 2px |
| Fill | linearGradient from chartLine at 8% opacity → 0% |
| Dots | None on line; activeDot on hover (r=4, fill chartLine, stroke bg, strokeWidth 2) |
| Grid | Horizontal dashed lines only, chartGrid color |
| Axes | 11px, textTertiary, no axis lines, no tick lines |
| Y-axis values | JetBrains Mono |

### Bar Charts

| Element | Style |
|---------|-------|
| Fill | text color at 85% opacity |
| Bar size | 28px |
| Radius | [4, 4, 0, 0] (rounded top only) |
| Grid/axis/tooltip | Same as area charts |

### Tooltips

| Property | Value |
|----------|-------|
| Background | tooltipBg |
| Text | tooltipText, JetBrains Mono 600 |
| Border | 1px solid border |
| Border-radius | 8px |
| Shadow | shadowFloat |

---

## Animations

```css
/* Staggered page load — primary animation */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade in for overlays, tooltips */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in for panels */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Message appearance */
@keyframes msgIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Typing indicator dots */
@keyframes dotBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-3px); }
}
```

### Timing

- Page sections: stagger with 50-60ms increments (0s, 0.05s, 0.11s, 0.17s...)
- Hover transitions: 150ms
- Card hover elevation: 200ms
- Theme toggle: 300ms on background/color transitions
- Panel slide-in: 250ms ease

### Rules

- No bounce
- No overshoot
- No playful easing
- Everything smooth and deliberate
- `cubic-bezier(0.4, 0, 0.2, 1)` for custom easings

---

## Anti-Patterns (Hard Bans)

### Visual

1. Navy blue backgrounds (`#0A1628`, `#0F2140`, etc.) — use charcoal/black
2. Gold glow effects, gold gradients, gold borders
3. Serif fonts anywhere (Cormorant Garamond, Georgia, etc.)
4. Source Sans 3
5. Purple-to-blue gradients
6. Pure white `#FFFFFF` as text color — use `#F0F0F0` in dark mode
7. Card borders thicker than 1px
8. Stock photography
9. Bounce/overshoot animations
10. Emoji in UI (icons only — Lucide)

### UX

1. Dead-end states — every screen needs a clear next action
2. Raw database values shown to users
3. Forms longer than 5 fields without stepping
4. Loading spinners without context labels
5. Tables without empty states
6. Generic error messages ("Something went wrong")
7. Tooltips as the only access to important info
8. Modals for non-destructive confirmations

---

## Responsive Breakpoints

| Breakpoint | Sidebar | Grid | Notes |
|------------|---------|------|-------|
| ≥1200px | Full 220px | 4 cols | Full layout |
| 1024–1199 | Collapsed 64px (icons only) | 3 cols | |
| 768–1023 | Hidden + hamburger | 2 cols | Charts/tables stack |
| <768 | Hidden + hamburger | 1 col | Everything stacks |

Tables: horizontal scroll with sticky first column below 1024px.

---

## Accessibility

- **Focus states:** `box-shadow: 0 0 0 3px` using borderFocus at 30% opacity
- **Contrast:** minimum 4.5:1 body text, 3:1 large text
- `aria-label` on all icon-only buttons
- Keyboard navigation for all interactive elements
- `prefers-reduced-motion`: disable all animations

---

## File & Implementation Notes

- **Icon library:** Lucide React — strokeWidth 1.5 default, 18px nav, 14-16px inline
- **Chart library:** Recharts
- **CSS approach:** Inline styles with theme object for React artifacts. CSS variables for production builds.
- **State:** React useState for theme toggle. Persist theme preference to localStorage in production.
- **Backend:** Supabase (auth, database, storage, realtime)
- **Fonts:** Google Fonts CDN
