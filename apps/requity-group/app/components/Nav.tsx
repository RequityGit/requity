"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "../../lib/types";

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

const INVESTOR_LOGIN_URL = "https://investors.appfolioim.com/trg/investor/login";
const CONTACT_EMAIL = "contact@requitygroup.com";

function isActive(pathname: string, url: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(url + "/");
}

export default function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const headerItems = items.filter((i) => i.menu_location === "header");

  return (
    <>
      <nav className={`${scrolled ? "scrolled" : ""}${mobileOpen ? " nav-mobile-open" : ""}`}>
        <Link href="/" className="nav-logo">
          <img src={LOGO_URL} alt="Requity Group" />
        </Link>
        <ul className="nav-links nav-desktop">
          {headerItems.map((item) => {
            const isCta = item.label === "Investor Login";
            const isContact = item.label === "Contact";
            const href = isCta ? INVESTOR_LOGIN_URL : isContact ? `mailto:${CONTACT_EMAIL}` : item.url;
            const isExternal = href.startsWith("http") || href.startsWith("mailto:");
            const active = !isExternal && !isCta && isActive(pathname, item.url);
            return (
              <li key={item.id}>
                {isExternal ? (
                  <a
                    href={href}
                    className={isCta ? "nav-cta" : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className={[
                      isCta ? "nav-cta" : undefined,
                      active ? "nav-active" : undefined,
                    ].filter(Boolean).join(" ") || undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="nav-right">
          <button
            className={`mobile-toggle${mobileOpen ? " active" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-overlay${mobileOpen ? " open" : ""}`}>
        <div className="mobile-overlay-inner">
          {headerItems.map((item, i) => {
            const isCta = item.label === "Investor Login";
            const isContact = item.label === "Contact";
            const href = isCta ? INVESTOR_LOGIN_URL : isContact ? `mailto:${CONTACT_EMAIL}` : item.url;
            const isExternal = href.startsWith("http") || href.startsWith("mailto:");
            const active = !isExternal && !isCta && isActive(pathname, item.url);
            const cls = [
              "mobile-link",
              isCta ? "mobile-link-cta" : "",
              active ? "mobile-link-active" : "",
            ].filter(Boolean).join(" ");
            return isExternal ? (
              <a
                key={item.id}
                href={href}
                className={cls}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${i * 0.06 + 0.1}s` }}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.id}
                href={href}
                className={cls}
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${i * 0.06 + 0.1}s` }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
