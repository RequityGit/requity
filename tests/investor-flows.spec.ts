import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// INVESTOR FLOWS
// Dashboard, portfolio, funds, documents, distributions, capital calls,
// navigation, security
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 31. Investor dashboard loads
// ─────────────────────────────────────────────────────────────────────────────
test("31 — investor dashboard loads with expected sections", async ({ investorPage }) => {
  await investorPage.goto("/investor/dashboard");
  await investorPage.waitForLoadState("networkidle");
  await waitForAppShell(investorPage);

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const dashContent = investorPage.locator(
    'h1, h2, [class*="card"], [class*="Card"], [class*="metric"]'
  );
  const count = await dashContent.count();
  expect(count).toBeGreaterThan(0);

  const errorHeading = investorPage.locator('text="Failed to load this page"');
  await expect(errorHeading).not.toBeVisible({ timeout: 2_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// 32. Investor portfolio page loads
// ─────────────────────────────────────────────────────────────────────────────
test("32 — investor portfolio page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/portfolio");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/portfolio|investment|fund|balance|commitment|position/i'
  );
  const emptyState = investorPage.locator(
    'text=/no.*investment|no.*portfolio|empty|getting started/i'
  );

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 32b. Investor funds list page loads
// ─────────────────────────────────────────────────────────────────────────────
test("32b — investor funds list page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/funds");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/fund|investment|balance|commitment|position/i, table, [role="table"]'
  );
  const emptyState = investorPage.locator(
    'text=/no.*fund|no.*investment|empty/i'
  );

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 32c. Investor fund detail page loads
// ─────────────────────────────────────────────────────────────────────────────
test("32c — investor fund detail page loads from funds list", async ({ investorPage }) => {
  await investorPage.goto("/investor/funds");
  await investorPage.waitForLoadState("networkidle");

  const fundLink = investorPage.locator(
    'a[href*="/investor/funds/"], table tbody tr a'
  );

  const hasFunds = await fundLink.first().isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasFunds) {
    await fundLink.first().click();
    await investorPage.waitForLoadState("networkidle");

    const main = investorPage.locator("main");
    await expect(main).toBeVisible();

    const fundDetail = investorPage.locator(
      'text=/fund|investment|balance|commitment|return|distribution|capital/i'
    );
    const hasDetail = await fundDetail.first().isVisible({ timeout: 5_000 }).catch(() => false);

    const errorHeading = investorPage.locator('text="Failed to load this page"');
    await expect(errorHeading).not.toBeVisible({ timeout: 2_000 });

    expect(hasDetail).toBeTruthy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 33. Investor documents page loads
// ─────────────────────────────────────────────────────────────────────────────
test("33 — investor documents page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/documents");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/document|report|statement|k-1|tax|file/i, table, [role="table"]'
  );
  const emptyState = investorPage.locator('text=/no.*document|no.*file|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 34. Investor distributions page loads
// ─────────────────────────────────────────────────────────────────────────────
test("34 — investor distributions page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/distributions");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/distribution|payment|payout|return|yield|income|investment/i'
  );
  const emptyState = investorPage.locator('text=/no.*distribution|no.*payment|no.*found|empty|adjust/i');
  const heading = investorPage.locator('h1, h2');

  const hasContent = await content.first().isVisible({ timeout: 8_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasHeading = await heading.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty || hasHeading).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 34b. Investor capital calls page loads
// ─────────────────────────────────────────────────────────────────────────────
test("34b — investor capital calls page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/capital-calls");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/capital.*call|commitment|amount|due|pending|paid/i'
  );
  const emptyState = investorPage.locator('text=/no.*capital|no.*call|empty|no data/i');
  const heading = investorPage.locator('h1, h2');

  const hasContent = await content.first().isVisible({ timeout: 8_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasHeading = await heading.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty || hasHeading).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 34c. Investor account/settings page loads
// ─────────────────────────────────────────────────────────────────────────────
test("34c — investor account settings page loads", async ({ investorPage }) => {
  await investorPage.goto("/investor/account");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const content = investorPage.locator(
    'text=/account|profile|setting|name|email|notification/i'
  );
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 35. Investor sidebar links all resolve
// ─────────────────────────────────────────────────────────────────────────────
test("35 — investor sidebar links all resolve without 500", async ({ investorPage }) => {
  await investorPage.goto("/investor/dashboard");
  await investorPage.waitForLoadState("networkidle");
  await waitForAppShell(investorPage);

  const sidebarLinks = investorPage.locator(
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
    if (!href.startsWith("/")) continue;

    const response = await investorPage.goto(href);
    const status = response?.status() ?? 0;
    if (status === 500) {
      failures.push(`${href} -> 500`);
      continue;
    }
    await investorPage.waitForLoadState("networkidle").catch(() => {});
    const main = investorPage.locator("main");
    const hasMain = await main.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasMain) {
      const currentUrl = investorPage.url();
      if (!currentUrl.includes("/login")) {
        failures.push(`${href} -> main not visible (at ${currentUrl})`);
      }
    }
  }
  expect(failures.length, `Investor sidebar failures:\n${failures.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 36. Investor top bar chrome present
// ─────────────────────────────────────────────────────────────────────────────
test("36 — investor top bar elements present", async ({ investorPage }) => {
  await investorPage.goto("/investor/dashboard");
  await investorPage.waitForLoadState("networkidle");
  await waitForAppShell(investorPage);

  const search = investorPage.locator('input[placeholder*="search" i], [role="search"]');
  const hasSearch = await search.first().isVisible({ timeout: 5_000 }).catch(() => false);

  const notif = investorPage.locator(
    'button:has-text("Notification"), button[aria-label*="notification" i]'
  );
  const hasNotif = await notif.first().isVisible({ timeout: 3_000 }).catch(() => false);

  const avatar = investorPage.locator(
    'button:has-text("Investor"), [class*="avatar"], [data-testid*="user"]'
  );
  const hasAvatar = await avatar.first().isVisible({ timeout: 3_000 }).catch(() => false);

  const chromeCount = [hasSearch, hasNotif, hasAvatar].filter(Boolean).length;
  expect(chromeCount).toBeGreaterThanOrEqual(2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 37. Investor no console errors on dashboard
// ─────────────────────────────────────────────────────────────────────────────
test("37 — investor dashboard has no unexpected console errors", async ({ investorPage }) => {
  const errors: string[] = [];
  investorPage.on("console", (msg) => {
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

  await investorPage.goto("/investor/dashboard");
  await investorPage.waitForLoadState("networkidle");
  await investorPage.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 38. Investor cannot access admin routes
// ─────────────────────────────────────────────────────────────────────────────
test("38 — investor is redirected away from admin routes", async ({ investorPage }) => {
  const adminRoutes = [
    "/admin/dashboard", "/admin/pipeline", "/admin/loans",
    "/admin/investors", "/admin/borrowers",
  ];

  for (const route of adminRoutes) {
    await investorPage.goto(route);
    await investorPage.waitForLoadState("networkidle");

    const url = investorPage.url();
    const onAdminPage = url.includes("/admin/");

    if (onAdminPage) {
      const accessDenied = investorPage.locator(
        'text=/access denied|unauthorized|forbidden|not authorized|permission/i'
      );
      const hasBlock = await accessDenied.first().isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasBlock || !onAdminPage, `Investor accessed ${route} without restriction`).toBeTruthy();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 39. Investor cannot access borrower routes
// ─────────────────────────────────────────────────────────────────────────────
test("39 — investor is redirected away from borrower routes", async ({ investorPage }) => {
  const borrowerRoutes = [
    "/borrower/dashboard", "/borrower/draws",
    "/borrower/payments", "/borrower/documents",
  ];

  for (const route of borrowerRoutes) {
    await investorPage.goto(route);
    await investorPage.waitForLoadState("networkidle");

    const url = investorPage.url();
    const onBorrowerPage = url.includes("/borrower/");

    if (onBorrowerPage) {
      const accessDenied = investorPage.locator(
        'text=/access denied|unauthorized|forbidden|not authorized|permission/i'
      );
      const hasBlock = await accessDenied.first().isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasBlock || !onBorrowerPage, `Investor accessed ${route} without restriction`).toBeTruthy();
    }
  }
});
