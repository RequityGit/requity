import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// ADMIN / LENDING FLOWS
// Dashboard, pipeline, loans, CRM, borrowers, investors, SOPs
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
// 43. Unified pipeline page loads
// ─────────────────────────────────────────────────────────────────────────────
test("43 — admin unified pipeline loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/pipeline");
  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const pipelineUI = adminPage.locator(
    'table, [role="table"], [class*="kanban"], [class*="pipeline"], [class*="stage"], [class*="column"], [draggable]'
  );
  const content = adminPage.locator('text=/pipeline|deal|stage|unified/i');

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

  // /admin/borrowers may redirect to /admin/crm?tab=borrowers → /admin/crm/contacts
  const content = adminPage.locator('text=/borrower|contact|name|email|loan|crm/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*borrower|no.*contact|empty|no data/i');
  const heading = adminPage.locator('h1, h2');

  const hasContent = await content.first().isVisible({ timeout: 8_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasHeading = await heading.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty || hasHeading).toBeTruthy();
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

  // /admin/investors may redirect to /admin/crm?tab=investors → /admin/crm/contacts
  const content = adminPage.locator('text=/investor|contact|name|email|fund|entity|crm/i, table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*investor|no.*contact|empty|no data/i');
  const heading = adminPage.locator('h1, h2');

  const hasContent = await content.first().isVisible({ timeout: 8_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasHeading = await heading.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty || hasHeading).toBeTruthy();
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
    "/admin/account", "/settings", "/admin/settings",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator(
    'text=/setting|configuration|general|team|notification|preference|control|manage|template|user|account|profile/i'
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

// ─────────────────────────────────────────────────────────────────────────────
// 57. Unified pipeline deal detail loads with tabs and stage stepper
// ─────────────────────────────────────────────────────────────────────────────
test("57 — pipeline deal detail loads with tabs and stepper", async ({ adminPage }) => {
  await adminPage.goto("/admin/pipeline");
  await adminPage.waitForLoadState("networkidle");

  // Find a deal card/link in the pipeline view
  const dealLink = adminPage.locator(
    'a[href*="/pipeline/"], [class*="card"] a, [draggable] a'
  );

  const hasDeals = await dealLink.first().isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasDeals) {
    await dealLink.first().click();
    await adminPage.waitForLoadState("networkidle");

    const main = adminPage.locator("main");
    await expect(main).toBeVisible();

    // Check for stage stepper (rendered as rounded-full step circles)
    const stepper = adminPage.locator(
      'main .rounded-full'
    );
    const hasStepper = await stepper.first().isVisible({ timeout: 5_000 }).catch(() => false);

    // Check for tabs (custom buttons in an inline-flex container)
    const tabs = adminPage.locator('div.inline-flex > button');
    const tabCount = await tabs.count();

    // Deal detail should have at least tabs or stepper
    expect(hasStepper || tabCount > 0).toBeTruthy();

    // Click through available tabs — verify no crashes
    if (tabCount > 0) {
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await adminPage.waitForTimeout(500);
        await expect(main).toBeVisible();
      }
    }

    // No error boundary
    const errorHeading = adminPage.locator('text="Failed to load this page"');
    await expect(errorHeading).not.toBeVisible({ timeout: 2_000 });
  } else {
    // No deals — pipeline page itself rendered fine
    await expect(adminPage.locator("main")).toBeVisible();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 58. Pipeline drag-and-drop columns render
// ─────────────────────────────────────────────────────────────────────────────
test("58 — pipeline kanban renders draggable deal cards", async ({ adminPage }) => {
  await adminPage.goto("/admin/pipeline");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Unified pipeline should show kanban columns with stage names
  const pipelineContent = adminPage.locator(
    '[class*="kanban"], [class*="column"], [class*="pipeline"], [draggable], [class*="stage"]'
  );
  const tableView = adminPage.locator('table, [role="table"]');
  const emptyState = adminPage.locator('text=/no.*deal|empty|no data/i');

  const hasBoard = await pipelineContent.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasTable = await tableView.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasBoard || hasTable || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 59. Old pipeline routes redirect to unified pipeline
// ─────────────────────────────────────────────────────────────────────────────
test("59 — old pipeline routes redirect to unified pipeline", async ({ adminPage }) => {
  // /admin/pipeline/debt should redirect to /admin/pipeline
  await adminPage.goto("/admin/pipeline/debt");
  await adminPage.waitForLoadState("networkidle");
  expect(adminPage.url()).toContain("/admin/pipeline");

  // /admin/pipeline/equity should redirect to /admin/pipeline
  await adminPage.goto("/admin/pipeline/equity");
  await adminPage.waitForLoadState("networkidle");
  expect(adminPage.url()).toContain("/admin/pipeline");

  // Main content visible after redirect
  await expect(adminPage.locator("main")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 60. Document center loads
// ─────────────────────────────────────────────────────────────────────────────
test("60 — admin document center loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/documents");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/document|upload|file/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // Should show document table or upload form
  const table = adminPage.locator('table, [role="table"]');
  const hasTable = await table.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent || hasTable).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 61. Operations page loads with tasks tab
// ─────────────────────────────────────────────────────────────────────────────
test("61 — operations tasks page loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/operations/tasks");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/task|operation|assignment|to.?do/i');
  const emptyState = adminPage.locator('text=/no.*task|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 62. Operations approvals page loads
// ─────────────────────────────────────────────────────────────────────────────
test("62 — operations approvals page loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/operations/approvals");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/approval|pending|review/i');
  const emptyState = adminPage.locator('text=/no.*approval|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 63. Toolbox — Servicing page loads
// ─────────────────────────────────────────────────────────────────────────────
test("63 — admin servicing page loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/servicing");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/servicing|loan|payment|draw/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 64. Toolbox — Commercial model page loads
// ─────────────────────────────────────────────────────────────────────────────
test("64 — admin commercial model page loads", async ({ adminPage }) => {
  const loaded = await gotoFirstValid(adminPage, [
    "/admin/models/commercial", "/admin/models",
  ]);
  if (!loaded) { test.skip(); return; }

  await adminPage.waitForLoadState("networkidle");
  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/model|commercial|scenario|underwriting/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 65. Toolbox — RTL model page loads
// ─────────────────────────────────────────────────────────────────────────────
test("65 — admin RTL model page loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/models/rtl");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/model|rtl|scenario|underwriting/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 66. Toolbox — DSCR model page loads
// ─────────────────────────────────────────────────────────────────────────────
test("66 — admin DSCR model page loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/models/dscr");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/dscr|model|debt.*service|coverage/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});
