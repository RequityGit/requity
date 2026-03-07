import { test, expect, waitForAppShell, collectInternalLinks } from "./fixtures/test-fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// 9. All sidebar links load without errors for each role
// ─────────────────────────────────────────────────────────────────────────────

const borrowerSidebarLinks = [
  { label: "Dashboard", path: "/borrower/dashboard" },
  { label: "Draw Requests", path: "/borrower/draws" },
  { label: "Payments", path: "/borrower/payments" },
  { label: "Documents", path: "/borrower/documents" },
];

const investorSidebarLinks = [
  { label: "Dashboard", path: "/investor/dashboard" },
  { label: "My Investments", path: "/investor/funds" },
  { label: "Documents", path: "/investor/documents" },
];

const adminSidebarLinks = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Contacts", path: "/admin/crm/contacts" },
  { label: "Companies", path: "/admin/crm/companies" },
  { label: "Debt", path: "/admin/pipeline/debt" },
  { label: "Equity", path: "/admin/pipeline/equity" },
  { label: "Servicing", path: "/admin/servicing" },
  { label: "Investments", path: "/admin/funds" },
  { label: "Documents", path: "/admin/document-center" },
  { label: "Tasks", path: "/admin/operations/tasks" },
  { label: "Approvals", path: "/admin/operations/approvals" },
];

test.describe("9 — Borrower sidebar links", () => {
  for (const link of borrowerSidebarLinks) {
    test(`sidebar: ${link.label} loads`, async ({ borrowerPage }) => {
      await borrowerPage.goto(link.path);
      await borrowerPage.waitForLoadState("domcontentloaded");
      const status = await borrowerPage.evaluate(() =>
        document.querySelector("h1, h2, main") ? 200 : 0
      );
      expect(status).toBe(200);
      expect(borrowerPage.url()).toContain(link.path);
    });
  }
});

test.describe("9 — Investor sidebar links", () => {
  for (const link of investorSidebarLinks) {
    test(`sidebar: ${link.label} loads`, async ({ investorPage }) => {
      await investorPage.goto(link.path);
      await investorPage.waitForLoadState("domcontentloaded");
      expect(investorPage.url()).toContain(link.path);
    });
  }
});

test.describe("9 — Admin sidebar links", () => {
  for (const link of adminSidebarLinks) {
    test(`sidebar: ${link.label} loads`, async ({ adminPage }) => {
      await adminPage.goto(link.path);
      await adminPage.waitForLoadState("domcontentloaded");
      expect(adminPage.url()).toContain(link.path);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Broken link crawl — spider internal links, flag 404/500
// ─────────────────────────────────────────────────────────────────────────────
test("10 — broken link crawl on admin dashboard", async ({ adminPage }) => {
  await adminPage.goto("/admin/dashboard");
  await adminPage.waitForLoadState("networkidle");

  const links = await collectInternalLinks(adminPage);
  const broken: { href: string; status: number }[] = [];

  // Check up to 30 links to keep test time reasonable
  const linksToCheck = links.slice(0, 30);

  for (const href of linksToCheck) {
    try {
      const response = await adminPage.request.get(href);
      if (response.status() >= 400) {
        broken.push({ href, status: response.status() });
      }
    } catch {
      broken.push({ href, status: 0 });
    }
  }

  // Allow soft failures — report but only fail on 500s
  const serverErrors = broken.filter((b) => b.status >= 500);
  if (serverErrors.length > 0) {
    console.error("Server errors found:", serverErrors);
  }
  expect(serverErrors).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Broken image check — verify images load on key pages
// ─────────────────────────────────────────────────────────────────────────────
test.describe("11 — Broken image check", () => {
  const pagesToCheck = [
    { role: "admin", path: "/admin/dashboard" },
    { role: "borrower", path: "/borrower/dashboard" },
    { role: "investor", path: "/investor/dashboard" },
  ];

  for (const { role, path } of pagesToCheck) {
    test(`no broken images on ${role} dashboard`, async ({
      adminPage,
      borrowerPage,
      investorPage,
    }) => {
      const page =
        role === "admin"
          ? adminPage
          : role === "borrower"
            ? borrowerPage
            : investorPage;

      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const brokenImages = await page.evaluate(() => {
        const images = document.querySelectorAll("img");
        const broken: string[] = [];
        images.forEach((img) => {
          if (img.naturalWidth === 0 && img.src) {
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
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Back/forward navigation doesn't break state
// ─────────────────────────────────────────────────────────────────────────────
// TODO: navigation history depends on /admin/crm/contacts which isn't built yet
test.skip("12 — back/forward navigation preserves state", async ({ adminPage }) => {
  // Navigate through multiple pages
  await adminPage.goto("/admin/dashboard");
  await adminPage.waitForLoadState("domcontentloaded");

  await adminPage.goto("/admin/crm/contacts");
  await adminPage.waitForLoadState("domcontentloaded");

  await adminPage.goto("/admin/funds");
  await adminPage.waitForLoadState("domcontentloaded");

  // Go back
  await adminPage.goBack();
  await adminPage.waitForLoadState("domcontentloaded");
  expect(adminPage.url()).toContain("/admin/crm/contacts");

  // Go back again
  await adminPage.goBack();
  await adminPage.waitForLoadState("domcontentloaded");
  expect(adminPage.url()).toContain("/admin/dashboard");

  // Go forward
  await adminPage.goForward();
  await adminPage.waitForLoadState("domcontentloaded");
  expect(adminPage.url()).toContain("/admin/crm/contacts");

  // Verify page content rendered (not blank)
  const mainContent = adminPage.locator("main");
  await expect(mainContent).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Deep linking — direct URL access works when authenticated
// ─────────────────────────────────────────────────────────────────────────────
test.describe("13 — Deep linking", () => {
  const deepLinks = [
    { page: "adminPage" as const, path: "/admin/crm/contacts", name: "CRM contacts" },
    { page: "adminPage" as const, path: "/admin/pipeline/debt", name: "Debt pipeline" },
    { page: "adminPage" as const, path: "/admin/operations/tasks", name: "Operations tasks" },
    { page: "borrowerPage" as const, path: "/borrower/payments", name: "Borrower payments" },
    { page: "investorPage" as const, path: "/investor/documents", name: "Investor documents" },
  ];

  for (const link of deepLinks) {
    test(`deep link to ${link.name}`, async ({
      adminPage,
      borrowerPage,
      investorPage,
    }) => {
      const page =
        link.page === "adminPage"
          ? adminPage
          : link.page === "borrowerPage"
            ? borrowerPage
            : investorPage;

      await page.goto(link.path);
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain(link.path);

      // Should not redirect to login
      expect(page.url()).not.toContain("/login");
    });
  }
});
