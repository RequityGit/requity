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
  Trees,
  TrendingUp,
  Wrench,
  CalendarRange,
  MapPin,
  Tent,
  Zap,
  Shield,
  DollarSign,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "RV Park & Campground Financing",
  description:
    "Bridge loans for RV parks, campgrounds, and outdoor hospitality properties. Finance acquisitions, expansions, and infrastructure improvements. Close in as few as 10 days.",
  openGraph: {
    title: "RV Park & Campground Financing | Requity Lending",
    description:
      "Bridge financing for RV park acquisitions, campground expansions, and outdoor hospitality improvements. Loan sizes $250K-$10M. Term sheets in 48 hours.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RV Park & Campground Financing | Requity Lending",
    description:
      "Bridge financing for RV park acquisitions and outdoor hospitality. Close in 10 days. Term sheets in 48 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 75%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Expansion Capital", value: "Available" },
];

const USE_CASES = [
  {
    icon: <Trees size={22} />,
    title: "Park Acquisitions",
    description:
      "Acquire RV parks and campgrounds that need operational improvements, site additions, or infrastructure upgrades. We underwrite to the stabilized potential, not just trailing revenue, which is critical for seasonal properties with inconsistent income histories.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Value-Add Repositioning",
    description:
      "Finance the acquisition and improvement of underperforming parks. Add full hookup sites, upgrade electrical from 30 to 50 amp, improve roads, and add amenities that command premium nightly rates. Bridge capital covers both the purchase and the improvement budget.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Infrastructure Upgrades",
    description:
      "Fund utility system upgrades, road improvements, bathhouse construction, Wi-Fi installation, and dump station additions. These improvements directly increase occupancy, average daily rates, and property value.",
  },
  {
    icon: <Tent size={22} />,
    title: "Expansion & Site Addition",
    description:
      "Finance the development of additional RV sites, glamping units, cabins, or tent sites on existing park acreage. A vacant acre that generates $0 can produce $30-80,000 annually once developed with 8-10 sites.",
  },
  {
    icon: <CalendarRange size={22} />,
    title: "Seasonal Cash Flow Bridges",
    description:
      "RV parks in seasonal markets generate the majority of revenue in 4-6 months. Bridge financing provides capital to acquire and improve during the off-season so the property is optimized before peak season arrives.",
  },
  {
    icon: <MapPin size={22} />,
    title: "Portfolio Consolidation",
    description:
      "Combine multiple RV park or campground acquisitions into a single bridge facility. Operators building a portfolio of outdoor hospitality assets can streamline closings and reduce transaction friction.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "We Understand Seasonal Underwriting",
    description:
      "RV parks do not produce even cash flow across 12 months. Our underwriting models account for seasonal revenue patterns, occupancy cycles, and the impact of weather on operations. We do not penalize properties for having an off-season.",
  },
  {
    icon: <Shield size={20} />,
    title: "Outdoor Hospitality Expertise",
    description:
      "We evaluate RV parks and campgrounds differently than traditional commercial real estate. Site count, hookup types, amenity packages, and rate per night matter more than traditional NOI metrics for transitional properties.",
  },
  {
    icon: <Clock size={20} />,
    title: "Off-Season Acquisition Timing",
    description:
      "The best RV park deals close in the off-season when sellers are motivated and competition is lower. A bridge loan that closes in 10-15 days lets you acquire in winter and have the property ready for spring revenue.",
  },
];

export default function RVParksPage() {
  const rvFAQs = [
    {
      question: "Does Requity Lending finance RV parks and campgrounds?",
      answer:
        "Yes. RV parks, campgrounds, and outdoor hospitality properties are an active lending category for Requity. We finance acquisitions, expansions, infrastructure upgrades, and value-add repositioning for these properties.",
    },
    {
      question: "How does Requity underwrite seasonal RV park income?",
      answer:
        "We evaluate RV parks based on their full annual revenue cycle, not just a single month or trailing quarter. Our underwriting accounts for peak season occupancy and rates, shoulder season performance, off-season baseline revenue, and year-over-year trends. We do not penalize a property for generating 60-70% of its revenue in 4-6 months if the annual cash flow supports the loan.",
    },
    {
      question: "Can I get expansion capital included in my RV park bridge loan?",
      answer:
        "Yes. We structure improvement and expansion holdbacks directly into the bridge loan. This capital can fund new site development, utility upgrades, amenity construction, and infrastructure improvements. Funds are released through a draw process as work is completed.",
    },
    {
      question: "What is the typical exit strategy for an RV park bridge loan?",
      answer:
        "Common exits include refinancing into a conventional commercial loan or SBA 504 loan once the property is stabilized with documented income history, sale of the improved asset, or recapitalization. The typical stabilization timeline for an RV park value-add is 12-24 months depending on seasonality and scope of improvements.",
    },
    {
      question: "What size RV parks does Requity finance?",
      answer:
        "We finance RV parks and campgrounds within our $250K to $10M loan range. This typically covers properties with 30 to 300+ sites. Both established parks needing repositioning and properties being converted to RV park use are eligible.",
    },
    {
      question: "Does Requity finance campground conversions or ground-up RV park development?",
      answer:
        "We finance value-add improvements and expansions on existing RV parks and campgrounds. For ground-up development projects, we evaluate on a case-by-case basis depending on entitlements, site plan, and operator experience. Submit your deal for a preliminary evaluation.",
    },
    {
      question: "How fast can Requity close on an RV park acquisition?",
      answer:
        "We can close RV park acquisitions in as few as 10 business days from signed term sheet. Most outdoor hospitality deals close within 10-15 business days. We deliver term sheets within 48 hours of receiving a complete deal package.",
    },
    {
      question: "Are there specific markets where Requity focuses for RV park lending?",
      answer:
        "Requity Lending provides RV park and campground financing nationwide. We evaluate each market based on tourism demand drivers, proximity to attractions or natural destinations, seasonal traffic patterns, and comparable park performance in the area.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "RV Park & Campground Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for RV park and campground acquisitions, expansions, and improvements. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/rv-parks",
    category: "Bridge Loan",
    amount: {
      "@type": "MonetaryAmount",
      minValue: 250000,
      maxValue: 10000000,
      currency: "USD",
    },
    interestRate: {
      "@type": "QuantitativeValue",
      value: 12,
      unitCode: "P1",
      unitText: "percent per year",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <FAQSchema faqs={rvFAQs} />

      {/* HERO */}
      <PageHero
        label="Outdoor Hospitality"
        headline={
          <>
            RV park &amp; campground{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans for RV parks, campgrounds, and outdoor hospitality properties. Acquisition, expansion, and improvement capital from a lender who understands seasonal assets."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your RV Park Deal <ArrowRight size={16} />
            </Link>
            <Link href="/lending" className="btn-editorial-light">
              <ArrowLeft size={14} /> All Loan Programs
            </Link>
          </div>
        }
      />

      {/* LOAN TERMS GRID */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              borderTop: "1px solid var(--navy-border)",
            }}
          >
            {LOAN_DETAILS.map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: "28px 0",
                  textAlign: "center",
                  borderRight:
                    i < LOAN_DETAILS.length - 1
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

      {/* WHY REQUITY FOR RV PARKS */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Why Requity</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              A lender who understands{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                seasonal assets
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
              Most lenders see inconsistent monthly revenue and walk away.
              We see a seasonal business with predictable annual patterns
              and a value-add opportunity that traditional financing cannot
              capture.
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
              {WHY_ITEMS.map((item) => (
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
      <section
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Use Cases</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              What we finance
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 600,
                marginBottom: 48,
              }}
            >
              From straightforward park acquisitions to expansion projects
              with new site development and amenity packages.
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

      {/* DEAL ECONOMICS EXAMPLE */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Deal Economics</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              How the numbers work
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              A representative value-add RV park acquisition showing how
              bridge financing enables the deal and creates equity through
              site expansion and rate optimization.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {/* Acquisition */}
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "2px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                  }}
                >
                  Acquisition
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Purchase Price", "$850,000"],
                    ["Existing Sites", "45 (30 full hookup)"],
                    ["Vacant Acreage", "3 acres (developable)"],
                    ["Peak Season Rate", "$35/night"],
                    ["Annual Gross Revenue", "$280,000"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 15,
                      }}
                    >
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financing */}
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "2px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                  }}
                >
                  Bridge Loan Structure
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Bridge Loan", "$640,000"],
                    ["Expansion Holdback", "$220,000"],
                    ["Total Facility", "$860,000"],
                    ["Rate", "12% IO"],
                    ["Borrower Equity", "$210,000"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 15,
                      }}
                    >
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stabilized */}
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "2px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                  }}
                >
                  Stabilized (18 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Total Sites", "65 (all full hookup)"],
                    ["Peak Season Rate", "$55/night"],
                    ["Annual Gross Revenue", "$520,000"],
                    ["Appraised Value", "$1,750,000"],
                    ["Equity Created", "~$680,000"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 15,
                      }}
                    >
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            label === "Equity Created"
                              ? "var(--gold)"
                              : "var(--text)",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <p
              className="type-body-sm"
              style={{
                color: "var(--text-light)",
                marginTop: 24,
                fontStyle: "italic",
              }}
            >
              Representative example for illustrative purposes only. Actual
              deal economics vary based on market conditions, seasonality,
              execution, and property specifics.
            </p>
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
              RV park lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={rvFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have an RV park{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              deal?
            </em>
          </>
        }
        body="Submit your RV park or campground details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your RV Park Deal <ArrowRight size={16} />
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
