import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// INVESTOR FLOWS
// Dashboard, portfolio, documents, distributions, navigation, security
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
    'text=/distribution|payment|payout|return|yield|income/i'
  );
  const emptyState = investorPage.locator('text=/no.*distribution|no.*payment|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
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

  for (const href of [...new Set(hrefs)]) {
    const response = await investorPage.goto(href);
    expect(response?.status(), `${href} returned ${response?.status()}`).not.toBe(500);
    const main = investorPage.locator("main");
    await expect(main).toBeVisible({ timeout: 10_000 });
  }
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
    "/admin/dashboard", "/lending/pipeline", "/lending/loans",
    "/admin/investors", "/admin/borrowers",
  ];

  for (const route of adminRoutes) {
    await investorPage.goto(route);
    await investorPage.waitForLoadState("networkidle");

    const url = investorPage.url();
    const onAdminPage = url.includes("/admin/") || url.includes("/lending/");

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

// ─────────────────────────────────────────────────────────────────────────────
// 40. Investor chatter page loads
// ─────────────────────────────────────────────────────────────────────────────
test("40 — investor chatter page loads", async ({ investorPage }) => {
  await investorPage.goto("/chat");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const chatUI = investorPage.locator(
    'text=/chat|message|conversation|room/i, input[placeholder*="message" i], textarea'
  );
  const emptyState = investorPage.locator(
    'text=/no.*message|no.*conversation|start.*chat|no.*room/i'
  );

  const hasChat = await chatUI.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasChat || hasEmpty).toBeTruthy();
});
