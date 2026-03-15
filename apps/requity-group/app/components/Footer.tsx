import Link from "next/link";
import type { NavItem, CompanyInfo } from "../../lib/types";
import FooterSubscribe from "./FooterSubscribe";
import { Phone, Mail, MapPin, Linkedin, Youtube } from "lucide-react";

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

const INVESTOR_LOGIN_URL = "https://investors.appfolioim.com/trg/investor/login";

const DEFAULT_CONTACT = {
  phone: "813.288.0636",
  email: "contact@requitygroup.com",
  address: "401 E Jackson St Ste 3300 Tampa, FL 33602",
};

const DEFAULT_SOCIAL = {
  linkedin: "https://www.linkedin.com/company/requitygroup",
  youtube: "https://www.youtube.com/@requitygroup",
};

export default function Footer({
  navItems,
  company,
}: {
  navItems: NavItem[];
  company: CompanyInfo | null;
}) {
  const phone = company?.phone ?? DEFAULT_CONTACT.phone;
  const email = company?.email ?? DEFAULT_CONTACT.email;
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
  ]);
  const quickLinks = [
    ...allNavLinks
      .filter((i) => !quickLinksExcluded.has(i.label))
      .map((i) => ({
        label: i.label,
        url: i.label === "Investor Login" ? INVESTOR_LOGIN_URL : i.url,
      })),
    { label: "Portfolio", url: "/portfolio" },
    { label: "Testimonials", url: "/testimonials" },
    { label: "Insights", url: "/insights" },
    { label: "Investor Sign Up", url: "/invest" },
    { label: "Contact", url: `mailto:${email}` },
  ];
  const deduped = quickLinks.filter(
    (item, idx, arr) => arr.findIndex((t) => t.label === item.label) === idx
  );
  const hasInvestorLogin = deduped.some((l) => l.label === "Investor Login");
  if (!hasInvestorLogin) {
    deduped.push({ label: "Investor Login", url: INVESTOR_LOGIN_URL });
  }

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
                <Linkedin size={20} strokeWidth={2} />
              </a>
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer-social-btn footer-social-btn-youtube"
              >
                <Youtube size={20} strokeWidth={2} />
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
