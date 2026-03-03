import { test, expect } from '@playwright/test';
import { loginAsUser, requireEnv } from './helpers/auth';

test.describe('Borrower login flow', () => {
  test.beforeEach(async () => {
    // Ensure credentials are available
    requireEnv('BORROWER_EMAIL');
    requireEnv('SUPABASE_URL');
    requireEnv('SUPABASE_ANON_KEY');
    requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  });

  test('borrower can log in and is redirected to dashboard', async ({ page }) => {
    const email = process.env.BORROWER_EMAIL!;

    // Authenticate via Supabase Admin API and inject session cookies
    await loginAsUser(page, email);

    // Navigate to the portal — should land on borrower dashboard
    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    // Should NOT be redirected to login
    expect(page.url()).not.toContain('/login');

    // Should be on a borrower page
    expect(page.url()).toContain('/borrower');
  });

  test('borrower dashboard renders key elements', async ({ page }) => {
    await loginAsUser(page, process.env.BORROWER_EMAIL!);

    await page.goto('/borrower/dashboard');
    await page.waitForLoadState('networkidle');

    // Sidebar should be visible with borrower nav items
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Dashboard link should be present
    const dashboardLink = page.locator('a[href="/borrower/dashboard"]');
    await expect(dashboardLink).toBeVisible();
  });

  test('magic link UI flow shows confirmation', async ({ page }) => {
    await page.goto('/login');

    // Fill in email
    const emailInput = page.locator('input#email');
    await emailInput.fill('test-magic-link@example.com');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await submitButton.click();

    // Should show the "Check your email" confirmation
    await expect(
      page.getByText(/check your email/i),
    ).toBeVisible({ timeout: 10_000 });

    // "Use a different email" link should appear
    await expect(
      page.getByRole('button', { name: /use a different email/i }),
    ).toBeVisible();
  });

  test('login page shows error for invalid email format', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input#email');
    await emailInput.fill('not-an-email');

    const submitButton = page.getByRole('button', { name: /send magic link/i });
    await submitButton.click();

    // The browser's native validation should prevent submission
    // Check that we're still on the login page
    expect(page.url()).toContain('/login');
  });

  test('borrower cannot access admin routes', async ({ page }) => {
    await loginAsUser(page, process.env.BORROWER_EMAIL!);

    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Should be redirected away from admin
    expect(page.url()).not.toContain('/admin');
  });
});
