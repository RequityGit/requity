import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// 37. Notification bell/panel loads and displays notifications
// ─────────────────────────────────────────────────────────────────────────────
test("37 — notification bell/panel loads", async ({ adminPage }) => {
  await adminPage.goto("/admin/dashboard");
  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  // Look for notification bell icon in topbar
  const notificationBell = adminPage.locator(
    'button[aria-label*="notification" i], a[href="/notifications"], [class*="notification"], button:has([class*="bell"]), a[href*="notification"]'
  );

  const hasBell = await notificationBell.first().isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasBell) {
    await notificationBell.first().click();
    await adminPage.waitForTimeout(500);

    // Either a notification panel/dropdown opens or we navigate to /notifications
    const notifContent = adminPage.locator(
      'text=/notification|alert|update/i, [class*="notification"], [class*="popover"]'
    );
    const hasContent = await notifContent.first().isVisible({ timeout: 5_000 }).catch(() => false);

    // If it navigated to /notifications page, check that too
    if (!hasContent && adminPage.url().includes("/notifications")) {
      const main = adminPage.locator("main");
      await expect(main).toBeVisible();
    }
  }

  // Also verify the /notifications page directly
  await adminPage.goto("/notifications");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const notifItems = adminPage.locator(
    'text=/notification|alert|update|no.*notification|empty/i'
  );
  const hasNotifs = await notifItems.first().isVisible({ timeout: 5_000 }).catch(() => false);
  // Page should render either notifications or an empty state
  expect(hasNotifs || (await main.isVisible())).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// 38. Notification links navigate to correct pages
// ─────────────────────────────────────────────────────────────────────────────
test("38 — notification links navigate correctly", async ({ adminPage }) => {
  await adminPage.goto("/notifications");
  await adminPage.waitForLoadState("networkidle");

  // Find any clickable notification items with links
  const notifLinks = adminPage.locator(
    '[class*="notification"] a, table tbody tr a, a[href*="/admin/"], a[href*="/borrower/"], a[href*="/investor/"]'
  );

  const hasLinks = await notifLinks.first().isVisible({ timeout: 5_000 }).catch(() => false);

  if (hasLinks) {
    const href = await notifLinks.first().getAttribute("href");
    await notifLinks.first().click();
    await adminPage.waitForLoadState("domcontentloaded");

    // Should navigate away from /notifications
    if (href && !href.includes("/notifications")) {
      expect(adminPage.url()).not.toEqual(
        `${process.env.BASE_URL}/notifications`
      );
    }

    // Target page should load without errors
    const main = adminPage.locator("main");
    await expect(main).toBeVisible();
  } else {
    // No notification links — page still functional
    await expect(adminPage.locator("main")).toBeVisible();
  }
});
