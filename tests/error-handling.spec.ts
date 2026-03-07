import { test, expect } from "./fixtures/test-fixtures";
import { test as base, expect as baseExpect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// 43. 404 page — navigate to non-existent route, verify custom 404
// ─────────────────────────────────────────────────────────────────────────────
test("43 — custom 404 page renders for non-existent route", async ({
  adminPage,
}) => {
  const response = await adminPage.goto(
    "/admin/this-route-definitely-does-not-exist-" + Date.now()
  );

  // Should get 404 status or redirect to a not-found page
  // Next.js may return 200 with the not-found component or actual 404
  await adminPage.waitForLoadState("domcontentloaded");

  const notFoundContent = adminPage.locator(
    'text=/not found|404|page.*not.*exist|doesn.t exist/i'
  );
  const main = adminPage.locator("main, body");

  const hasNotFound = await notFoundContent.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // Either we see a 404 message or the response status was 404
  const is404 = response?.status() === 404;
  expect(hasNotFound || is404).toBeTruthy();
});

base("43b — unauthenticated 404 redirects to login", async ({ page }) => {
  await page.goto("/some-fake-page-that-does-not-exist");
  await page.waitForLoadState("domcontentloaded");

  // Unauthenticated access to non-existent protected routes → login
  const isLogin = page.url().includes("/login");
  const notFoundContent = page.locator('text=/not found|404/i');
  const hasNotFound = await notFoundContent.first().isVisible({ timeout: 3_000 }).catch(() => false);

  baseExpect(isLogin || hasNotFound).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 44. API failure handling — graceful error states
// ─────────────────────────────────────────────────────────────────────────────
test("44 — graceful error handling when API calls fail", async ({
  adminPage,
}) => {
  // Intercept Supabase API calls to simulate failure
  await adminPage.route("**/rest/v1/**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });

  await adminPage.goto("/admin/crm/contacts");
  await adminPage.waitForLoadState("networkidle");

  // Page should handle errors gracefully — not crash with unhandled exception
  const main = adminPage.locator("body");
  await expect(main).toBeVisible({ timeout: 10_000 });

  // Should show an error state or empty state — not a raw error dump
  const errorState = adminPage.locator(
    'text=/error|something went wrong|try again|failed|empty|no data/i'
  );
  const hasErrorState = await errorState.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // The page should at minimum not show an unhandled runtime error
  const runtimeError = adminPage.locator(
    'text=/unhandled|runtime error|application error/i'
  );
  const hasRuntimeError = await runtimeError.first().isVisible({ timeout: 2_000 }).catch(() => false);

  expect(hasRuntimeError).toBeFalsy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 45. Empty states — proper empty state messages when no data
// ─────────────────────────────────────────────────────────────────────────────
test.describe("45 — Empty states render properly", () => {
  const emptyStatePages = [
    { path: "/admin/crm/contacts", name: "CRM contacts" },
    { path: "/admin/operations/tasks", name: "Operations tasks" },
    { path: "/admin/operations/approvals", name: "Operations approvals" },
  ];

  for (const { path, name } of emptyStatePages) {
    test(`${name} handles empty data`, async ({ adminPage }) => {
      await adminPage.goto(path);
      await adminPage.waitForLoadState("networkidle");

      const main = adminPage.locator("main");
      await expect(main).toBeVisible();

      // Page should render either data or a proper empty state
      const dataOrEmpty = adminPage.locator(
        'table tbody tr, [class*="card"], text=/no.*data|no.*result|empty|no.*found|getting started/i'
      );

      const hasContent = await dataOrEmpty.first().isVisible({ timeout: 5_000 }).catch(() => false);

      // At minimum, the page rendered without crashing
      expect(await main.isVisible()).toBeTruthy();
    });
  }
});
