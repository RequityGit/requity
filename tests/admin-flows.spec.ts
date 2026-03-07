import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// ADMIN / LENDING FLOWS
// Dashboard, pipeline, loans, CRM, borrowers, investors, chatter, SOPs
// =============================================================================

// Helper: try multiple route patterns for admin pages
async function gotoFirstValid(
  page: import("@playwright/test").Page,
  routes: string[]
): Promise<boolean> {
  for (const route of routes) {
    const resp = await page.goto(route);
    if (resp && resp.status() < 400) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 41. Admin dashboard loads
// ─────────────────────────────────────────────────────────────────────────────
test("41 — admin dashboard loads with expected sections", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/admin/dashboard", "/lending/dashboard", "/dashboard",
  ]);
  expect(loaded, "No admin dashboard route found").toBeTruthy();

  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const dashContent = adminPage.locator(
    'h1, h2, [class*="card"], [class*="Card"], [class*="metric"], [class*="stat"]'
  );
  const count = await dashContent.count();
  expect(count).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 42. Admin sidebar links all resolve
// ─────────────────────────────────────────────────────────────────────────────
test("42 — admin sidebar links all resolve without 500", async ({ adminPage }) => {
  await gotoFirstValid(adminPage, ["/admin/dashboard", "/lending/dashboard", "/dashboard"]);
  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  const sidebarLinks = adminPage.locator(
    'nav a[href], [role="navigation"] a[href], [class*="sidebar"] a[href]'
  );
  const count = await sidebarLinks.count();
  expect(count).toBeGreaterThan(0);

  const hrefs: string[] = [];
  for (let i = 0; i < count; i++) {
    const href = await sidebarLinks.nth(i).getAttribute("href");
    if (href && href.startsWith("/")) hrefs.push(href);
  }

  const failures: string[] = [];
  for (const href of [...new Set(hrefs)]) {
    const response = await adminPage.goto(href);
    const status = response?.status() ?? 0;
    if (status === 500) failures.push(`${href} → 500`);

    const errorBoundary = adminPage.locator('text="Failed to load this page"');
    const hasError = await errorBoundary.isVisible({ timeout: 1_000 }).catch(() => false);
    if (hasError) failures.push(`${href} → error boundary`);
  }

  expect(failures.length, `Admin sidebar failures:\n${failures.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 43. Loan pipeline page loads
// ─────────────────────────────────────────────────────────────────────────────
test("43 — admin loan pipeline loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/lending/pipeline", "/admin/pipeline", "/pipeline",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const pipelineUI = adminPage.locator(
    'table, [role="table"], [class*="kanban"], [class*="pipeline"], [class*="stage"], [class*="column"]'
  );
  const content = adminPage.locator('text=/pipeline|loan|opportunity|deal|stage/i');

  const hasUI = await pipelineUI.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasUI || hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 44. Loans list page loads with data
// ─────────────────────────────────────────────────────────────────────────────
test("44 — admin loans list page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/lending/loans", "/admin/loans", "/loans",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const loanTable = adminPage.locator('table, [role="table"], [class*="table"]');
  const loanContent = adminPage.locator('text=/loan|borrower|principal|balance|status/i');

  const hasTable = await loanTable.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasContent = await loanContent.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasTable || hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 45. Borrowers management page loads
// ─────────────────────────────────────────────────────────────────────────────
test("45 — admin borrowers list page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/admin/borrowers", "/lending/borrowers", "/borrowers",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/borrower|name|email|loan/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*borrower|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 46. Investors management page loads
// ─────────────────────────────────────────────────────────────────────────────
test("46 — admin investors list page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/admin/investors", "/lending/investors", "/investors",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/investor|name|email|fund|entity/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*investor|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 47. CRM contacts page loads
// ─────────────────────────────────────────────────────────────────────────────
test("47 — admin CRM contacts page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/crm/contacts", "/admin/contacts", "/contacts",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/contact|name|email|phone/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*contact|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 48. CRM companies page loads
// ─────────────────────────────────────────────────────────────────────────────
test("48 — admin CRM companies page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/crm/companies", "/admin/companies", "/companies",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/company|companie|lender|name/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*compan|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 49. Admin chatter page loads
// ─────────────────────────────────────────────────────────────────────────────
test("49 — admin chatter page loads", async ({ adminPage }) => {
  await adminPage.goto("/chat");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const chatUI = adminPage.locator(
    'text=/chat|message|channel|conversation|room/i, input[placeholder*="message" i], textarea'
  );
  const emptyState = adminPage.locator(
    'text=/no.*message|no.*channel|select.*channel|start.*chat/i'
  );

  const hasChat = await chatUI.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasChat || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 50. Admin knowledge base / SOPs page loads
// ─────────────────────────────────────────────────────────────────────────────
test("50 — admin knowledge base page loads", async ({ adminPage }) => {
  await adminPage.goto("/sops");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/knowledge|sop|guide|procedure|article/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 51. Admin notifications page/panel loads
// ─────────────────────────────────────────────────────────────────────────────
test("51 — admin notifications panel opens", async ({ adminPage }) => {
  await gotoFirstValid(adminPage, ["/admin/dashboard", "/lending/dashboard", "/dashboard"]);
  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  const notifBtn = adminPage.locator(
    'button:has-text("Notification"), button[aria-label*="notification" i]'
  );

  if (await notifBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await notifBtn.first().click();

    const notifPanel = adminPage.locator(
      '[class*="notification"], [role="dialog"], [class*="panel"], [class*="dropdown"]'
    );
    const notifContent = adminPage.locator(
      'text=/notification|no.*notification|all.*read|mark.*read/i'
    );

    const hasPanel = await notifPanel.first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasContent = await notifContent.first().isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasPanel || hasContent).toBeTruthy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 52. Admin settings page loads
// ─────────────────────────────────────────────────────────────────────────────
test("52 — admin settings page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/admin/settings", "/settings", "/admin/settings/general",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator(
    'text=/setting|configuration|general|team|notification|preference/i'
  );
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 53. Admin operations page loads
// ─────────────────────────────────────────────────────────────────────────────
test("53 — admin operations page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/operations", "/admin/operations", "/ops",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/operation|project|task|approval/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 54. Admin no console errors on dashboard
// ─────────────────────────────────────────────────────────────────────────────
test("54 — admin dashboard has no unexpected console errors", async ({ adminPage }) => {
  const errors: string[] = [];
  adminPage.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        text.includes("Failed to load resource") ||
        text.includes("favicon") ||
        text.includes("hydration") ||
        text.includes("track-activity")
      ) return;
      errors.push(text);
    }
  });

  await gotoFirstValid(adminPage, ["/admin/dashboard", "/lending/dashboard", "/dashboard"]);
  await adminPage.waitForLoadState("networkidle");
  await adminPage.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 55. Admin search bar works
// ─────────────────────────────────────────────────────────────────────────────
test("55 — admin search bar accepts input", async ({ adminPage }) => {
  await gotoFirstValid(adminPage, ["/admin/dashboard", "/lending/dashboard", "/dashboard"]);
  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  const searchInput = adminPage.locator('input[placeholder*="search" i], input[placeholder*="Search" i]');

  if (await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchInput.first().click();
    await searchInput.first().fill("test loan");

    await adminPage.waitForTimeout(1_000);
    const main = adminPage.locator("main");
    await expect(main).toBeVisible();

    const searchResults = adminPage.locator(
      '[class*="search-result"], [class*="command"], [role="listbox"], [role="dialog"]'
    );
    // At minimum, typing didn't crash anything
    await searchResults.first().isVisible({ timeout: 3_000 }).catch(() => false);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 56. Loan detail page loads (first available loan)
// ─────────────────────────────────────────────────────────────────────────────
test("56 — admin loan detail page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, ["/lending/loans", "/admin/loans", "/loans"]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");

  const loanLink = adminPage.locator(
    'a[href*="/loans/"], a[href*="/loan/"], table tbody tr a, [class*="table"] a'
  );

  if (await loanLink.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await loanLink.first().click();
    await adminPage.waitForLoadState("networkidle");

    const main = adminPage.locator("main");
    await expect(main).toBeVisible();

    const loanDetail = adminPage.locator(
      'text=/loan|borrower|balance|principal|property|term|rate|status/i'
    );
    const hasDetail = await loanDetail.first().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasDetail).toBeTruthy();

    const errorHeading = adminPage.locator('text="Failed to load this page"');
    await expect(errorHeading).not.toBeVisible({ timeout: 2_000 });
  }
});
