import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import type { Insight } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import InsightsGrid from "../components/InsightsGrid";
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
  const { data } = await supabase
    .from("site_insights")
    .select("*")
    .eq("is_published", true)
    .eq("status", "published")
    .order("published_date", { ascending: false });

  const insights: Insight[] = (data as Insight[]) ?? [];

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
              <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 32 }}>
                Recent insights
              </h2>
            </ScrollReveal>
            <InsightsGrid insights={insights} />
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
