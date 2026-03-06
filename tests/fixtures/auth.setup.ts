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

  // Call the Supabase Auth REST API to get a session
  const response = await page.request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      data: { email, password },
    }
  );

  expect(response.ok()).toBeTruthy();

  const session = await response.json();
  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;

  expect(accessToken).toBeTruthy();
  expect(refreshToken).toBeTruthy();

  // Set Supabase auth cookies that the SSR middleware expects
  const domain = new URL(process.env.BASE_URL!).hostname;
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // Supabase SSR stores the session as a base64-encoded JSON cookie
  const sessionPayload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  // Supabase SSR splits large cookies into chunks
  const encoded = Buffer.from(sessionPayload).toString("base64");
  const chunkSize = 3180; // Supabase default chunk size
  const chunks = [];
  for (let i = 0; i < encoded.length; i += chunkSize) {
    chunks.push(encoded.slice(i, i + chunkSize));
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
