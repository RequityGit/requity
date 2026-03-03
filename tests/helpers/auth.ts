import { type Page, type BrowserContext } from '@playwright/test';

/**
 * Authenticate a user by calling the Supabase GoTrue API directly,
 * then injecting the session cookies into the browser context.
 *
 * This avoids going through the UI magic-link flow for every test.
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.test',
    );
  }

  if (!email || !password) {
    throw new Error(
      'Email and password must be provided. Check your .env.test file.',
    );
  }

  // Call Supabase Auth REST API to get a session
  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase auth failed for ${email}: ${response.status} ${body}`,
    );
  }

  const data = await response.json();
  const accessToken: string = data.access_token;
  const refreshToken: string = data.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('Supabase auth response missing tokens');
  }

  const baseURL = process.env.PORTAL_BASE_URL || 'https://portal.requitygroup.com';
  const domain = new URL(baseURL).hostname;

  // Supabase SSR stores auth in cookies. Set them so the Next.js middleware
  // picks up the session on the next navigation.
  const cookieBase = {
    domain,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax' as const,
  };

  // Supabase SSR uses chunked cookies with the project ref in the name.
  // The cookie name pattern is: sb-<project-ref>-auth-token
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionPayload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
    token_type: 'bearer',
    type: 'access',
    user: data.user,
  });

  // Supabase SSR may chunk cookies if they exceed ~3500 chars.
  // For most tokens, a single cookie suffices.
  const chunkSize = 3500;
  const chunks = [];
  for (let i = 0; i < sessionPayload.length; i += chunkSize) {
    chunks.push(sessionPayload.slice(i, i + chunkSize));
  }

  const context = page.context();

  if (chunks.length === 1) {
    await context.addCookies([
      { ...cookieBase, name: `${cookieName}.0`, value: chunks[0] },
    ]);
  } else {
    const cookies = chunks.map((chunk, idx) => ({
      ...cookieBase,
      name: `${cookieName}.${idx}`,
      value: chunk,
    }));
    await context.addCookies(cookies);
  }
}

/**
 * Helper to check if required environment variables are set.
 * Call at the top of test files that need auth.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required. See .env.test.example`);
  }
  return value;
}
