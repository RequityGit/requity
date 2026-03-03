# Playwright E2E Tests — Requity Portal

End-to-end tests for the Requity Portal at `https://portal.requitygroup.com`.

## Prerequisites

- Node.js 18+
- npm

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install --with-deps chromium
```

> Use `npx playwright install --with-deps` (no browser arg) to install all browsers.

### 3. Configure test credentials

Copy the example env file and fill in real credentials:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with valid test account credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORTAL_BASE_URL` | No | Defaults to `https://portal.requitygroup.com` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `BORROWER_EMAIL` | Yes | Test borrower account email |
| `BORROWER_PASSWORD` | Yes | Test borrower account password |
| `INVESTOR_EMAIL` | Yes | Test investor account email |
| `INVESTOR_PASSWORD` | Yes | Test investor account password |
| `ADMIN_EMAIL` | No | Test admin account email (admin tests skip if not set) |
| `ADMIN_PASSWORD` | No | Test admin account password |

> **Important:** Never commit `.env.test` — it is gitignored.

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run with headed browser (watch the tests)

```bash
npm run test:e2e:headed
```

### Run with Playwright UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run a specific test file

```bash
npx playwright test tests/homepage.spec.ts
```

### Run tests matching a name

```bash
npx playwright test --grep "login"
```

### Run only mobile/responsive tests

```bash
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
npx playwright test --project=tablet
```

### View the HTML report

```bash
npm run test:e2e:report
```

## Test Files

| File | What it covers |
|------|---------------|
| `homepage.spec.ts` | Login page loads, no broken images, no console errors, auth redirect |
| `borrower-login.spec.ts` | Borrower login, dashboard redirect, magic link UI, role enforcement |
| `investor-login.spec.ts` | Investor login, dashboard/funds/documents pages, role enforcement |
| `navigation.spec.ts` | Sidebar links for borrower, investor, and admin — each page loads |
| `broken-links.spec.ts` | Crawls internal links on all pages and flags 404/500 responses |
| `responsive.spec.ts` | Checks key pages at mobile/tablet viewports for layout overflow |
| `helpers/auth.ts` | Shared helper for programmatic Supabase auth (cookie injection) |

## How Authentication Works

The portal uses **magic link** and **Google OAuth** for login — there is no email/password form in the UI. For testing, we use Supabase's `signInWithPassword` API to authenticate programmatically and inject the resulting session cookies into the Playwright browser context. This requires that test accounts have passwords set (via `supabase.auth.admin.updateUserById` or the Supabase dashboard).

## CI Integration

Set the environment variables in your CI provider's secrets, then:

```yaml
# GitHub Actions example
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    BORROWER_EMAIL: ${{ secrets.BORROWER_EMAIL }}
    BORROWER_PASSWORD: ${{ secrets.BORROWER_PASSWORD }}
    INVESTOR_EMAIL: ${{ secrets.INVESTOR_EMAIL }}
    INVESTOR_PASSWORD: ${{ secrets.INVESTOR_PASSWORD }}
```

## Artifacts

- `test-results/` — Screenshots, videos, and traces (on failure/retry)
- `playwright-report/` — HTML report (open with `npm run test:e2e:report`)

Both directories are gitignored.
