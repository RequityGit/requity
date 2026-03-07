import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// BORROWER FLOWS — EXTENDED
// Navigation, shared pages, UI chrome, error handling, security
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 21. Sidebar navigation — every borrower link resolves without error
// ─────────────────────────────────────────────────────────────────────────────
test("21 — borrower sidebar links all resolve", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");
  await waitForAppShell(borrowerPage);

  const sidebarLinks = borrowerPage.locator(
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
    const response = await borrowerPage.goto(href);
    expect(
      response?.status(),
      `${href} returned ${response?.status()}`
    ).not.toBe(500);
    const main = borrowerPage.locator("main");
    await expect(main).toBeVisible({ timeout: 10_000 });
    const errorHeading = borrowerPage.locator(
      'text="Failed to load this page"'
    );
    const hasError = await errorHeading
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    expect(hasError, `${href} shows error boundary`).toBeFalsy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 22. Chatter page loads for borrower
// ─────────────────────────────────────────────────────────────────────────────
test("22 — borrower chatter page loads", async ({ borrowerPage }) => {
  await borrowerPage.goto("/chat");
  await borrowerPage.waitForLoadState("networkidle");

  const main = borrowerPage.locator("main");
  await expect(main).toBeVisible();

  const chatUI = borrowerPage.locator(
    'text=/chat|message|conversation|room/i, input[placeholder*="message" i], textarea'
  );
  const emptyState = borrowerPage.locator(
    'text=/no.*message|no.*conversation|start.*chat|no.*room/i'
  );

  const hasChat = await chatUI.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasChat || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 23. Knowledge base page loads for borrower
// ─────────────────────────────────────────────────────────────────────────────
test("23 — borrower knowledge base page loads", async ({ borrowerPage }) => {
  await borrowerPage.goto("/sops");
  await borrowerPage.waitForLoadState("networkidle");

  const main = borrowerPage.locator("main");
  await expect(main).toBeVisible();

  const content = borrowerPage.locator(
    'text=/knowledge|sop|guide|document|article|help/i'
  );
  const emptyState = borrowerPage.locator(
    'text=/no.*article|no.*sop|empty|coming soon/i'
  );

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 24. Top bar chrome — search, notifications, theme toggle, avatar
// ─────────────────────────────────────────────────────────────────────────────
test("24 — borrower top bar elements present", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");
  await waitForAppShell(borrowerPage);

  const search = borrowerPage.locator(
    'input[placeholder*="search" i], [role="search"], [data-testid*="search"]'
  );
  const hasSearch = await search.first().isVisible({ timeout: 5_000 }).catch(() => false);

  const notifications = borrowerPage.locator(
    'button:has-text("Notification"), button[aria-label*="notification" i], [data-testid*="notification"]'
  );
  const hasNotif = await notifications.first().isVisible({ timeout: 3_000 }).catch(() => false);

  const themeToggle = borrowerPage.locator(
    'button:has-text("theme"), button[aria-label*="theme" i], button:has-text("Toggle theme")'
  );
  const hasTheme = await themeToggle.first().isVisible({ timeout: 3_000 }).catch(() => false);

  const chromeCount = [hasSearch, hasNotif, hasTheme].filter(Boolean).length;
  expect(chromeCount).toBeGreaterThanOrEqual(2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 25. Theme toggle works without crash
// ─────────────────────────────────────────────────────────────────────────────
test("25 — theme toggle does not crash page", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");
  await waitForAppShell(borrowerPage);

  const themeBtn = borrowerPage.locator(
    'button:has-text("Toggle theme"), button[aria-label*="theme" i]'
  );

  if (await themeBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await themeBtn.first().click();
    await borrowerPage.waitForTimeout(500);
    const main = borrowerPage.locator("main");
    await expect(main).toBeVisible();

    await themeBtn.first().click();
    await borrowerPage.waitForTimeout(500);
    await expect(main).toBeVisible();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 26. No console errors on dashboard (beyond known noise)
// ─────────────────────────────────────────────────────────────────────────────
test("26 — borrower dashboard has no unexpected console errors", async ({
  borrowerPage,
}) => {
  const errors: string[] = [];
  borrowerPage.on("console", (msg) => {
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

  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");
  await waitForAppShell(borrowerPage);
  await borrowerPage.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 27. Borrower cannot access admin routes
// ─────────────────────────────────────────────────────────────────────────────
test("27 — borrower is redirected away from admin routes", async ({
  borrowerPage,
}) => {
  const adminRoutes = [
    "/admin/dashboard",
    "/lending/pipeline",
    "/lending/loans",
    "/admin/investors",
    "/admin/borrowers",
    "/crm/contacts",
  ];

  for (const route of adminRoutes) {
    await borrowerPage.goto(route);
    await borrowerPage.waitForLoadState("networkidle");

    const url = borrowerPage.url();
    const onAdminPage =
      url.includes("/admin/") || url.includes("/lending/") || url.includes("/crm/");

    if (onAdminPage) {
      const accessDenied = borrowerPage.locator(
        'text=/access denied|unauthorized|forbidden|not authorized|permission/i'
      );
      const hasBlock = await accessDenied.first().isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasBlock || !onAdminPage, `Borrower accessed ${route} without restriction`).toBeTruthy();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 28. Borrower cannot access investor routes
// ─────────────────────────────────────────────────────────────────────────────
test("28 — borrower is redirected away from investor routes", async ({
  borrowerPage,
}) => {
  const investorRoutes = [
    "/investor/dashboard",
    "/investor/portfolio",
    "/investor/documents",
    "/investor/distributions",
  ];

  for (const route of investorRoutes) {
    await borrowerPage.goto(route);
    await borrowerPage.waitForLoadState("networkidle");

    const url = borrowerPage.url();
    const onInvestorPage = url.includes("/investor/");

    if (onInvestorPage) {
      const accessDenied = borrowerPage.locator(
        'text=/access denied|unauthorized|forbidden|not authorized|permission/i'
      );
      const hasBlock = await accessDenied.first().isVisible({ timeout: 3_000 }).catch(() => false);
      expect(hasBlock || !onInvestorPage, `Borrower accessed ${route} without restriction`).toBeTruthy();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 29. Direct URL to nonexistent page shows 404
// ─────────────────────────────────────────────────────────────────────────────
test("29 — 404 page renders for nonexistent route", async ({ borrowerPage }) => {
  const response = await borrowerPage.goto("/borrower/this-page-does-not-exist-12345");

  const status = response?.status();
  const notFoundText = borrowerPage.locator('text=/not found|404|page.*not.*exist/i');
  const hasNotFound = await notFoundText.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(status === 404 || hasNotFound).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 30. Borrower pages don't have stale loading spinners
// ─────────────────────────────────────────────────────────────────────────────
test("30 — borrower pages finish loading within timeout", async ({ borrowerPage }) => {
  const pages = ["/borrower/dashboard", "/borrower/documents", "/borrower/payments"];

  for (const page of pages) {
    await borrowerPage.goto(page);
    await borrowerPage.waitForLoadState("networkidle");

    const spinner = borrowerPage.locator(
      '[class*="spinner"], [class*="loading"], [role="progressbar"], [class*="skeleton"]'
    );

    await borrowerPage.waitForTimeout(3_000);
    const spinnerCount = await spinner.count();
    expect(spinnerCount, `${page} has ${spinnerCount} loading indicators after networkidle`).toBeLessThan(10);
  }
});
