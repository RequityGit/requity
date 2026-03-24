import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { PortfolioProperty } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import { ArrowRight, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Our properties. Value-add real estate acquisitions across multifamily, manufactured housing, and commercial asset classes.",
  openGraph: {
    title: "Portfolio | Requity Group",
    description:
      "Our properties. Value-add real estate acquisitions across multifamily, manufactured housing, and commercial asset classes.",
  },
};

export const revalidate = 300;

export default async function PortfolioPage() {
  const properties = await fetchSiteData<PortfolioProperty>("site_portfolio_properties", {
    eq: ["is_published", true],
  });

  return (
    <main>
      <PageHero
        label="Portfolio"
        headline="Our properties"
        body="Value-add real estate we own and operate. From multifamily and manufactured housing to RV parks and commercial assets."
      />

      {properties.length > 0 ? (
        <section className="light-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <SectionLabel>Properties</SectionLabel>
              <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
                Portfolio
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 24,
                }}
              >
                {properties.map((prop) => {
                  const href = prop.detail_page_url || null;
                  const cardContent = (
                    <>
                      {prop.image_url && (
                        <div
                          className="portfolio-card-image"
                          style={{
                            backgroundImage: `url(${prop.image_url})`,
                          }}
                        />
                      )}
                      <div style={{ padding: prop.image_url ? 24 : 0 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          {prop.property_type && (
                            <span className="insight-tag">{prop.property_type}</span>
                          )}
                          {prop.status && (
                            <span
                              className="insight-tag"
                              style={{
                                background: "var(--cream-dark)",
                                color: "var(--text-mid)",
                              }}
                            >
                              {prop.status}
                            </span>
                          )}
                        </div>
                        <h3 className="card-title" style={{ fontSize: 21, marginBottom: 8 }}>
                          {prop.name}
                        </h3>
                        {prop.location && (
                          <p
                            className="type-caption"
                            style={{
                              color: "var(--text-light)",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 12,
                            }}
                          >
                            <MapPin size={14} aria-hidden />
                            {prop.location}
                          </p>
                        )}
                        {prop.description && (
                          <p className="card-body" style={{ marginBottom: 0 }}>
                            {prop.description}
                          </p>
                        )}
                        {href && (
                          <span
                            className="btn-editorial"
                            style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            View details <ArrowRight size={14} />
                          </span>
                        )}
                      </div>
                    </>
                  );
                  return (
                    <div key={prop.id} className="card portfolio-card">
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
                          {cardContent}
                        </a>
                      ) : (
                        cardContent
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : (
        <section className="light-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                <SectionLabel>Portfolio</SectionLabel>
                <p className="type-body" style={{ color: "var(--text-mid)", marginTop: 16 }}>
                  Our property portfolio will be listed here. Check back soon or contact us to learn more about our current assets.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <FooterCTA
        label="Get Started"
        headline={
          <>
            Partner with{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Requity</em>
          </>
        }
        body="We're always looking to connect with aligned investors, borrowers, and partners who share our commitment to building real value."
        primaryCta={
          <Link href="/invest" className="btn-primary">
            Invest With Us <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/lending" className="btn-secondary">
            Apply for a Loan <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
