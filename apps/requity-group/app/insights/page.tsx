import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { Insight } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market insights, updates, and perspectives from Requity Group on value-add real estate and lending.",
  openGraph: {
    title: "Insights | Requity Group",
    description:
      "Market insights, updates, and perspectives from Requity Group on value-add real estate and lending.",
  },
};

export const revalidate = 300;

export default async function InsightsPage() {
  const insights = await fetchSiteData<Insight>("site_insights", {
    eq: ["is_published", true],
  });

  return (
    <main>
      <PageHero
        label="Insights"
        headline="Perspectives and updates"
        body="Market insights and updates from Requity Group on value-add real estate, lending, and operations."
      />

      {insights.length > 0 ? (
        <section className="light-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <SectionLabel>Insights</SectionLabel>
              <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
                Recent insights
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                }}
              >
                {insights.map((insight) => (
                  <div key={insight.id} className="card">
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {insight.tags?.map((tag) => (
                        <span key={tag} className="insight-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="card-title" style={{ fontSize: 21 }}>
                      {insight.title}
                    </h3>
                    {insight.excerpt && (
                      <p className="card-body">{insight.excerpt}</p>
                    )}
                    {insight.published_date && (
                      <p
                        className="type-caption"
                        style={{ color: "var(--text-light)", marginTop: 12 }}
                      >
                        {new Date(insight.published_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : (
        <section className="light-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                <SectionLabel>Insights</SectionLabel>
                <p className="type-body" style={{ color: "var(--text-mid)", marginTop: 16 }}>
                  Insights and updates will be published here. Check back soon or subscribe below for updates.
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
