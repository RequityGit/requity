import { test as setup, expect } from "@playwright/test";
import path from "path";

// Storage state file paths for each role
export const BORROWER_STATE = path.resolve(
  __dirname,
  "../.auth/borrower.json"
);
export const INVESTOR_STATE = path.resolve(
  __dirname,
  "../.auth/investor.json"
);
export const ADMIN_STATE = path.resolve(__dirname, "../.auth/admin.json");

/**
 * Authenticate via Supabase email/password using the app's login form.
 *
 * Because the production login uses magic links / Google OAuth, we rely on
 * Supabase's `signInWithPassword` via the JS client that's already on the
 * page (window.__supabase) or by navigating to a special test-auth endpoint.
 *
 * For environments where email/password auth is enabled we call the Supabase
 * REST API directly to obtain a session, then inject the tokens as cookies.
 */
async function authenticateViaSupabase(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedPathPrefix: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.test"
    );
  }

  // Validate the Supabase URL has a proper protocol
  if (!/^https?:\/\//.test(supabaseUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL has an invalid protocol: "${supabaseUrl}". ` +
        `It must start with "https://". Check your .env.test or GitHub Actions secrets.`
    );
  }

  // Call the Supabase Auth REST API to get a session (with retry for transient failures)
  const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const maxRetries = 3;
  let response: Awaited<ReturnType<typeof page.request.post>> | undefined;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await page.request.post(authUrl, {
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        data: { email, password },
      });

      if (response.ok()) break;

      // Non-retryable client errors (400-499 except 429)
      const status = response.status();
      if (status >= 400 && status < 500 && status !== 429) {
        const body = await response.text();
        throw new Error(
          `Supabase auth failed for ${email} (HTTP ${status}): ${body}. ` +
            `Check that the test user exists and password auth is enabled.`
        );
      }

      // Retryable error (5xx or 429) — wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.warn(
          `Auth attempt ${attempt}/${maxRetries} failed (HTTP ${status}), retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If it's our formatted error, rethrow immediately
      if (lastError.message.includes("Supabase auth failed")) throw lastError;
      // Network error — retry
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `Auth attempt ${attempt}/${maxRetries} threw ${lastError.message}, retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  if (!response || !response.ok()) {
    const status = response?.status() ?? "no response";
    const body = response ? await response.text() : lastError?.message ?? "unknown";
    throw new Error(
      `Supabase auth failed for ${email} after ${maxRetries} attempts (HTTP ${status}): ${body}`
    );
  }

  const session = await response.json();
  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;

  expect(accessToken).toBeTruthy();
  expect(refreshToken).toBeTruthy();

  // Set Supabase auth cookies that the SSR middleware expects
  const domain = new URL(process.env.BASE_URL!).hostname;
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // Supabase SSR stores the session as a raw JSON cookie (chunked if large)
  const sessionPayload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  // @supabase/ssr v0.5+ stores session as raw JSON, NOT base64
  const chunkSize = 3180; // Supabase default chunk size
  const chunks = [];
  for (let i = 0; i < sessionPayload.length; i += chunkSize) {
    chunks.push(sessionPayload.slice(i, i + chunkSize));
  }

  const cookies = chunks.map((chunk, index) => ({
    name: chunks.length === 1 ? cookieName : `${cookieName}.${index}`,
    value: chunk,
    domain,
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "Lax" as const,
  }));

  await page.context().addCookies(cookies);

  // Navigate to verify auth worked and we land on the expected dashboard
  await page.goto("/");
  await page.waitForURL(new RegExp(expectedPathPrefix), { timeout: 15_000 });
}

// --- Borrower auth setup ---
setup("authenticate as borrower", async ({ page }) => {
  const email = process.env.BORROWER_EMAIL;
  const password = process.env.BORROWER_PASSWORD;
  if (!email || !password) {
    throw new Error("BORROWER_EMAIL and BORROWER_PASSWORD must be set");
  }

  await authenticateViaSupabase(page, email, password, "/borrower");
  await page.context().storageState({ path: BORROWER_STATE });
});

// --- Investor auth setup ---
setup("authenticate as investor", async ({ page }) => {
  const email = process.env.INVESTOR_EMAIL;
  const password = process.env.INVESTOR_PASSWORD;
  if (!email || !password) {
    throw new Error("INVESTOR_EMAIL and INVESTOR_PASSWORD must be set");
  }

  await authenticateViaSupabase(page, email, password, "/investor");
  await page.context().storageState({ path: INVESTOR_STATE });
});

// --- Admin auth setup ---
setup("authenticate as admin", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  await authenticateViaSupabase(page, email, password, "/admin");
  await page.context().storageState({ path: ADMIN_STATE });
});
