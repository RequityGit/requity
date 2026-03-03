import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

/**
 * Broken link checker — crawls internal links on key pages
 * and flags any that return 404, 500, or other error status codes.
 */

interface LinkResult {
  source: string;
  href: string;
  status: number | 'error';
  error?: string;
}

async function collectInternalLinks(
  page: import('@playwright/test').Page,
  url: string,
  baseURL: string,
): Promise<string[]> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const links = await page.evaluate((base) => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    return anchors
      .map((a) => a.getAttribute('href') || '')
      .filter((href) => {
        // Only internal links
        if (!href) return false;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (href.startsWith('http') && !href.startsWith(base)) return false;
        return true;
      })
      .map((href) => {
        if (href.startsWith('/')) return href;
        if (href.startsWith(base)) return new URL(href).pathname;
        return href;
      });
  }, baseURL);

  // Deduplicate
  return [...new Set(links)];
}

test.describe('Broken link check — public pages', () => {
  test('login page has no broken internal links', async ({ page, baseURL }) => {
    const base = baseURL || 'https://portal.requitygroup.com';
    const links = await collectInternalLinks(page, '/login', base);

    const brokenLinks: LinkResult[] = [];

    for (const href of links) {
      try {
        const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        const status = response?.status() || 0;

        if (status >= 400) {
          brokenLinks.push({ source: '/login', href, status });
        }
      } catch (err) {
        brokenLinks.push({
          source: '/login',
          href,
          status: 'error',
          error: String(err),
        });
      }
    }

    if (brokenLinks.length > 0) {
      const report = brokenLinks
        .map((l) => `  ${l.status} — ${l.href} (from ${l.source})`)
        .join('\n');
      expect(brokenLinks, `Broken links found:\n${report}`).toHaveLength(0);
    }
  });
});

test.describe('Broken link check — borrower pages', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.BORROWER_EMAIL;
    if (!email) {
      test.skip();
      return;
    }
    await loginAsUser(page, email);
  });

  test('borrower dashboard has no broken internal links', async ({ page, baseURL }) => {
    const base = baseURL || 'https://portal.requitygroup.com';
    const pagesToCheck = ['/borrower/dashboard', '/borrower/draws', '/borrower/payments', '/borrower/documents'];
    const brokenLinks: LinkResult[] = [];
    const checkedLinks = new Set<string>();

    for (const sourcePage of pagesToCheck) {
      const links = await collectInternalLinks(page, sourcePage, base);

      for (const href of links) {
        // Skip already-checked links
        if (checkedLinks.has(href)) continue;
        checkedLinks.add(href);

        try {
          const response = await page.goto(href, {
            waitUntil: 'domcontentloaded',
            timeout: 15_000,
          });
          const status = response?.status() || 0;

          // 404 or 500+ is broken, redirects to login mean auth issue
          if (status >= 400) {
            brokenLinks.push({ source: sourcePage, href, status });
          }
        } catch (err) {
          brokenLinks.push({
            source: sourcePage,
            href,
            status: 'error',
            error: String(err),
          });
        }
      }
    }

    if (brokenLinks.length > 0) {
      const report = brokenLinks
        .map((l) => `  ${l.status} — ${l.href} (from ${l.source})`)
        .join('\n');
      expect(brokenLinks, `Broken links found:\n${report}`).toHaveLength(0);
    }
  });
});

test.describe('Broken link check — investor pages', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.INVESTOR_EMAIL;
    if (!email) {
      test.skip();
      return;
    }
    await loginAsUser(page, email);
  });

  test('investor pages have no broken internal links', async ({ page, baseURL }) => {
    const base = baseURL || 'https://portal.requitygroup.com';
    const pagesToCheck = ['/investor/dashboard', '/investor/funds', '/investor/documents'];
    const brokenLinks: LinkResult[] = [];
    const checkedLinks = new Set<string>();

    for (const sourcePage of pagesToCheck) {
      const links = await collectInternalLinks(page, sourcePage, base);

      for (const href of links) {
        if (checkedLinks.has(href)) continue;
        checkedLinks.add(href);

        try {
          const response = await page.goto(href, {
            waitUntil: 'domcontentloaded',
            timeout: 15_000,
          });
          const status = response?.status() || 0;

          if (status >= 400) {
            brokenLinks.push({ source: sourcePage, href, status });
          }
        } catch (err) {
          brokenLinks.push({
            source: sourcePage,
            href,
            status: 'error',
            error: String(err),
          });
        }
      }
    }

    if (brokenLinks.length > 0) {
      const report = brokenLinks
        .map((l) => `  ${l.status} — ${l.href} (from ${l.source})`)
        .join('\n');
      expect(brokenLinks, `Broken links found:\n${report}`).toHaveLength(0);
    }
  });
});
