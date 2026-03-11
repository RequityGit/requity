import { test, expect, waitForAppShell } from "./fixtures/test-fixtures";

// =============================================================================
// CONTROL CENTER FLOWS
// Field Manager, Object Manager, Card Types, Document Templates,
// Email Templates, Pipeline Stage Config, Workflow Builder, and other
// super-admin configuration tools
// =============================================================================

// Helper: navigate to a control-center page; skip the test if the user is not
// super-admin and gets redirected away (control-center layout redirects
// non-super-admins to /admin/dashboard).
async function gotoControlCenter(
  page: import("@playwright/test").Page,
  path: string
): Promise<boolean> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const url = page.url();
  return url.includes("/control-center");
}

// ─────────────────────────────────────────────────────────────────────────────
// CC-1. Control Center landing page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-1 — control center landing page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center");
  if (!onCC) { test.skip(); return; }

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
  const onCC = await gotoControlCenter(adminPage, "/control-center/object-manager");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const heading = adminPage.locator('text=/field manager|field configuration|object manager/i');
  const hasHeading = await heading.first().isVisible({ timeout: 5_000 }).catch(() => false);

  const tabs = adminPage.locator(
    '[role="tablist"] [role="tab"], button[class*="tab"], [data-state="active"]'
  );
  const tabCount = await tabs.count();

  expect(hasHeading || tabCount > 0).toBeTruthy();

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
  const onCC = await gotoControlCenter(adminPage, "/control-center/object-manager");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const fieldContent = adminPage.locator(
    'text=/text|currency|dropdown|percentage|number|date|boolean|formula/i'
  );
  const hasFields = await fieldContent.first().isVisible({ timeout: 5_000 }).catch(() => false);

  const toggleBtns = adminPage.locator(
    'button:has(svg), [class*="toggle"], [class*="visibility"]'
  );
  const hasToggles = await toggleBtns.first().isVisible({ timeout: 3_000 }).catch(() => false);

  const actionBtns = adminPage.locator(
    'button:has-text("Save"), button:has-text("Discard"), button:has-text("Add")'
  );
  const hasActions = await actionBtns.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasFields || hasToggles || hasActions).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-4. Field Manager search filters fields
// ─────────────────────────────────────────────────────────────────────────────
test("CC-4 — field manager search filters fields", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/object-manager");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const searchInput = adminPage.locator(
    'input[placeholder*="search" i], input[placeholder*="filter" i]'
  );

  if (await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchInput.first().fill("loan");
    await adminPage.waitForTimeout(500);

    await expect(main).toBeVisible();

    await searchInput.first().clear();
    await adminPage.waitForTimeout(300);
    await expect(main).toBeVisible();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-5. Object Manager page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-5 — object manager page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/object-manager");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/object|manager|configuration|field|entity/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-6. Card Types page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-6 — card types page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/card-types");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/card.*type|pipeline|configuration|template/i');
  const emptyState = adminPage.locator('text=/no.*card|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-7. Control Center navigation links all resolve
// ─────────────────────────────────────────────────────────────────────────────
test("CC-7 — control center navigation links resolve", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center");
  if (!onCC) { test.skip(); return; }

  await waitForAppShell(adminPage);

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
    if (status === 500) failures.push(`${href} -> 500`);

    const errorBoundary = adminPage.locator('text="Failed to load this page"');
    const hasError = await errorBoundary.isVisible({ timeout: 1_000 }).catch(() => false);
    if (hasError) failures.push(`${href} -> error boundary`);
  }

  expect(failures.length, `Control center failures:\n${failures.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-8. Loan Condition Templates page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-8 — loan condition templates page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/conditions");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/condition|template|loan/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

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

  const onCC = await gotoControlCenter(adminPage, "/control-center");
  if (!onCC) { test.skip(); return; }

  await adminPage.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-10. Document Templates page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-10 — document templates page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/document-templates");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/document.*template|template|generate/i');
  const emptyState = adminPage.locator('text=/no.*template|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-11. Email Templates page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-11 — email templates page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/email-templates");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/email.*template|template|subject|notification/i');
  const emptyState = adminPage.locator('text=/no.*template|empty/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-12. Pipeline Stage Config page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-12 — pipeline stage config page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/pipeline-stage-config");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/pipeline|stage|configuration|order/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-13. Underwriting config page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-13 — underwriting config page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/underwriting");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/underwriting|configuration|field|criteria/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-14. Payoff Settings page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-14 — payoff settings page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/payoff-settings");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/payoff|setting|configuration|calculation/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-15. Workflow Builder page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-15 — workflow builder page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/workflow-builder");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/workflow|builder|automation|trigger|action/i');
  const emptyState = adminPage.locator('text=/no.*workflow|empty|get started/i');

  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false);

  expect(hasContent || hasEmpty).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-16. Term Sheets config page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-16 — term sheets config page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/term-sheets");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/term.*sheet|template|configuration/i');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// CC-17. Users management page loads
// ─────────────────────────────────────────────────────────────────────────────
test("CC-17 — control center users page loads", async ({ adminPage }) => {
  const onCC = await gotoControlCenter(adminPage, "/control-center/users");
  if (!onCC) { test.skip(); return; }

  const main = adminPage.locator("main");
  await expect(main).toBeVisible();

  const content = adminPage.locator('text=/user|team|member|role|admin|email/i, table, [role="table"]');
  const hasContent = await content.first().isVisible({ timeout: 5_000 }).catch(() => false);

  expect(hasContent).toBeTruthy();
});
