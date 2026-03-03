import { type Page } from '@playwright/test';

/**
 * Authenticate a user by generating a session via the Supabase Admin API
 * (service role key), then injecting the session cookies into the browser.
 *
 * This bypasses magic-link / 2FA flows entirely — no password required.
 * Only an email and the SUPABASE_SERVICE_ROLE_KEY are needed.
 */
export async function loginAsUser(
  page: Page,
  email: string,
): Promise<void> {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');

  if (!email) {
    throw new Error('Email must be provided. Check your .env.test file.');
  }

  // Step 1: Use the Admin API to generate a magic-link token for the user.
  // This does NOT send an email — it just returns the hashed token.
  const linkRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/generate_link`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        type: 'magiclink',
        email,
      }),
    },
  );

  if (!linkRes.ok) {
    const body = await linkRes.text();
    throw new Error(
      `Failed to generate auth link for ${email}: ${linkRes.status} ${body}`,
    );
  }

  const linkData = await linkRes.json();
  const hashedToken: string = linkData.hashed_token;

  if (!hashedToken) {
    throw new Error(
      'Admin generate_link response missing hashed_token. ' +
      'Ensure SUPABASE_SERVICE_ROLE_KEY is a valid service role key.',
    );
  }

  // Step 2: Exchange the hashed token for a full session (access + refresh tokens).
  const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({
      token_hash: hashedToken,
      type: 'magiclink',
    }),
  });

  if (!verifyRes.ok) {
    const body = await verifyRes.text();
    throw new Error(
      `Failed to verify auth token for ${email}: ${verifyRes.status} ${body}`,
    );
  }

  const session = await verifyRes.json();
  const accessToken: string = session.access_token;
  const refreshToken: string = session.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('Auth verify response missing tokens');
  }

  // Step 3: Inject the session cookies so Next.js middleware picks them up.
  const baseURL =
    process.env.PORTAL_BASE_URL || 'https://portal.requitygroup.com';
  const domain = new URL(baseURL).hostname;

  const cookieBase = {
    domain,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax' as const,
  };

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionPayload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: 'bearer',
    type: 'access',
    user: session.user,
  });

  // Supabase SSR may chunk cookies if they exceed ~3500 chars.
  const chunkSize = 3500;
  const chunks: string[] = [];
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
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} is required. See .env.test.example`,
    );
  }
  return value;
}
