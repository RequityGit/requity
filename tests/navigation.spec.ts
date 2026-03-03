import { test, expect } from '@playwright/test';
import { loginAsUser, requireEnv } from './helpers/auth';

/**
 * Navigation tests — log in and click through sidebar links,
 * verifying each page loads without errors.
 */

test.describe('Borrower navigation', () => {
  const borrowerPages = [
    { label: 'Dashboard', href: '/borrower/dashboard' },
    { label: 'Draw Requests', href: '/borrower/draws' },
    { label: 'Payments', href: '/borrower/payments' },
    { label: 'Documents', href: '/borrower/documents' },
  ];

  test.beforeEach(async ({ page }) => {
    requireEnv('BORROWER_EMAIL');

    await loginAsUser(page, process.env.BORROWER_EMAIL!);
  });

  test('all borrower sidebar links are visible', async ({ page }) => {
    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    for (const item of borrowerPages) {
      const link = page.locator(`a[href="${item.href}"]`);
      await expect(link, `Sidebar link "${item.label}" should be visible`).toBeVisible();
    }
  });

  for (const item of borrowerPages) {
    test(`borrower page loads: ${item.label}`, async ({ page }) => {
      const response = await page.goto(item.href);
      await page.waitForLoadState('networkidle');

      // Should not redirect to login
      expect(page.url()).not.toContain('/login');

      // Page should not return a server error
      expect(response?.status()).toBeLessThan(500);

      // No unhandled error boundary or Next.js error page
      const errorHeading = page.locator('h1:has-text("Application error")');
      await expect(errorHeading).not.toBeVisible();

      const nextError = page.locator('#__next-build-error, [data-nextjs-dialog]');
      expect(await nextError.count()).toBe(0);
    });
  }
});

test.describe('Investor navigation', () => {
  const investorPages = [
    { label: 'Dashboard', href: '/investor/dashboard' },
    { label: 'My Investments', href: '/investor/funds' },
    { label: 'Documents', href: '/investor/documents' },
  ];

  test.beforeEach(async ({ page }) => {
    requireEnv('INVESTOR_EMAIL');

    await loginAsUser(page, process.env.INVESTOR_EMAIL!);
  });

  test('all investor sidebar links are visible', async ({ page }) => {
    await page.goto('/investor/dashboard');
    await page.waitForLoadState('networkidle');

    for (const item of investorPages) {
      const link = page.locator(`a[href="${item.href}"]`);
      await expect(link, `Sidebar link "${item.label}" should be visible`).toBeVisible();
    }
  });

  for (const item of investorPages) {
    test(`investor page loads: ${item.label}`, async ({ page }) => {
      const response = await page.goto(item.href);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(response?.status()).toBeLessThan(500);

      const errorHeading = page.locator('h1:has-text("Application error")');
      await expect(errorHeading).not.toBeVisible();
    });
  }
});

test.describe('Admin navigation', () => {
  const adminPages = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'CRM', href: '/admin/crm' },
    { label: 'Pipeline', href: '/admin/pipeline' },
    { label: 'DSCR Pricing', href: '/admin/dscr' },
    { label: 'Servicing', href: '/admin/servicing' },
    { label: 'Investments', href: '/admin/funds' },
    { label: 'Documents', href: '/admin/document-center' },
    { label: 'Operations', href: '/admin/operations' },
  ];

  test.beforeEach(async ({ page }) => {
    // Admin tests are optional — skip if no admin email
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      test.skip();
      return;
    }

    await loginAsUser(page, email);
  });

  test('all admin sidebar links are visible', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    for (const item of adminPages) {
      const link = page.locator(`a[href="${item.href}"]`);
      await expect(link, `Sidebar link "${item.label}" should be visible`).toBeVisible();
    }
  });

  for (const item of adminPages) {
    test(`admin page loads: ${item.label}`, async ({ page }) => {
      const response = await page.goto(item.href);
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(response?.status()).toBeLessThan(500);

      const errorHeading = page.locator('h1:has-text("Application error")');
      await expect(errorHeading).not.toBeVisible();
    });
  }
});
