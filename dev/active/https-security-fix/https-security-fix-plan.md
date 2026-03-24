# HTTPS "Not Secure" Warning Fix - Diagnostic & Infrastructure Plan

## Objective
Resolve the "Not Secure" Chrome warning on portal.requitygroup.com by identifying and fixing the infrastructure-level root cause (DNS/CDN/SSL configuration), not code-level issues.

## Background
Four code-level attempts have failed:
- PR #684: netlify.toml redirects
- PR #660: Security headers
- PR #687: Middleware x-forwarded-proto checks
- Commit 3aedc0a: SW cache busting

The certificate IS valid. The page loads content fine. This is a transport-layer/DNS-chain issue.

## Diagnosis Summary

### What the code already has (correctly configured):
1. **netlify.toml**: HSTS header with `max-age=31536000; includeSubDomains; preload`
2. **netlify.toml**: CSP with `upgrade-insecure-requests`
3. **next.config.mjs**: Same HSTS + CSP headers duplicated at Next.js level
4. **next.config.mjs**: Cache-Control `no-cache, must-revalidate` for HTML
5. **sw.js**: Network-first fetch strategy, cache version bumped to v2
6. **@netlify/plugin-nextjs**: Installed and configured

All of these are correct and should work. The problem is NOT in the code.

## Root Cause Hypotheses (ranked by likelihood)

### 1. Cloudflare Proxy with "Flexible" SSL (MOST LIKELY)
If `requitygroup.com` uses Cloudflare nameservers with the proxy (orange cloud) enabled and SSL mode set to "Flexible":
- Cloudflare terminates HTTPS from the browser
- Cloudflare connects to Netlify over plain HTTP
- Netlify sees the request as HTTP, not HTTPS
- The `x-forwarded-proto` header says `http`
- Chrome may show "Not Secure" if the initial connection isn't properly upgraded

**Fix**: In Cloudflare Dashboard > SSL/TLS > Overview, change mode from "Flexible" to "Full (Strict)". Or disable the Cloudflare proxy (grey cloud the DNS record) and let Netlify handle SSL directly.

### 2. DNS Not Pointing to Netlify (CNAME misconfiguration)
If `portal.requitygroup.com` has an A record pointing to a non-Netlify IP instead of a CNAME to `<site>.netlify.app`:
- Netlify can't provision/renew the Let's Encrypt certificate
- The custom domain falls back to HTTP

**Fix**: In DNS provider, set `portal.requitygroup.com` as a CNAME to your Netlify site's subdomain (e.g., `requity-os.netlify.app`).

### 3. Netlify SSL Certificate Not Provisioned for Custom Domain
Even if DNS is correct, Netlify's Let's Encrypt cert can silently fail to provision.

**Fix**: Netlify Dashboard > Domain Management > HTTPS > click "Renew certificate" or "Verify DNS configuration".

### 4. Mixed Content / HSTS Preload Not Yet Active
The HSTS preload header is set, but the domain may not be submitted to the HSTS preload list. Without preload list inclusion, the first visit is still over HTTP.

**Fix**: Submit domain at https://hstspreload.org/ after confirming HTTPS works.

## Diagnostic Steps (Must Be Done by Human with Dashboard Access)

### Step 1: Check DNS Chain
Run from any terminal with internet access:
```bash
dig portal.requitygroup.com +trace
dig portal.requitygroup.com CNAME
dig requitygroup.com NS
```

**What to look for:**
- NS records: Are they `*.ns.cloudflare.com`? If yes, Cloudflare manages DNS.
- CNAME: Does `portal` CNAME to `*.netlify.app`? If not, that's the issue.
- A record IPs: Do they resolve to Netlify IPs (75.2.60.5, 99.83.190.102) or Cloudflare IPs (104.x.x.x, 172.x.x.x)?

### Step 2: Check Cloudflare Settings (if Cloudflare is the DNS provider)
1. Log into Cloudflare Dashboard
2. Select `requitygroup.com`
3. Go to DNS > Records
4. Find the `portal` record:
   - Is the proxy (orange cloud) ON or OFF?
   - **If ON**: Go to SSL/TLS > Overview. What is the SSL mode?
     - "Flexible" = **THIS IS THE BUG**. Change to "Full (Strict)"
     - "Full" = Should work but "Full (Strict)" is better
   - **If OFF** (grey cloud): DNS passes through to Netlify directly. Issue is elsewhere.

### Step 3: Check Netlify Domain Settings
1. Log into Netlify Dashboard
2. Go to the requity-os site
3. Domain Management:
   - Is `portal.requitygroup.com` listed as a custom domain?
   - Does it show as "Primary domain" or just an alias?
   - Any warnings about DNS verification?
4. HTTPS section:
   - Does it say "Your site has HTTPS enabled"?
   - Is the certificate "Active" or "Pending"?
   - Click "Renew certificate" if available

### Step 4: Verify Netlify Subdomain Works
Visit `https://requity-os.netlify.app` (or whatever the Netlify subdomain is) directly in Chrome:
- If it shows as secure: the issue is in the custom domain DNS chain
- If it also shows "Not Secure": there's a deeper Netlify config issue

### Step 5: Test with curl
```bash
# Check if HTTP redirects to HTTPS
curl -I http://portal.requitygroup.com

# Check HTTPS certificate details
curl -vI https://portal.requitygroup.com 2>&1 | grep -E "SSL|certificate|issuer|subject"

# Check what server is responding
curl -sI https://portal.requitygroup.com | grep -i server
```

## Scope
- IN: DNS configuration, Cloudflare settings, Netlify domain/SSL settings
- OUT: Any code changes (headers, redirects, middleware, SW)

## Success Criteria
- `https://portal.requitygroup.com` shows lock icon in Chrome
- `http://portal.requitygroup.com` redirects to HTTPS (301)
- `curl -I http://portal.requitygroup.com` returns 301 to https://
- No "Not Secure" warning for any user
