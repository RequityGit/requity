import Link from "next/link";
import type { NavItem, CompanyInfo } from "../../lib/types";
import FooterSubscribe from "./FooterSubscribe";
import { Phone, Mail, MapPin } from "lucide-react";

/* Official brand SVG icons for social links */
function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function YouTubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

const DEFAULT_CONTACT = {
  phone: "813.288.0636",
  email: "contact@requitygroup.com",
  address: "401 E Jackson St Ste 3300 Tampa, FL 33602",
};

const DEFAULT_SOCIAL = {
  linkedin: "https://www.linkedin.com/company/requitygroup",
  youtube: "https://www.youtube.com/@requity",
};

export default function Footer({
  navItems,
  company,
}: {
  navItems: NavItem[];
  company: CompanyInfo | null;
}) {
  const phone = company?.phone ?? DEFAULT_CONTACT.phone;
  const email = "contact@requitygroup.com";
  const address =
    company?.address_line1 && company?.city && company?.state
      ? [
          company.address_line1,
          company.address_line2,
          [company.city, company.state].filter(Boolean).join(", "),
          company.zip,
        ]
          .filter(Boolean)
          .join(" ")
      : DEFAULT_CONTACT.address;
  const social = company?.social_links ?? DEFAULT_SOCIAL;
  const linkedin = typeof social?.linkedin === "string" ? social.linkedin : DEFAULT_SOCIAL.linkedin;
  const youtube = typeof social?.youtube === "string" ? social.youtube : DEFAULT_SOCIAL.youtube;

  const allNavLinks = navItems.filter(
    (i) =>
      i.menu_location === "footer_company" ||
      i.menu_location === "footer_services" ||
      i.menu_location === "footer_resources"
  );
  const quickLinksExcluded = new Set([
    "About",
    "Lending",
    "Team",
    "Invest",
    "Values",
    "Loan Programs",
    "Home",
    "Investor Login",
    "Contact",
    "Apply for a Loan",
  ]);
  const quickLinks = [
    { label: "Investor Sign Up", url: "/invest" },
    { label: "Loan Request", url: "/lending/apply" },
    { label: "Portfolio", url: "/portfolio" },
    { label: "Testimonials", url: "/testimonials" },
    { label: "Insights", url: "/insights" },
    ...allNavLinks
      .filter((i) => !quickLinksExcluded.has(i.label))
      .map((i) => ({ label: i.label, url: i.url })),
  ];
  const deduped = quickLinks.filter(
    (item, idx, arr) => arr.findIndex((t) => t.label === item.label) === idx
  );

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="nav-logo">
              <img src={LOGO_URL} alt="Requity Group" />
            </Link>
            {company?.tagline && <p>{company.tagline}</p>}
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            {deduped.map((item) => {
              const isExternal =
                item.url.startsWith("http") || item.url.startsWith("mailto");
              return isExternal ? (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={item.url}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="footer-col footer-contact-col">
            <h4>Contact Us</h4>
            <a href={`tel:${phone.replace(/\D/g, "")}`} className="footer-contact-item">
              <Phone size={16} className="footer-contact-icon" aria-hidden />
              <span>{phone}</span>
            </a>
            <a href={`mailto:${email}`} className="footer-contact-item">
              <Mail size={16} className="footer-contact-icon" aria-hidden />
              <span>{email}</span>
            </a>
            <span className="footer-contact-item footer-contact-address">
              <MapPin size={16} className="footer-contact-icon" aria-hidden />
              <span>{address}</span>
            </span>
            <div className="footer-social">
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="footer-social-btn footer-social-btn-linkedin"
              >
                <LinkedInIcon size={20} />
              </a>
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer-social-btn footer-social-btn-youtube"
              >
                <YouTubeIcon size={20} />
              </a>
            </div>
          </div>

          <div className="footer-col footer-subscribe-col">
            <h4>Subscribe for More Insights</h4>
            <FooterSubscribe />
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            {company?.company_name || "Requity Group"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
