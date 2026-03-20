import type { Metadata } from "next";
import { fetchSiteData } from "../../lib/supabase";
import type { Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What investors say about Requity Group. Real feedback from partners in our equity and lending programs.",
  openGraph: {
    title: "Testimonials | Requity Group",
    description:
      "What investors say about Requity Group. Real feedback from partners in our equity and lending programs.",
  },
};

export const revalidate = 300;

export default async function TestimonialsPage() {
  const testimonials = await fetchSiteData<Testimonial>("site_testimonials", {
    eq: ["is_published", true],
  });

  return (
    <main>
      <PageHero
        label="Testimonials"
        headline="What our investors say"
        body="Hear from partners who have invested with Requity Group in equity and credit strategies."
      />

      {testimonials.length > 0 ? (
        <section className="cream-zone section-pad-lg">
          <div className="container">
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                }}
              >
                {testimonials.map((t) => (
                  <div key={t.id} className="test-card">
                    <div className="big-q">&ldquo;</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : (
        <section className="cream-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                <SectionLabel>Testimonials</SectionLabel>
                <p className="type-body" style={{ color: "var(--text-mid)", marginTop: 16 }}>
                  Investor testimonials will be published here. Check back soon or reach out to learn more about working with us.
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
