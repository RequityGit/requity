# HTTPS Security Fix - Tasks

## Phase 1: Code Audit (Complete)
- [x] Review netlify.toml for existing security headers
- [x] Review next.config.mjs for existing security headers
- [x] Review service worker configuration
- [x] Review previous failed PR attempts (#684, #660, #687, 3aedc0a)
- [x] Confirm all code-level fixes are already in place and correct

## Phase 2: Infrastructure Diagnosis (Requires Human)
- [ ] Run `dig portal.requitygroup.com +trace` and report DNS chain
- [ ] Check if requitygroup.com uses Cloudflare nameservers
- [ ] If Cloudflare: check SSL/TLS mode (Flexible vs Full vs Full Strict)
- [ ] If Cloudflare: check if portal record has proxy (orange cloud) enabled
- [ ] Check Netlify dashboard for custom domain SSL certificate status
- [ ] Verify the *.netlify.app subdomain works with HTTPS
- [ ] Run curl tests against both HTTP and HTTPS endpoints

## Phase 3: Apply Fix (After Diagnosis)
- [ ] Apply the appropriate fix based on diagnosis findings
- [ ] Verify HTTPS works in Chrome (lock icon visible)
- [ ] Verify HTTP-to-HTTPS redirect works (curl -I http://...)
- [ ] Test in incognito mode
- [ ] Test in multiple browsers

## Blockers
- Cannot perform live DNS lookups or network tests from code sandbox
- All diagnostic steps require dashboard access (Cloudflare, Netlify, DNS provider)

## Last Updated: 2026-03-12
