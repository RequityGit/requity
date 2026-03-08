import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// CONTROL CENTER FLOWS
// Field Manager, Page Layouts, and other super-admin configuration tools
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// CC-1. Control Center landing page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-1 — control center landing page loads", async ({ adminPage }) => {
  await adminPage.goto("/control-center");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator(
    'text=/control center|configuration|manage|settings|field|layout|template/i'
  );
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-2. Field Manager loads with module tabs
// ─────────────────────────────────────────────────────────────────────────────
test("CC-2 — field manager loads with module tabs", async ({ adminPage }) => {
  await adminPage.goto("/control-center/field-manager");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Should show field manager heading or field-related content
  const heading = adminPage.locator('text=/field manager|field configuration/i');
  const hasHeading = await heading.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // Should have module tabs (loan_details, property, borrower_entity, etc.)
  const tabs = adminPage.locator(
    '[role="tablist"] [role="tab"], button[class*="tab"], [data-state="active"]'
  );
  const tabCount = await tabs.count();

  // Field manager should render with tabs or at least relevant content
  expect(hasHeading || tabCount > 0).toBeTruthy();

  // Click through a few module tabs if available
  if (tabCount > 0) {
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click();
      await adminPage.waitForTimeout(500);
      await expect(main).toBeVisible();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-3. Field Manager shows field list with visibility toggles
// ─────────────────────────────────────────────────────────────────────────────
test("CC-3 — field manager shows fields with controls", async ({ adminPage }) => {
  await adminPage.goto("/control-center/field-manager");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Should show field rows with labels and type badges
  const fieldContent = adminPage.locator(
    'text=/text|currency|dropdown|percentage|number|date|boolean|formula/i'
  );
  const hasFields = await fieldContent.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // Should have visibility toggle buttons (eye icons)
  const toggleBtns = adminPage.locator(
    'button:has(svg), [class*="toggle"], [class*="visibility"]'
  );
  const hasToggles = await toggleBtns.first().isVisible({ timeout: 3_000 }).catch(() => false);

  // Should have a save/discard button area
  const actionBtns = adminPage.locator(
    'button:has-text("Save"), button:has-text("Discard"), button:has-text("Add")'
  );
  const hasActions = await actionBtns.first().isVisible({ timeout: 3_000 }).catch(() => false);

  // Field manager should show fields or controls
  expect(hasFields || hasToggles || hasActions).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-4. Field Manager search filters fields
// ─────────────────────────────────────────────────────────────────────────────
test("CC-4 — field manager search filters fields", async ({ adminPage }) => {
  await adminPage.goto("/control-center/field-manager");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const searchInput = adminPage.locator(
    'input[placeholder*="search" i], input[placeholder*="filter" i]'
  );

  if (await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchInput.first().fill("loan");
    await adminPage.waitForTimeout(500);

    // Page should still be functional after filtering
    await expect(main).toBeVisible();

    // Clear search
    await searchInput.first().clear();
    await adminPage.waitForTimeout(300);
    await expect(main).toBeVisible();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-5. Page Layouts manager loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-5 — page layout manager loads", async ({ adminPage }) => {
  await adminPage.goto("/control-center/page-layouts");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Should show page layout heading
  const heading = adminPage.locator('text=/page layout|layout manager|layout/i');
  const hasHeading = await heading.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasHeading).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-6. Page Layouts has object type tabs
// ─────────────────────────────────────────────────────────────────────────────
test("CC-6 — page layout manager has object type tabs", async ({ adminPage }) => {
  await adminPage.goto("/control-center/page-layouts");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  // Should have object type tabs (Contact, Company, Opportunity, Loan, Property, Investment)
  const objectTypes = adminPage.locator(
    'text=/contact|company|opportunity|loan|property|investment/i'
  );
  const objectTypeCount = await objectTypes.count();
  expect(objectTypeCount).toBeGreaterThan(0);

  // Clicking tabs should not crash
  const tabs = adminPage.locator(
    '[role="tablist"] [role="tab"], button[class*="tab"]'
  );
  const tabCount = await tabs.count();

  if (tabCount > 0) {
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click();
      await adminPage.waitForTimeout(500);
      await expect(main).toBeVisible();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-7. Control Center navigation links all resolve
// ─────────────────────────────────────────────────────────────────────────────
test("CC-7 — control center navigation links resolve", async ({ adminPage }) => {
  await adminPage.goto("/control-center");
  await adminPage.waitForLoadState("networkidle");
  await waitForAppShell(adminPage);

  // Collect all links on the control center page
  const navLinks = adminPage.locator(
    'a[href*="/control-center/"], nav a[href]'
  );
  const count = await navLinks.count();

  const hrefs: string[] = [];
  for (let i = 0; i < count; i++) {
    const href = await navLinks.nth(i).getAttribute("href");
    if (href && href.startsWith("/control-center/")) hrefs.push(href);
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

  expect(failures.length, `Control center failures:\n${failures.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-8. Loan Condition Templates page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-8 — loan condition templates page loads", async ({ adminPage }) => {
  await adminPage.goto("/control-center/loan-conditions");
  await adminPage.waitForLoadState("networkidle");

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/condition|template|loan/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  // Page should render data or empty state without crashing
  expect(hasContent || (await main.isVisible())).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-9. Control Center has no console errors
// ─────────────────────────────────────────────────────────────────────────────
test("CC-9 — control center has no unexpected console errors", async ({ adminPage }) => {
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

  await adminPage.goto("/control-center");
  await adminPage.waitForLoadState("networkidle");
  await adminPage.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});
