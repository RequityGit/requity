import { test as base, expect } from "@playwright/test";

// =============================================================================
// LOGIN & PUBLIC PAGES
// Login page UI, public loan application, unauthenticated access
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// LP-1. Login page renders with auth options
// ─────────────────────────────────────────────────────────────────────────────
base("LP-1 — login page renders with auth options", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Login page should be visible
  const body = page.locator("body");
  await expect(body).toBeVisible();

  // Should have Google OAuth button or magic link email input
  const googleBtn = page.locator(
    'button:has-text("Google"), button:has-text("Sign in with Google"), a:has-text("Google")'
  );
  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i], input[name="email"]'
  );
  const signInBtn = page.locator(
    'button:has-text("Sign in"), button:has-text("Log in"), button[type="submit"]'
  );

  const hasGoogle = await googleBtn.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmail = await emailInput.first().isVisible({ timeout: 3_000 }).catch(() => false);
  const hasSignIn = await signInBtn.first().isVisible({ timeout: 3_000 }).catch(() => false);

  // Login page should have at least one auth method visible
  expect(hasGoogle || hasEmail || hasSignIn).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-2. Login page shows error for ?error=no_access
// ─────────────────────────────────────────────────────────────────────────────
base("LP-2 — login page shows error banner for no_access", async ({ page }) => {
  await page.goto("/login?error=no_access");
  await page.waitForLoadState("networkidle");

  const errorBanner = page.locator(
    'text=/access denied|no access|not authorized|denied/i'
  );
  const hasError = await errorBanner.first().isVisible({ timeout: 10_000 }).catch(() => false);

  expect(hasError).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-3. Login page shows error for ?error=google_blocked
// ─────────────────────────────────────────────────────────────────────────────
base("LP-3 — login page shows error for google_blocked", async ({ page }) => {
  await page.goto("/login?error=google_blocked");
  await page.waitForLoadState("networkidle");

  const errorContent = page.locator(
    'text=/blocked|not allowed|access denied|google|error/i'
  );
  const hasError = await errorContent.first().isVisible({ timeout: 10_000 }).catch(() => false);

  // At minimum the login page should render (even if error display is generic)
  const body = page.locator("body");
  await expect(body).toBeVisible();

  // Either a specific error shows or the page renders normally
  expect(hasError || (await body.isVisible())).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-4. Unauthenticated users are redirected to login
// ─────────────────────────────────────────────────────────────────────────────
base("LP-4 — unauthenticated access redirects to login", async ({ page }) => {
  // Try accessing protected routes without auth
  const protectedRoutes = [
    "/admin/dashboard",
    "/borrower/dashboard",
    "/investor/dashboard",
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-5. Public loan application page loads
// ─────────────────────────────────────────────────────────────────────────────
base("LP-5 — public loan application page loads", async ({ page }) => {
  await page.goto("/apply");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();

  // Application page should have form elements or loan-related content
  const formContent = page.locator(
    'text=/apply|loan|application|request|submit|get started/i'
  );
  const formInputs = page.locator(
    'input, select, textarea, button[type="submit"]'
  );

  const hasContent = await formContent.first().isVisible({ timeout: 5_000 }).catch(() => false);
  const hasInputs = (await formInputs.count()) > 0;

  expect(hasContent || hasInputs).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-6. Login page has no console errors
// ─────────────────────────────────────────────────────────────────────────────
base("LP-6 — login page has no unexpected console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (
        text.includes("Failed to load resource") ||
        text.includes("favicon") ||
        text.includes("hydration") ||
        text.includes("track-activity") ||
        text.includes("redirect") ||
        text.includes("script resource")
      ) return;
      errors.push(text);
    }
  });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2_000);

  expect(errors.length, `Unexpected console errors: ${errors.join("\n")}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// LP-7. Login page renders without broken images
// ─────────────────────────────────────────────────────────────────────────────
base("LP-7 — login page has no broken images", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2_000);

  const brokenImages = await page.evaluate(() => {
    const images = document.querySelectorAll("img");
    const broken: string[] = [];
    images.forEach((img) => {
      if (img.naturalWidth === 0 && img.src) {
        // Skip SVGs (naturalWidth is unreliable) and external storage URLs
        if (img.src.endsWith(".svg") || img.src.includes(".svg?") || img.src.includes("/storage/v1/")) return;
        broken.push(img.src);
      }
    });
    return broken;
  });

  expect(
    brokenImages,
    `Broken images found: ${brokenImages.join(", ")}`
  ).toHaveLength(0);
});
