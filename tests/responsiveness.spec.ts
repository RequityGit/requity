import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// RESPONSIVENESS TESTS
// These run on mobile-chrome and tablet projects (see playwright.config.ts)
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// R1. Borrower dashboard renders on mobile
// ─────────────────────────────────────────────────────────────────────────────
test("R1 — borrower dashboard renders on mobile", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");

  const main = borrowerPage.locator("main");
  await expect(main).toBeVisible();

  const bodyWidth = await borrowerPage.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await borrowerPage.evaluate(() => window.innerWidth);

  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
});

// ─────────────────────────────────────────────────────────────────────────────
// R2. Borrower sidebar collapses on mobile
// ─────────────────────────────────────────────────────────────────────────────
test("R2 — borrower sidebar adapts to mobile viewport", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");

  const sidebar = borrowerPage.locator('[class*="sidebar"], aside, [role="complementary"]');

  if (await sidebar.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    const sidebarBox = await sidebar.first().boundingBox();
    const viewportWidth = await borrowerPage.evaluate(() => window.innerWidth);

    if (sidebarBox) {
      expect(sidebarBox.width).toBeLessThan(viewportWidth * 0.75);
    }
  } else {
    const menuBtn = borrowerPage.locator(
      'button[aria-label*="menu" i], button[aria-label*="sidebar" i], button[aria-label*="navigation" i], button:has-text("Menu"), [class*="hamburger"]'
    );
    const hasMenu = await menuBtn.first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasMenu).toBeTruthy();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// R3. Investor dashboard renders on mobile
// ─────────────────────────────────────────────────────────────────────────────
test("R3 — investor dashboard renders on mobile", async ({ investorPage }) => {
  await investorPage.goto("/investor/dashboard");
  await investorPage.waitForLoadState("networkidle");

  const main = investorPage.locator("main");
  await expect(main).toBeVisible();

  const bodyWidth = await investorPage.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await investorPage.evaluate(() => window.innerWidth);

  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
});

// ─────────────────────────────────────────────────────────────────────────────
// R4. Borrower documents page renders on mobile
// ─────────────────────────────────────────────────────────────────────────────
test("R4 — borrower documents page renders on mobile", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/documents");
  await borrowerPage.waitForLoadState("networkidle");

  const main = borrowerPage.locator("main");
  await expect(main).toBeVisible();

  const bodyWidth = await borrowerPage.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await borrowerPage.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
});

// ─────────────────────────────────────────────────────────────────────────────
// R5. Borrower payments page renders on tablet
// ─────────────────────────────────────────────────────────────────────────────
test("R5 — borrower payments page renders on tablet", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/payments");
  await borrowerPage.waitForLoadState("networkidle");

  const main = borrowerPage.locator("main");
  await expect(main).toBeVisible();

  const bodyWidth = await borrowerPage.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await borrowerPage.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
});

// ─────────────────────────────────────────────────────────────────────────────
// R6. Touch targets are large enough on mobile
// ─────────────────────────────────────────────────────────────────────────────
test("R6 — borrower sidebar touch targets are adequately sized", async ({ borrowerPage }) => {
  await borrowerPage.goto("/borrower/dashboard");
  await borrowerPage.waitForLoadState("networkidle");

  const navLinks = borrowerPage.locator('nav a, [role="navigation"] a');
  const count = await navLinks.count();

  let undersizedCount = 0;
  for (let i = 0; i < Math.min(count, 10); i++) {
    const box = await navLinks.nth(i).boundingBox();
    if (box && (box.height < 36 || box.width < 36)) {
      undersizedCount++;
    }
  }

  expect(undersizedCount, `${undersizedCount} nav links are smaller than 36px tap target`).toBeLessThan(count / 2);
});
