import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type { PageSection, LoanProgram } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import FooterCTA from "../components/FooterCTA";
import {
  ArrowRight,
  Zap,
  CheckCircle,
  HardHat,
  MessageSquare,
  Send,
  FileText,
  Search,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Lending",
  description:
    "Real estate lending by real operators. Bridge loans, fix & flip, DSCR, construction, and more. Close in as little as 10 days.",
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Fast Execution": <Zap size={22} />,
  "Certainty of Close": <CheckCircle size={22} />,
  "Operator Mentality": <HardHat size={22} />,
  "Direct Communication": <MessageSquare size={22} />,
};

const PROCESS_ICONS = [
  <Send key="1" size={22} />,
  <FileText key="2" size={22} />,
  <Search key="3" size={22} />,
  <DollarSign key="4" size={22} />,
];

const PROCESS_STEPS = [
  {
    title: "Submit Your Deal",
    description:
      "Complete our simple loan request form with your deal details. No credit pull, no commitment.",
  },
  {
    title: "Receive a Term Sheet",
    description:
      "Our team reviews your request and issues a term sheet within 24 hours.",
  },
  {
    title: "Underwriting & Diligence",
    description:
      "We conduct property-level due diligence and finalize loan documents.",
  },
  {
    title: "Close & Fund",
    description:
      "Funds are wired at closing. Most deals close in 10-14 days from term sheet acceptance.",
  },
];

export default async function LendingPage() {
  const [sections, programs] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "lending" },
    }),
    fetchSiteData<LoanProgram>("site_loan_programs", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whySection = sections.find((s) => s.section_key === "why");
  const benefits = (whySection?.metadata?.benefits as Array<{ title: string; description: string }>) ?? [];

  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 220px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p
            className="section-eyebrow"
            style={{ animation: "fadeUp 0.8s ease forwards" }}
          >
            {hero?.subheading}
          </p>
          <h1
            className="section-title section-title-light"
            style={{
              fontSize: "clamp(40px, 5.5vw, 60px)",
              maxWidth: 720,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            {renderEmText(hero?.heading)}
          </h1>
          <p
            className="section-desc section-desc-light"
            style={{ animation: "fadeUp 0.8s 0.2s ease both" }}
          >
            {hero?.body_text}
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 44,
              animation: "fadeUp 0.8s 0.3s ease both",
              flexWrap: "wrap",
            }}
          >
            <a href="#apply" className="btn-primary">
              Submit a Deal <ArrowRight size={16} />
            </a>
            <a href="#programs" className="btn-secondary">
              Loan Programs
            </a>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Why Requity Lending */}
      <section className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Why Us</p>
            <h2 className="section-title">
              {renderEmText(whySection?.heading)}
            </h2>
            <p className="section-desc" style={{ marginBottom: 56 }}>
              {whySection?.body_text}
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24,
              }}
            >
              {benefits.map((b) => (
                <div key={b.title} className="value-item">
                  <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                    {BENEFIT_ICONS[b.title] ?? <Zap size={22} />}
                  </div>
                  <h4>{b.title}</h4>
                  <p>{b.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Process - Navy section for rhythm */}
      <section className="dark-zone section-pad-lg" style={{ overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <p className="section-eyebrow" style={{ color: "var(--gold-muted)" }}>Our Process</p>
            <h2 className="section-title section-title-light" style={{ marginBottom: 48 }}>
              From Application to <em>Funding</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24,
              }}
            >
              {PROCESS_STEPS.map((step, i) => (
                <div key={i} className="card-navy" style={{ padding: "36px 32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div className="step-icon">{PROCESS_ICONS[i]}</div>
                    <span className="step-label">Step {i + 1}</span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 21,
                      fontWeight: 400,
                      color: "#fff",
                      marginBottom: 12,
                      lineHeight: 1.25,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--navy-text-mid)" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Loan Programs */}
      <section id="programs" className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Loan Programs</p>
            <h2 className="section-title" style={{ marginBottom: 48 }}>
              Flexible Capital <em>Solutions</em>
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
              {programs.map((program) => (
                <div key={program.id} className="card">
                  <h3 className="card-title" style={{ fontSize: 23 }}>
                    {program.display_name}
                  </h3>
                  <p className="card-body" style={{ marginBottom: 20 }}>
                    {program.description}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {(program.features as string[]).map((feature, i) => (
                      <li key={i} className="program-feature">
                        <CheckCircle
                          size={15}
                          className="program-feature-icon"
                          style={{ flexShrink: 0 }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Apply Now"
        headline={
          <>
            Have a deal?{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Let&apos;s talk.</em>
          </>
        }
        body="Our lending team is available to discuss your project and provide a quick indication of terms. No obligation, no credit pull."
        primaryCta={
          <a href="mailto:lending@requitygroup.com" className="btn-primary">
            Contact Lending <ArrowRight size={16} />
          </a>
        }
        secondaryCta={
          <Link href="/invest" className="btn-secondary">
            Looking to Invest? <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
