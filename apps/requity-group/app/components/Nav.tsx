"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavItem } from "../../lib/types";

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

export default function Nav({ items }: { items: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerItems = items.filter((i) => i.menu_location === "header");

  return (
    <nav className={scrolled ? "scrolled" : ""}>
      <Link href="/" className="nav-logo">
        <img src={LOGO_URL} alt="Requity Group" />
      </Link>
      <ul className={`nav-links${mobileOpen ? " open" : ""}`}>
        {headerItems.map((item) => {
          const isExternal = item.url.startsWith("http");
          const isCta = item.label === "Investor Login";
          return (
            <li key={item.id}>
              {isExternal ? (
                <a
                  href={item.url}
                  className={isCta ? "nav-cta" : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.url}
                  className={isCta ? "nav-cta" : undefined}
                  onClick={() => setMobileOpen(false)}
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
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
