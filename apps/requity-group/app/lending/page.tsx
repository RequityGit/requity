import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type { PageSection, LoanProgram, SiteStat, Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import AnimatedLine from "../components/AnimatedLine";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import FAQSchema from "../components/FAQSchema";
import FAQSection from "../components/FAQSection";
import RetellChatWidget from "../components/RetellChatWidget";
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
  Clock,
  Shield,
  Handshake,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Requity Lending | Bridge Loans for Real Estate",
  description:
    "Bridge loans for commercial and residential real estate from an operator who understands your deal. Close in as little as 7 days. Term sheets in 24 hours.",
  openGraph: {
    title: "Requity Lending | Bridge Loans for Real Estate",
    description:
      "Bridge loans by real operators. Close in 7 days. CRE bridge, manufactured housing, RV parks, multifamily financing. Up to 90% LTC.",
  },
  twitter: {
    title: "Requity Lending | Bridge Loans for Real Estate",
    description:
      "Bridge loans by real operators. Close in 7 days. CRE bridge, manufactured housing, RV parks, multifamily financing.",
  },
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Fast Execution": <Zap size={22} />,
  "Certainty of Close": <Shield size={22} />,
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
      "Complete our simple deal submission form with your property and project details. No credit pull, no commitment.",
  },
  {
    title: "Receive a Term Sheet",
    description:
      "Our team reviews your request and delivers a term sheet within 24 hours of receiving a complete package.",
  },
  {
    title: "Underwriting & Diligence",
    description:
      "We conduct property-level due diligence and finalize loan documents with clear, direct communication throughout.",
  },
  {
    title: "Close & Fund",
    description:
      "Funds are wired at closing. Most deals close in 7-14 days from term sheet acceptance.",
  },
];

const LENDING_STATS = [
  { label: "Fastest Close Option", value: "7 Days" },
  { label: "Term Sheet Turnaround", value: "24 Hrs" },
  { label: "Max LTC", value: "90%" },
  { label: "Loans Funded", value: "70+" },
];

export default async function LendingPage() {
  const [sections, programs, testimonials] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "lending" },
    }),
    fetchSiteData<LoanProgram>("site_loan_programs", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whySection = sections.find((s) => s.section_key === "why");
  const benefits =
    (whySection?.metadata?.benefits as Array<{
      title: string;
      description: string;
    }>) ?? [];

  const getFirstName = (name: string) => (name ?? "").trim().split(/\s+/)[0] ?? "";
  const getLastInitial = (name: string) => {
    const parts = (name ?? "").trim().split(/\s+/);
    return parts.length > 1 ? `${parts[parts.length - 1]?.[0]?.toUpperCase()}.` : "";
  };
  const featuredTestimonials = testimonials
    .filter((t) => t.category === "borrower" && t.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);

  const lendingFAQs = [
    {
      question: "How fast can Requity Lending close a bridge loan?",
      answer: "Requity Lending can close bridge loans in as few as 10 business days from signed term sheet to funding. Most deals close within 7-14 days of term sheet acceptance.",
    },
    {
      question: "What is the interest rate on Requity bridge loans?",
      answer: "Requity bridge loans are 12% interest-only. Terms are standardized for speed and certainty of execution.",
    },
    {
      question: "What property types does Requity Lending finance?",
      answer: "Requity Lending finances commercial real estate including multifamily, mixed-use, retail, and industrial properties. We also specialize in manufactured housing communities, mobile home parks, residential fix-and-flip, and ground-up construction projects.",
    },
    {
      question: "What is the loan size range for Requity bridge loans?",
      answer: "Requity bridge loans range from $250,000 to $10,000,000. Loan-to-value ratios up to 75-80% of purchase price are available depending on property type and borrower experience.",
    },
    {
      question: "Does Requity Lending finance mobile home parks and manufactured housing communities?",
      answer: "Yes. Manufactured housing communities are one of Requity Lending's most active categories. We finance MHP acquisitions including parks with park-owned homes, and we structure improvement holdbacks for value-add execution plans.",
    },
    {
      question: "What is the typical term length for a Requity bridge loan?",
      answer: "Bridge loan terms are typically 12 to 24 months with interest-only payments. Extension options are available depending on the deal structure and exit strategy.",
    },
    {
      question: "How quickly can I get a term sheet from Requity Lending?",
      answer: "Requity Lending delivers term sheets within 48 hours of receiving a complete deal package. Initial responses to inquiries are provided within 24 hours.",
    },
    {
      question: "Does Requity Lending require a credit check to get a term sheet?",
      answer: "No. Requity Lending does not pull credit to issue a preliminary term sheet. You can submit your deal for review with no credit pull and no commitment.",
    },
  ];

  return (
    <main>
      <FAQSchema faqs={lendingFAQs} />
      {/* HERO */}
      <PageHero
        label="Bridge Lending"
        headline={
          hero?.heading ? (
            renderEmText(hero.heading)
          ) : (
            <>
              Close in{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                7 days
              </em>
              , not 10 weeks
            </>
          )
        }
        body={
          hero?.body_text ??
          "Residential and commercial bridge loans from an operator who understands your deal. Direct communication, fast execution, certainty of close."
        }
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Get Your Quote <ArrowRight size={16} />
            </Link>
            <a href="#programs" className="btn-editorial-light">
              View Programs <span className="arrow">&rarr;</span>
            </a>
          </div>
        }
      />

      {/* STATS BAR */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <AnimatedLine light />
          <div className="stats-grid on-navy">
            {LENDING_STATS.map((stat) => (
              <div key={stat.label} className="stat-cell">
                <div className="stat-num gold">{stat.value}</div>
                <div className="stat-lbl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY REQUITY LENDING */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>Why Us</SectionLabel>
              </div>
              <div>
                <h2
                  className="type-h2"
                  style={{ color: "var(--text)", marginBottom: 32 }}
                >
                  {whySection?.heading
                    ? renderEmText(whySection.heading)
                    : "Built by operators, for operators"}
                </h2>
                <p
                  className="type-body"
                  style={{
                    color: "var(--text-mid)",
                    maxWidth: 680,
                    marginBottom: 44,
                  }}
                >
                  {whySection?.body_text ??
                    "We invest in real estate ourselves, so we understand your deal from both sides of the table. That means faster decisions, smarter structuring, and a lender who speaks your language."}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24,
              }}
            >
              {benefits.length > 0
                ? benefits.map((b) => (
                    <div key={b.title} className="value-item">
                      <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                        {BENEFIT_ICONS[b.title] ?? <Zap size={22} />}
                      </div>
                      <h4>{b.title}</h4>
                      <p>{b.description}</p>
                    </div>
                  ))
                : [
                    {
                      icon: <Clock size={22} />,
                      title: "Fast Execution",
                      desc: "Term sheets in 24 hours, closings in as fast as 7 business days. We move at the speed your deal requires.",
                    },
                    {
                      icon: <Shield size={22} />,
                      title: "Certainty of Close",
                      desc: "Direct balance sheet lender with capital ready to deploy. No last-minute surprises or committee delays.",
                    },
                    {
                      icon: <HardHat size={22} />,
                      title: "Operator Mentality",
                      desc: "We invest in real estate too. We understand renovation timelines, lease-up risk, and exit strategies firsthand.",
                    },
                    {
                      icon: <Handshake size={22} />,
                      title: "Direct Access",
                      desc: "Talk to decision-makers from day one. No call centers, no layers of bureaucracy, no runaround.",
                    },
                  ].map((b) => (
                    <div key={b.title} className="value-item">
                      <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                        {b.icon}
                      </div>
                      <h4>{b.title}</h4>
                      <p>{b.desc}</p>
                    </div>
                  ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ padding: "0 0 24px" }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* LOAN PROGRAMS */}
      <section id="programs" className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Loan Programs</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Flexible bridge{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                financing
              </em>
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 600,
                marginBottom: 56,
              }}
            >
              Tailored loan structures for residential, commercial, and
              value-add projects. Every program is backed by our direct lending
              balance sheet.
            </p>
          </ScrollReveal>

          {/* ── Program Directory ── */}
          <ScrollReveal>
            <div className="program-directory">
              {/* Specialty Asset Classes */}
              <div className="program-group">
                <div className="program-group-header">
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 4 }}>
                    Specialty Asset Classes
                  </p>
                  <p className="type-body-sm" style={{ color: "var(--text-light)" }}>
                    Deep sector expertise in asset classes conventional lenders avoid
                  </p>
                </div>
                <div className="program-list">
                  {[
                    { name: "Manufactured Housing", tagline: "MHC and mobile home park acquisitions, infill, and repositioning", href: "/lending/manufactured-housing" },
                    { name: "RV Parks & Campgrounds", tagline: "Park acquisitions, site expansion, and seasonal asset financing", href: "/lending/rv-parks" },
                    { name: "Small Bay Industrial", tagline: "Multi-tenant flex space, light manufacturing, and conversions", href: "/lending/small-bay-industrial" },
                    { name: "Industrial Outdoor Storage", tagline: "Truck yards, container depots, equipment storage, and open-air sites", href: "/lending/industrial-outdoor-storage" },
                  ].map((item) => (
                    <Link key={item.name} href={item.href} className="program-row">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                      <ArrowRight size={16} className="program-row-arrow" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Commercial Bridge */}
              <div className="program-group">
                <div className="program-group-header">
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 4 }}>
                    Commercial Bridge
                  </p>
                  <p className="type-body-sm" style={{ color: "var(--text-light)" }}>
                    Acquisition and repositioning capital for all commercial property types
                  </p>
                </div>
                <div className="program-list">
                  {[
                    { name: "Multifamily", tagline: "Apartment buildings, 5+ units, value-add renovations and lease-up", href: "/lending/multifamily" },
                    { name: "CRE Bridge", tagline: "Self storage, retail, mixed-use, office, and other commercial assets", href: "/lending/commercial-bridge" },
                  ].map((item) => (
                    <Link key={item.name} href={item.href} className="program-row">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                      <ArrowRight size={16} className="program-row-arrow" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Residential */}
              <div className="program-group">
                <div className="program-group-header">
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 4 }}>
                    Residential (1-4 Units)
                  </p>
                  <p className="type-body-sm" style={{ color: "var(--text-light)" }}>
                    Fix-and-flip, rental, and new construction financing for residential investors
                  </p>
                </div>
                <div className="program-list">
                  {[
                    { name: "Fix & Flip", tagline: "Short-term renovation and resale, up to 90% LTC, draw-based rehab", href: "/lending/fix-and-flip" },
                    { name: "New Construction", tagline: "Ground-up residential and commercial, draw schedule based", href: "/lending/new-construction" },
                  ].map((item) => (
                    <Link key={item.name} href={item.href} className="program-row">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                      <ArrowRight size={16} className="program-row-arrow" />
                    </Link>
                  ))}
                  {[
                    { name: "DSCR Rental", tagline: "Long-term rental loans qualified on property cash flow, 30-year fixed available" },
                  ].map((item) => (
                    <div key={item.name} className="program-row program-row-static">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Services */}
              <div className="program-group">
                <div className="program-group-header">
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 4 }}>
                    Additional Services
                  </p>
                  <p className="type-body-sm" style={{ color: "var(--text-light)" }}>
                    Complementary capital solutions beyond direct bridge lending
                  </p>
                </div>
                <div className="program-list">
                  {[
                    { name: "Guarantor Support", tagline: "Balance sheet and experience support, 1.5-2.5% of loan balance for non-recourse", href: "/lending/guarantor-support" },
                    { name: "Transactional Funding", tagline: "Same-day capital for wholesale double closes, 1-2% of loan balance", href: "/lending/transactional-funding" },
                  ].map((item) => (
                    <Link key={item.name} href={item.href} className="program-row">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                      <ArrowRight size={16} className="program-row-arrow" />
                    </Link>
                  ))}
                  {[
                    { name: "Capital Advisory", tagline: "Permanent takeout financing placement, connecting borrowers with long-term capital partners" },
                  ].map((item) => (
                    <div key={item.name} className="program-row program-row-static">
                      <div className="program-row-content">
                        <span className="program-row-name">{item.name}</span>
                        <span className="program-row-divider" />
                        <span className="program-row-tagline">{item.tagline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PROCESS */}
      <section
        className="dark-zone section-pad-lg"
        style={{ overflow: "hidden" }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div
          className="container"
          style={{ position: "relative", zIndex: 1 }}
        >
          <ScrollReveal>
            <SectionLabel light>Our Process</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "#fff", marginBottom: 16 }}
            >
              From submission to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                funding
              </em>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                maxWidth: 560,
                marginBottom: 56,
              }}
            >
              We have streamlined our process to get you from application to
              closing as quickly as possible, with clear communication at every
              step.
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
              {PROCESS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="card-navy"
                  style={{ padding: "36px 32px" }}
                >
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
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.75,
                      color: "var(--navy-text-mid)",
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {featuredTestimonials.length > 0 && (
        <section className="cream-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <SectionLabel>Testimonials</SectionLabel>
              <h2
                className="type-h2"
                style={{ color: "var(--text)", marginBottom: 48 }}
              >
                Trusted by borrowers and brokers
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                }}
              >
                {featuredTestimonials.map((t) => (
                  <div key={t.id} className="test-card">
                    <div className="big-q">&ldquo;</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{getFirstName(t.author_name)} {getLastInitial(t.author_name)}, Borrower</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="light-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>
              Frequently asked questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={lendingFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a deal?{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Let&apos;s talk.
            </em>
          </>
        }
        body="Submit your deal details and our lending team will deliver a term sheet within 24 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Get Your Quote <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/invest" className="btn-secondary">
            Looking to Invest? <ArrowRight size={16} />
          </Link>
        }
      />
      <RetellChatWidget />
    </main>
  );
}
