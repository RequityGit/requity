# E2E Tests — RequityOS

End-to-end tests for the RequityOS portal using [Playwright](https://playwright.dev/).

## Setup

### 1. Install dependencies

```bash
pnpm install
npx playwright install --with-deps chromium
```

### 2. Configure test credentials

Copy the env template and fill in real test account credentials:

```bash
cp .env.test .env.test.local
```

Edit `.env.test.local` with credentials for each role (borrower, investor, admin). These accounts must have email/password auth enabled in Supabase.

### 3. Required environment variables

| Variable | Description |
|---|---|
| `BASE_URL` | App URL (default: `https://portal.requitygroup.com`) |
| `BORROWER_EMAIL` | Borrower test account email |
| `BORROWER_PASSWORD` | Borrower test account password |
| `INVESTOR_EMAIL` | Investor test account email |
| `INVESTOR_PASSWORD` | Investor test account password |
| `ADMIN_EMAIL` | Admin test account email |
| `ADMIN_PASSWORD` | Admin test account password |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run with headed browser (visible)
pnpm test:e2e:headed

# Run with Playwright UI mode
pnpm test:e2e:ui

# Run a specific test file
npx playwright test tests/auth-access.spec.ts

# Run a specific test by name
npx playwright test -g "borrower login"
```

## Test Suites

| File | Tests | Description |
|---|---|---|
| `auth-access.spec.ts` | 1-8 | Login for all roles, invalid credentials, unauthorized access, session expiry, logout |
| `navigation.spec.ts` | 9-13 | Sidebar links, broken link crawl, broken images, back/forward nav, deep linking |
| `borrower-flows.spec.ts` | 14-20 | Dashboard, document upload/download, loan details, draw requests, payments |
| `investor-flows.spec.ts` | 21-25 | Dashboard, portfolio, documents, distributions, K-1/tax docs |
| `crm-admin-flows.spec.ts` | 26-32 | CRM contacts/companies, deal details, pipeline kanban, chat, operations |
| `forms-data-integrity.spec.ts` | 33-36 | Form validation, error states, date pickers, currency inputs |
| `notifications.spec.ts` | 37-38 | Notification bell/panel, notification link navigation |
| `performance-responsiveness.spec.ts` | 39-42 | Page load times, mobile/tablet viewports, sidebar collapse |
| `error-handling.spec.ts` | 43-45 | 404 pages, API failure handling, empty states |

## Architecture

```
tests/
  fixtures/
    auth.setup.ts        # Auth setup — creates stored sessions for each role
    test-fixtures.ts     # Shared Playwright fixtures (borrowerPage, investorPage, adminPage)
  *.spec.ts              # Test files
  .auth/                 # Generated auth state files (gitignored)
  README.md              # This file
```

### Auth Strategy

Tests authenticate via the Supabase REST API (`signInWithPassword`) during setup, then store the session as Playwright storage state. Each test file uses pre-authenticated page fixtures (`borrowerPage`, `investorPage`, `adminPage`), so login only happens once per test run.

## CI/CD

Tests run automatically via GitHub Actions (`.github/workflows/e2e-tests.yml`):
- On every push to `main`
- Every 6 hours on a schedule
- On-demand via `workflow_dispatch`

Failed runs create a GitHub Issue labeled `e2e-failure` for visibility.

### Required GitHub Secrets

Set these in **Settings > Secrets and variables > Actions**:
- `E2E_BASE_URL`
- `E2E_BORROWER_EMAIL` / `E2E_BORROWER_PASSWORD`
- `E2E_INVESTOR_EMAIL` / `E2E_INVESTOR_PASSWORD`
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`
