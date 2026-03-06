import { test as base, expect } from "@playwright/test";
import path from "path";

// Stored auth state paths (written by auth.setup.ts)
export const BORROWER_STATE = path.resolve(
  __dirname,
  "../.auth/borrower.json"
);
export const INVESTOR_STATE = path.resolve(
  __dirname,
  "../.auth/investor.json"
);
export const ADMIN_STATE = path.resolve(__dirname, "../.auth/admin.json");

// ── Role-scoped test fixtures ──────────────────────────────────────────────

type RoleFixtures = {
  borrowerPage: import("@playwright/test").Page;
  investorPage: import("@playwright/test").Page;
  adminPage: import("@playwright/test").Page;
};

export const test = base.extend<RoleFixtures>({
  borrowerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: BORROWER_STATE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  investorPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: INVESTOR_STATE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: ADMIN_STATE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };

// ── Shared helpers ─────────────────────────────────────────────────────────

/** Wait for the authenticated layout shell (sidebar) to be visible */
export async function waitForAppShell(page: import("@playwright/test").Page) {
  // The sidebar or topbar should render once the layout mounts
  await page.waitForSelector('[class*="sidebar"], nav, [role="navigation"]', {
    timeout: 15_000,
  });
}

/** Collect all internal links on the current page */
export async function collectInternalLinks(
  page: import("@playwright/test").Page
): Promise<string[]> {
  const baseUrl = process.env.BASE_URL || "https://portal.requitygroup.com";
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => a.getAttribute("href") ?? "")
  );
  return [
    ...new Set(
      links.filter(
        (href) =>
          href.startsWith("/") ||
          href.startsWith(baseUrl)
      )
    ),
  ];
}

/** Assert no console errors on the page (ignoring expected noisy ones) */
export async function assertNoConsoleErrors(
  page: import("@playwright/test").Page
) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known noisy errors
      if (
        text.includes("Failed to load resource") ||
        text.includes("favicon") ||
        text.includes("hydration")
      ) {
        return;
      }
      errors.push(text);
    }
  });
  return errors;
}
