import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Requity Portal E2E tests.
 *
 * Tests run against the live portal at https://portal.requitygroup.com.
 * Credentials are loaded from .env.test (see .env.test.example).
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Maximum time a single test can run */
  timeout: 60_000,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once on CI */
  retries: process.env.CI ? 1 : 0,

  /* Run tests sequentially by default (auth-dependent flows) */
  workers: process.env.CI ? 1 : 2,

  /* Reporter configuration */
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }], ['list']],

  /* Load test credentials from .env.test */
  globalSetup: undefined,

  use: {
    /* Base URL for all tests */
    baseURL: process.env.PORTAL_BASE_URL || 'https://portal.requitygroup.com',

    /* Capture traces on first retry */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on first retry */
    video: 'on-first-retry',

    /* Default navigation timeout */
    navigationTimeout: 30_000,

    /* Default action timeout */
    actionTimeout: 15_000,
  },

  projects: [
    /* --- Authentication setup --- */
    {
      name: 'borrower-auth',
      testMatch: /.*\.setup\.ts/,
      grep: /@borrower-setup/,
    },
    {
      name: 'investor-auth',
      testMatch: /.*\.setup\.ts/,
      grep: /@investor-setup/,
    },

    /* --- Desktop Chrome tests --- */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*responsive.*/,
    },

    /* --- Mobile viewport tests --- */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*responsive.*/,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testMatch: /.*responsive.*/,
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
      testMatch: /.*responsive.*/,
    },
  ],
});
