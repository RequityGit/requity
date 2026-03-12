import Link from "next/link";
import type { NavItem, CompanyInfo } from "../../lib/types";

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg";

export default function Footer({
  navItems,
  company,
}: {
  navItems: NavItem[];
  company: CompanyInfo | null;
}) {
  const companyLinks = navItems.filter(
    (i) => i.menu_location === "footer_company"
  );
  const serviceLinks = navItems.filter(
    (i) => i.menu_location === "footer_services"
  );
  const resourceLinks = navItems.filter(
    (i) => i.menu_location === "footer_resources"
  );

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="nav-logo">
              <img src={LOGO_URL} alt="Requity Group" />
            </Link>
            <p>{company?.tagline}</p>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            {companyLinks.map((item) => (
              <Link key={item.id} href={item.url}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            {serviceLinks.map((item) => (
              <Link key={item.id} href={item.url}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            {resourceLinks.map((item) => {
              const isExternal =
                item.url.startsWith("http") || item.url.startsWith("mailto");
              return isExternal ? (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.id} href={item.url}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} {company?.company_name}. All
            rights reserved.
          </p>
          <div className="footer-contact">
            {company?.phone && <a href={`tel:${company.phone}`}>{company.phone}</a>}
            {company?.phone && company?.email && " | "}
            {company?.email && (
              <a href={`mailto:${company.email}`}>{company.email}</a>
            )}
            {company?.address_line1 && (
              <>
                <br />
                {company.address_line1}
                {company.address_line2 ? `, ${company.address_line2}` : ""}
                {company.city ? `, ${company.city}` : ""}
                {company.state ? `, ${company.state}` : ""}{" "}
                {company.zip || ""}
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
