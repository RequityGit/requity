import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import PageHero from "../../components/PageHero";
import FooterCTA from "../../components/FooterCTA";
import FAQSchema from "../../components/FAQSchema";
import FAQSection from "../../components/FAQSection";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Handshake,
  ShieldCheck,
  Building2,
  Landmark,
  TrendingUp,
  BadgeDollarSign,
  RefreshCw,
  Clock,
  CheckCircle,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Capital Advisory | Permanent Financing Placement | Requity Group",
  description:
    "Permanent financing placement for commercial real estate. Agency, bank, CMBS, and SBA lending connections. Complimentary for Requity bridge borrowers. Nationwide coverage.",
  openGraph: {
    title: "Capital Advisory | Permanent Financing Placement | Requity Group",
    description:
      "We connect real estate investors with the right permanent capital partner. Agency debt, bank financing, CMBS, SBA placement. Complimentary for Requity bridge borrowers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Capital Advisory | Requity Group",
    description:
      "Permanent financing placement for commercial real estate. Agency, bank, CMBS, and SBA lending connections. Nationwide coverage.",
  },
};

export const revalidate = 300;

const STATS = [
  { label: "Lender Network", value: "Agency & Bank" },
  { label: "Additional Sources", value: "CMBS & SBA" },
  { label: "Coverage", value: "Nationwide" },
  { label: "For Bridge Borrowers", value: "Complimentary*" },
  { label: "Options Available", value: "30-Year Fixed" },
  { label: "Structures Available", value: "Non-Recourse" },
];

const WHY_REQUITY = [
  {
    icon: <Target size={22} />,
    title: "We Know Your Exit Before You Close",
    description:
      "Every Requity bridge loan starts with a conversation about the permanent takeout. We do not just fund the bridge and wish you luck. Our capital advisory team maps the exit strategy before the bridge closes, identifying which permanent lenders will be the best fit once the property is stabilized.",
  },
  {
    icon: <Handshake size={22} />,
    title: "Lender Relationships, Not Just Referrals",
    description:
      "We maintain active relationships with agency lenders (Fannie Mae, Freddie Mac), CMBS originators, national and regional banks, SBA lenders, and life insurance companies. These are warm relationships built on repeat transactions, not cold introductions from a database.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "No Conflict of Interest",
    description:
      "We want you to get the best permanent financing available because that means our bridge loan gets repaid on time and you become a repeat borrower. Our advisory interest is aligned with your outcome, not with steering you toward a specific lender.",
  },
];

const USE_CASES = [
  {
    icon: <Building2 size={22} />,
    title: "Bridge-to-Agency Transition",
    description:
      "The most common path: stabilize a multifamily or manufactured housing property with a Requity bridge loan, then place permanent Fannie Mae or Freddie Mac financing through our agency lending network. We coordinate timing so the bridge matures seamlessly into the agency closing.",
  },
  {
    icon: <Landmark size={22} />,
    title: "Bank Financing Placement",
    description:
      "For commercial properties that need conventional bank financing, such as self storage, retail, industrial, and mixed-use, we connect you with regional and national banks whose credit boxes match your property type, size, and borrower profile.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "CMBS & Life Company Placement",
    description:
      "For larger stabilized commercial properties ($2M+ loan balances), CMBS and life insurance company financing can provide the most competitive rates and terms. We identify the right correspondent or conduit lender for each deal.",
  },
  {
    icon: <BadgeDollarSign size={22} />,
    title: "SBA 504 & 7(a) Coordination",
    description:
      "For owner-users and properties that qualify, SBA financing offers below-market rates and extended terms. We work with preferred SBA lenders to structure 504 and 7(a) applications for commercial real estate acquisitions and refinances.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "Rate & Term Refinance Advisory",
    description:
      "Property owners who are not Requity bridge borrowers but need to refinance existing debt can engage our capital advisory team to shop the market and identify the best permanent financing option for their asset.",
  },
  {
    icon: <Clock size={22} />,
    title: "Takeout Timing Coordination",
    description:
      "We proactively manage the timeline between bridge loan maturity and permanent financing closing. If stabilization takes longer than expected, we coordinate extension options on the bridge side while keeping the permanent lender engaged.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit Your Stabilized Asset",
    description:
      "Share your property details, current operations, and what type of permanent financing you are seeking. If you are a current Requity bridge borrower, we already have most of this information from the original underwriting.",
  },
  {
    step: "02",
    title: "We Analyze the Capital Stack",
    description:
      "Our team evaluates the property, identifies the best permanent financing structures, and presents 2-3 options with projected rates, terms, and closing timelines. We compare agency, bank, CMBS, and SBA options side by side.",
  },
  {
    step: "03",
    title: "Lender Introduction & Application",
    description:
      "We make a warm introduction to the selected permanent lender, assist with application packaging, and ensure the submission is complete and positioned for approval. No cold calls, these are established relationships.",
  },
  {
    step: "04",
    title: "Close Your Permanent Financing",
    description:
      "We coordinate the payoff of the bridge loan with the permanent financing closing. One transition, handled by a team that has done it across every major asset class.",
  },
];

export default function CapitalAdvisoryPage() {
  const capitalAdvisoryFAQs = [
    {
      question: "Is capital advisory free for Requity bridge loan borrowers?",
      answer:
        "Yes. Capital advisory and permanent financing placement are provided at no additional cost to borrowers with an active or recently matured Requity bridge loan. This is part of our full-lifecycle capital platform. For borrowers who are not existing Requity clients, advisory fees are discussed and agreed upon before engagement.",
    },
    {
      question: "What types of permanent financing can Requity place?",
      answer:
        "We place agency debt (Fannie Mae, Freddie Mac), CMBS, conventional bank financing, SBA 504 and 7(a) loans, life insurance company loans, and credit union financing. The best option depends on property type, size, stabilization level, and borrower profile.",
    },
    {
      question:
        "When should I start the permanent financing conversation?",
      answer:
        "Ideally, before you close the bridge loan. We map the exit strategy as part of bridge underwriting. For properties already in stabilization, engage our advisory team at least 90 days before your target refinance date to allow time for application, underwriting, and closing.",
    },
    {
      question: "Does Requity originate the permanent loans directly?",
      answer:
        "For select products like DSCR rental loans, yes, we originate directly through correspondent partnerships. For agency, CMBS, bank, and SBA financing, we act as an advisor and placement agent, connecting you with the originating lender best suited to your deal and managing the process on your behalf.",
    },
    {
      question: "What markets does the capital advisory service cover?",
      answer:
        "Nationwide. Our lender network includes national and regional banks, agency lenders, and CMBS originators who lend across all 50 states. We match the lender to the market and property type.",
    },
    {
      question:
        "Can I use capital advisory if I did not use a Requity bridge loan?",
      answer:
        "Yes. Property owners and investors who need permanent financing placement can engage our capital advisory team regardless of whether they used Requity for the bridge. Fees for non-bridge clients are discussed and agreed upon before any work begins.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Capital Advisory - Permanent Financing Placement",
    provider: {
      "@type": "FinancialService",
      name: "Requity Group",
      url: "https://requitygroup.com",
    },
    description:
      "Permanent financing placement for commercial real estate investors. Agency debt, bank financing, CMBS, and SBA lending connections. Complimentary for Requity bridge borrowers.",
    url: "https://requitygroup.com/lending/capital-advisory",
    areaServed: { "@type": "Country", name: "United States" },
    serviceType: "Capital Advisory",
    termsOfService:
      "Complimentary for Requity bridge loan borrowers. Fee-based for non-bridge clients, disclosed upfront.",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <FAQSchema faqs={capitalAdvisoryFAQs} />

      {/* HERO */}
      <PageHero
        label="Capital Advisory"
        headline={
          <>
            Permanent financing{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              placement
            </em>
          </>
        }
        body="We connect real estate investors with the right permanent capital partner for their stabilized asset. Agency debt, bank financing, CMBS, SBA — we navigate the landscape so you get the best execution on your long-term takeout."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Request Advisory <ArrowRight size={16} />
            </Link>
            <Link href="/lending" className="btn-editorial-light">
              <ArrowLeft size={14} /> All Programs
            </Link>
          </div>
        }
      />

      {/* STATS BAR */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              borderTop: "1px solid var(--navy-border)",
            }}
          >
            {STATS.map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: "28px 0",
                  textAlign: "center",
                  borderRight:
                    i < STATS.length - 1
                      ? "1px solid var(--navy-border)"
                      : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    color: "var(--gold-muted)",
                    marginBottom: 4,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "2px",
                    textTransform: "uppercase" as const,
                    color: "var(--navy-text-mid)",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY REQUITY */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Why Requity</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Your bridge to permanent{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                capital
              </em>
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Capital advisory is not an afterthought. It is built into every
              bridge loan we originate, because a successful exit is how we
              measure success.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {WHY_REQUITY.map((item) => (
                <div key={item.title} className="card">
                  <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                    {item.icon}
                  </div>
                  <h3
                    className="card-title"
                    style={{ fontSize: 20, marginBottom: 8 }}
                  >
                    {item.title}
                  </h3>
                  <p className="card-body">{item.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* USE CASES */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Use Cases</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              How we{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                help
              </em>
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              From bridge-to-agency transitions to standalone refinance advisory,
              we place permanent capital across every major commercial real
              estate financing structure.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {USE_CASES.map((item) => (
                <div key={item.title} className="card">
                  <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                    {item.icon}
                  </div>
                  <h3
                    className="card-title"
                    style={{ fontSize: 20, marginBottom: 8 }}
                  >
                    {item.title}
                  </h3>
                  <p className="card-body">{item.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
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
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>Process</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "#fff", marginBottom: 16 }}
            >
              How it{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                works
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
              From initial submission to permanent financing closing, our
              advisory process is designed to deliver the best capital execution
              for your stabilized asset.
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
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.step}
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
                    <div className="step-icon">
                      <Zap size={22} />
                    </div>
                    <span className="step-label">Step {step.step}</span>
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

      {/* KEY DISTINCTION */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div
              style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}
            >
              <SectionLabel>Key Distinction</SectionLabel>
              <h2
                className="type-h2"
                style={{ color: "var(--text)", marginBottom: 24 }}
              >
                Complimentary for bridge borrowers
              </h2>
              <p
                className="type-body"
                style={{ color: "var(--text-mid)", marginBottom: 32 }}
              >
                Capital advisory is provided at no additional cost to Requity
                bridge loan borrowers as part of our commitment to
                full-lifecycle capital support. For borrowers who are not
                existing Requity clients, advisory fees are structured on a
                deal-specific basis and disclosed upfront before any engagement
                begins.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 12,
                  textAlign: "left",
                }}
              >
                {[
                  "No upfront fees",
                  "No hidden advisory costs for bridge borrowers",
                  "Transparent fee structure for non-bridge clients",
                  "No obligation to accept any placement recommendation",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <CheckCircle
                      size={16}
                      style={{ color: "var(--gold)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 15,
                        color: "var(--text-mid)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="light-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 40 }}
            >
              Capital advisory FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={capitalAdvisoryFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Need permanent{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              capital?
            </em>
          </>
        }
        body="Tell us about your stabilized property and your financing goals. We will identify the best permanent capital options for your deal."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Request Advisory <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/lending" className="btn-secondary">
            All Loan Programs <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
