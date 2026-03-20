/**
 * Derive the public-facing origin from an incoming request.
 *
 * On platforms like Netlify the internal `request.url` may contain a deploy-
 * specific hostname (e.g. `69aeea…--borrower.netlify.app`) rather than the
 * custom domain the user actually visited (`app.requitygroup.com`).
 *
 * This helper prefers the `x-forwarded-host` / `host` headers which always
 * reflect the real front-end hostname, falling back to `request.url` only as
 * a last resort.
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");

  if (forwardedHost) {
    // Determine protocol: trust x-forwarded-proto if present, default to https
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      "https";
    // host header may include a port — keep it as-is
    return `${proto}://${forwardedHost}`;
  }

  // Fallback: use the origin from the raw URL
  return new URL(request.url).origin;
}
