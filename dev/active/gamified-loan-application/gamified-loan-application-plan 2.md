# Gamified Loan Application - Implementation Plan

## Objective
Rebuild the /lending/apply page as a full-viewport, one-question-at-a-time experience that feels fast, addictive, and effortless. The form visible above the fold from the first moment.

## Scope
- IN: Complete UI rewrite of apply page presentation layer. Full-viewport screens, slide transitions, progress bar, auto-advance, animated number reveals, success animation.
- OUT: API route (untouched), pricing logic (untouched), @repo/lib exports (untouched). All backend behavior stays identical.

## Approach

### Screen Flow (6 screens)
1. **Asset Class** - Full viewport. Clickable cards for each loan type. Click = auto-advance. No Residential/Commercial split needed since cards are already labeled clearly.
2. **Property Address** - Single Google Places input, centered, large. Auto-advance on place selection.
3. **Deal Sizing** - Purchase price, rehab budget (if applicable), loan amount slider with real-time LTC/LTV/equity metrics. Timeline dropdown. ARV if auto-priced.
4. **Borrower Profile** - (Only for auto-priced loans) Credit score, deals in 24 months, citizenship. Pill-button selectors, not dropdowns.
5. **Generated Terms** - (Only for auto-priced loans) Animated number reveals. Term selector for commercial. OR "Custom terms" placeholder for non-auto-priced.
6. **Contact Info** - Name, email, phone, company. Big submit button. Experience level for non-auto-priced.

### Progress System
- Thin gold bar at very top of viewport (position: fixed)
- Fills from left to right based on current screen / total screens
- Percentage text in top-right corner
- Pulses gold briefly when hitting 100%

### Transitions
- Screens slide horizontally: outgoing slides left, incoming slides in from right
- Going back reverses direction
- 350ms duration with ease-out
- Keyboard support: Enter to advance, Escape to go back

### Auto-Advance Behavior
- Screen 1: Click loan type card → auto-advance to Screen 2
- Screen 2: Select Google Places address → auto-advance to Screen 3
- All other screens: Explicit "Continue" button (but Enter key also works)

### Success State
- Full-screen dark zone with animated checkmark
- Deal summary card with count-up animations on numbers
- Confetti-style particle effect (subtle, gold-tinted)

## Files to Modify
- `apps/requity-group/app/lending/apply/page.tsx` - Complete UI rewrite (preserve all form state, validation, submission logic)
- `apps/requity-group/app/globals/public.css` - New styles for full-viewport screens, transitions, progress bar

## Files NOT Modified
- `apps/requity-group/app/api/loan-request/route.ts` - Untouched
- `@repo/lib` - All exports untouched

## Risks
- Google Places autocomplete needs careful handling during screen transitions (already solved in current code)
- Auto-pricing logic timing must be preserved (calculate terms before advancing past deal details)
- Mobile viewport handling needs testing (100vh can be tricky on iOS with address bar)

## Success Criteria
- Form visible above the fold immediately on page load (no scrolling to start)
- Each screen transition < 400ms
- All existing form fields and validation preserved
- API submission payload identical to current
- Mobile responsive (all screens usable on phone)
- Keyboard navigable (Enter, Escape, arrow keys)
