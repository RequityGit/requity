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
  CheckCircle,
  Home,
  TrendingUp,
  Wrench,
  Users,
  MapPin,
  Zap,
  Shield,
  DollarSign,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manufactured Housing & Mobile Home Park Financing",
  description:
    "Bridge loans for manufactured housing communities and mobile home parks. Finance MHP acquisitions, park-owned home portfolios, and value-add repositioning. Close in 10 days.",
  openGraph: {
    title: "Mobile Home Park Financing | Requity Lending",
    description:
      "Bridge financing for MHC acquisitions, infrastructure improvements, and lot infill. Loan sizes $250K-$10M. Close in as few as 10 business days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Home Park Financing | Requity Lending",
    description:
      "Bridge financing for MHC acquisitions and value-add repositioning. Close in 10 days. Term sheets in 48 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 85%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Rehab Capital", value: "Available" },
];

const USE_CASES = [
  {
    icon: <Home size={22} />,
    title: "Park Acquisitions",
    description:
      "Acquire manufactured housing communities that conventional lenders will not finance due to below-market operations, deferred maintenance, or park-owned home portfolios. We underwrite to the business plan, not just trailing income.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Value-Add Repositioning",
    description:
      "Finance the acquisition and improvement of underperforming parks. Bridge capital covers the purchase while improvement holdbacks fund infrastructure upgrades, lot rent adjustments, and operational improvements.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Infrastructure Upgrades",
    description:
      "Fund water and sewer system repairs, electrical upgrades, road improvements, and common area renovations. Draws released as work is completed and verified.",
  },
  {
    icon: <Users size={22} />,
    title: "Lot Infill Programs",
    description:
      "Finance the placement of new or used manufactured homes on vacant lots to increase occupancy and revenue. A vacant lot generating $0/month can produce $400-$600/month in lot rent once filled.",
  },
  {
    icon: <MapPin size={22} />,
    title: "POH to TOH Conversion",
    description:
      "Acquire parks with park-owned homes, then convert to tenant-owned over time. Bridge financing covers the initial acquisition including POH rental income in the underwrite, giving you runway to execute the conversion strategy.",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Portfolio Consolidation",
    description:
      "Combine multiple MHP acquisitions into a single bridge facility. One closing, one set of docs, streamlined execution for operators building a manufactured housing portfolio.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "We Understand MHP Underwriting",
    description:
      "Lot rent analysis, utility cost structures, POH vs TOH income splits, infill economics. Our team knows manufactured housing at the operational level, not just the spreadsheet level.",
  },
  {
    icon: <Shield size={20} />,
    title: "We Are MHP Operators Ourselves",
    description:
      "Requity Group acquires and manages manufactured housing communities through our investment platform. We evaluate your deal the way we evaluate our own.",
  },
  {
    icon: <Clock size={20} />,
    title: "Speed That Wins Deals",
    description:
      "Many MHP acquisitions are sourced directly from retiring owner-operators who prioritize certainty and speed. A 10-day close wins deals that a 60-day bank process loses.",
  },
];

export default function ManufacturedHousingPage() {
  const mhFAQs = [
    {
      question: "Does Requity Lending finance mobile home parks with park-owned homes?",
      answer:
        "Yes. We underwrite the total revenue picture including lot rents, park-owned home (POH) rental income, utility reimbursements, and ancillary income. Many conventional lenders struggle with the hybrid income stream from POHs, but our underwriting model is built to evaluate the full cash flow of a manufactured housing community.",
    },
    {
      question: "What size mobile home parks does Requity finance?",
      answer:
        "We finance parks of all sizes within our $250K to $10M loan range. Our typical MHP borrower is acquiring a park with 30 to 150 lots in a secondary or tertiary market with below-market lot rents and clear value-add opportunity.",
    },
    {
      question: "Can I get rehab or improvement capital included in my MHP bridge loan?",
      answer:
        "Yes. We structure improvement holdbacks directly into the bridge loan. This capital funds infrastructure repairs, lot preparation, home placement for infill, and common area improvements. Funds are released through a draw process as work is completed and verified.",
    },
    {
      question: "What is the typical exit strategy for an MHP bridge loan?",
      answer:
        "I would say most common types are permanent bank or agency debt, typically at 12 to 18 months once the park is stabilized. Other exits include CMBS loans, local bank financing, or sale of the stabilized asset.",
    },
    {
      question: "How does Requity evaluate lot rent potential?",
      answer:
        "We analyze comparable lot rents in the surrounding market, considering factors like park quality, amenities, location, and home types. Our underwriting models the path from current rents to market rents, including realistic timelines for rent adjustment programs with proper tenant notice periods.",
    },
    {
      question: "Does Requity finance lot infill (placing new homes on vacant pads)?",
      answer:
        "Yes. Lot infill is one of the most effective value-add strategies in manufactured housing, and we can include infill capital in the bridge loan structure. The typical cost to source and place a used manufactured home on a prepared lot ranges from $8,000 to $15,000, with the new lot rent revenue significantly exceeding the financing cost.",
    },
    {
      question: "What markets does Requity Lending cover for MHP financing?",
      answer:
        "Requity Lending provides manufactured housing financing nationwide. We evaluate each market based on employment fundamentals, population trends, housing affordability pressure, and comparable park operations in the area.",
    },
    {
      question: "How fast can Requity close on a mobile home park acquisition?",
      answer:
        "We can close MHP acquisitions in as few as 10 business days from signed term sheet. Most manufactured housing deals close within 10 to 15 business days. We deliver term sheets within 48 hours of receiving a complete deal package.",
    },
  ];

  // Structured data for the page
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Manufactured Housing Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for manufactured housing community and mobile home park acquisitions. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/manufactured-housing",
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
      <FAQSchema faqs={mhFAQs} />

      {/* HERO */}
      <PageHero
        label="Manufactured Housing"
        headline={
          <>
            Mobile home park{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans for manufactured housing communities and mobile home parks. Acquisition, value-add, and infill capital from a lender who operates in the space."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your MHP Deal <ArrowRight size={16} />
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

      {/* WHY REQUITY FOR MHP */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Why Requity</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              A lender who{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                operates
              </em>{" "}
              in the space
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Most bridge lenders treat manufactured housing as a niche they
              tolerate. Requity Group acquires and manages MHCs through our
              investment platform. We evaluate your deal the way we evaluate our
              own.
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
              From straightforward park acquisitions to complex value-add
              repositioning with infill programs and infrastructure overhauls.
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
              A representative value-add MHP acquisition showing how bridge
              financing enables the deal and creates equity.
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
                    ["Purchase Price", "$1,100,000"],
                    ["Lots", "68"],
                    ["Current Occupancy", "60%"],
                    ["Current Lot Rent", "$225/mo"],
                    ["Current NOI", "$5,800/mo"],
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
                        style={{ fontWeight: 600, color: "var(--text)" }}
                      >
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
                    ["Bridge Loan", "$825,000"],
                    ["Improvement Holdback", "$180,000"],
                    ["Total Facility", "$1,005,000"],
                    ["Rate", "12% IO"],
                    ["Borrower Equity", "$275,000"],
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
                        style={{ fontWeight: 600, color: "var(--text)" }}
                      >
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
                  Stabilized (14 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Occupancy", "92%"],
                    ["Lot Rent", "$325/mo"],
                    ["Stabilized NOI", "$14,500/mo"],
                    ["Appraised Value", "$2,350,000"],
                    ["Equity Created", "~$1,070,000"],
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
              deal economics vary based on market conditions, execution, and
              property specifics.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* RELATED INSIGHTS */}
      <section
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Resources</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 32 }}
            >
              MHP insights
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
              {[
                {
                  title: "Financing a Mobile Home Park Acquisition with a Bridge Loan",
                  slug: "financing-mobile-home-park-bridge-loan",
                  excerpt: "How to structure the capital stack for an MHP acquisition using bridge financing.",
                },
                {
                  title: "Mobile Home Park Cap Rates in 2026",
                  slug: "mobile-home-park-cap-rates-2026",
                  excerpt: "Current cap rate ranges and where value-add opportunities exist in manufactured housing.",
                },
                {
                  title: "From Vacant Lots to Full Occupancy: A Bridge Loan MHP Case Study",
                  slug: "vacant-lots-full-occupancy-mhp-case-study",
                  excerpt: "A 68-lot park went from 40% vacancy to 92% occupancy in 14 months using bridge financing.",
                },
              ].map((post) => (
                <Link
                  key={post.slug}
                  href={`/insights/${post.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div className="card">
                    <span className="insight-tag" style={{ marginBottom: 16, display: "inline-block" }}>
                      Mobile Home Parks
                    </span>
                    <h3 className="card-title" style={{ fontSize: 20 }}>
                      {post.title}
                    </h3>
                    <p className="card-body">{post.excerpt}</p>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--gold)",
                        marginTop: 16,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      Read More <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
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
              Manufactured housing lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={mhFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have an MHP{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              deal?
            </em>
          </>
        }
        body="Submit your manufactured housing community details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your MHP Deal <ArrowRight size={16} />
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
