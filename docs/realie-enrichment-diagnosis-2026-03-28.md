# Realie Enrichment Failure Deep-Dive (2026-03-28)

## Symptom observed
When users click **Enrich Property** in the Property tab, they can receive:

- `Could not enrich property`
- `Failed to send a request to the Edge Function`

This message corresponds to a **transport-level invoke failure** (browser could not complete a usable HTTP exchange with Supabase Functions), not a normal Realie API business error.

---

## What the current flow does

1. Client-side Property tab calls Supabase Edge Function `realie-property-lookup` directly from the browser via `supabase.functions.invoke(...)`.
2. On function error, UI shows the raw message when available.
3. Edge function then loads property data, calls Realie API, enriches fields, and writes DB updates.

Key code points:

- Browser invoke path: `apps/requity-os/components/pipeline/tabs/PropertyTab.tsx`.
- Edge function: `packages/db/supabase/functions/realie-property-lookup/index.ts`.

---

## Findings

### 1) Browser directly invokes Supabase Edge Function
`PropertyTab` invokes `realie-property-lookup` from the browser and surfaces invoke errors directly. This means network/CORS/auth-gateway failures present as a generic transport error in UI.

### 2) This path does **not** check session before invoke
`gmail-integration.tsx` explicitly checks for an active session before invoking an edge function, but `PropertyTab` does not. If session is stale/missing, the behavior can degrade to a gateway/auth failure that appears as transport failure to the end user.

### 3) Function JWT config appears inconsistent with other browser-invoked functions
`packages/db/supabase/functions/config.toml` explicitly sets `verify_jwt = false` for several browser/scheduled functions, but **does not include** `realie-property-lookup`. This likely leaves JWT verification at default behavior for that function.

> Inference: the mismatch may cause auth-gateway/CORS-like failures in some client states (especially expired session / missing token), which aligns with the observed `Failed to send a request to the Edge Function` message.

### 4) Edge function has required secret dependency
`realie-property-lookup` hard-fails with 500 if `REALIE_API_KEY` is missing. That condition is handled with JSON response, but should still be surfaced with clearer admin diagnostics.

### 5) There is an existing server route alternative
There is a Next.js API route at `app/api/properties/enrich/route.ts` that already encapsulates Realie integration from server-side context, which could avoid client-side transport fragility.

---

## Most likely failure modes (ranked)

1. **Auth/session drift in browser invoke path** + function JWT behavior mismatch.
2. **CORS/gateway failure** before function body executes (appears as transport error in Supabase JS).
3. **Function deployment/config drift** (function missing or stale on Supabase environment).
4. **Missing `REALIE_API_KEY`** secret in target Supabase project.
5. **Outbound provider/network issue** (less likely given specific frontend error text).

---

## Fix plan (phased)

## Phase 0 — Immediate triage (same day)

1. **Confirm function deployment + status** in the exact Supabase project/environment.
2. **Confirm secrets present**: `REALIE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Replay via cURL/Postman** against `/functions/v1/realie-property-lookup` with/without JWT to validate auth expectations.
4. **Inspect Supabase function logs** around failing timestamps for auth/gateway/cold-start failures.

Success criteria: determine whether the failure occurs pre-function (gateway/CORS/auth) vs inside function logic.

## Phase 1 — Stabilize client experience (1–2 days)

1. Add explicit session check before property enrichment invoke (same pattern as Gmail flow).
2. Improve UI error mapping:
   - Transport errors -> “Could not reach enrichment service” with retry guidance.
   - HTTP errors -> parse `error/detail/realie_status` and display actionable text.
3. Add a fallback retry path via internal API route (`/api/properties/enrich`) if direct function invoke fails at transport level.

Success criteria: users no longer see opaque transport error without guidance.

## Phase 2 — Remove fragile browser dependency (2–4 days)

1. Migrate Property tab enrichment call to a server endpoint (Next route/action) that invokes Realie/Supabase server-side.
2. Keep edge function for backend orchestration if needed, but avoid direct browser dependency for critical flows.
3. Standardize error schema returned to frontend (`code`, `message`, `retryable`, `request_id`).

Success criteria: enrichment succeeds/fails deterministically independent of browser CORS/auth state.

## Phase 3 — Hardening + observability (1–2 days)

1. Add request correlation IDs from UI -> server -> edge function logs.
2. Emit structured logs for:
   - auth state
   - endpoint called
   - response status
   - realie status/detail
3. Add dashboard alert for enrichment failure rate spike.
4. Add synthetic monitor that enriches a known test address daily.

Success criteria: future regressions are detectable within minutes.

---

## Configuration decisions to make

1. Should `realie-property-lookup` require JWT or be `verify_jwt = false` behind additional app-level checks?
2. Should enrichment writes remain in edge function, or move entirely to server route?
3. What is the single source of truth for Realie integration (avoid dual-path drift between edge function and Next route)?

---

## Recommended implementation order

1. Phase 0 triage checks + logs.
2. Phase 1 UX/error improvements in existing client path.
3. Phase 2 architecture consolidation to server-mediated enrichment.
4. Phase 3 observability and synthetic monitoring.

This sequence minimizes user pain first, then addresses underlying reliability.
