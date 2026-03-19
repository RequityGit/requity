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
  Building2,
  TrendingUp,
  Wrench,
  Users,
  Layers,
  RefreshCw,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Multifamily Bridge Loans | Apartment Building Financing",
  description:
    "Bridge loans for multifamily and apartment building acquisitions. Finance value-add renovations, lease-up, and repositioning. 5+ units. Close in as few as 10 days.",
  openGraph: {
    title: "Multifamily Bridge Loans | Requity Lending",
    description:
      "Bridge financing for apartment buildings and multifamily properties. Value-add renovations, lease-up capital, and acquisition financing. $250K-$10M. Close in 10 days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multifamily Bridge Loans | Requity Lending",
    description:
      "Bridge financing for apartment buildings. Value-add, lease-up, and acquisition capital. Close in 10 days.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 85%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Min Units", value: "5+" },
];

const USE_CASES = [
  {
    icon: <Building2 size={22} />,
    title: "Value-Add Acquisitions",
    description:
      "Acquire multifamily properties with below-market rents, deferred maintenance, or high vacancy. Bridge financing underwrites to the stabilized business plan, not the trailing income that disqualifies you from conventional lending.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Unit Renovations",
    description:
      "Finance interior unit upgrades that drive rent increases of $100-$300/unit/month. Kitchen and bath renovations, flooring, fixtures, and appliance packages. Improvement holdbacks release funds as work is completed on a per-unit basis.",
  },
  {
    icon: <Users size={22} />,
    title: "Lease-Up Financing",
    description:
      "Properties with 30-50% vacancy need capital to renovate, market, and lease units before they qualify for permanent debt. Bridge loans provide the runway to execute the lease-up plan and build the trailing income history lenders require.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "Repositioning",
    description:
      "Convert underperforming assets: rebrand properties, upgrade common areas, add amenities, change unit mix, or shift from short-term to long-term tenancy. Bridge capital funds the transition period when income is disrupted.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Distressed Acquisitions",
    description:
      "Acquire properties from motivated sellers, lender REO, or auction at significant discounts to stabilized value. A 10-day close lets you capture deals that bank-financed buyers cannot compete for.",
  },
  {
    icon: <Layers size={22} />,
    title: "Portfolio Consolidation",
    description:
      "Combine multiple small multifamily acquisitions into a single bridge facility. One closing, one draw schedule, streamlined execution for operators building a rental portfolio across multiple properties.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "Operators Lending to Operators",
    description:
      "Requity Group acquires and manages multifamily properties through our investment platform. We know renovation timelines, lease-up curves, and the realities of repositioning because we do it ourselves.",
  },
  {
    icon: <Shield size={20} />,
    title: "Business Plan Underwriting",
    description:
      "Banks underwrite trailing 12-month income. We underwrite the business plan. If the market supports higher rents and your renovation budget is realistic, the deal gets funded based on where it is going, not where it is today.",
  },
  {
    icon: <Clock size={20} />,
    title: "10-Day Close Advantage",
    description:
      "In competitive multifamily markets, speed wins. A bridge loan that closes in 10 days at a price that reflects the property's current condition beats a bank offer at a higher price that takes 60 days and may fall through.",
  },
];

export default function MultifamilyPage() {
  const mfFAQs = [
    {
      question: "What size multifamily properties does Requity Lending finance?",
      answer:
        "We finance multifamily properties with 5 or more units within our $250K to $10M loan range. This covers everything from small apartment buildings to mid-size complexes. Both stabilized acquisitions needing a fast close and heavy value-add projects with significant vacancy are eligible.",
    },
    {
      question: "Can I finance unit renovations through the bridge loan?",
      answer:
        "Yes. We structure improvement holdbacks directly into the bridge loan to fund unit renovations. Common renovation scopes include kitchen and bath upgrades, flooring, fixtures, appliance packages, and common area improvements. Funds are released on a draw basis as work is completed and verified, typically on a per-unit or per-phase schedule.",
    },
    {
      question: "How does Requity underwrite a multifamily property with high vacancy?",
      answer:
        "We evaluate the property based on its stabilized potential, not just trailing income. Our underwriting looks at market rents for comparable renovated units, the borrower's renovation budget and timeline, local occupancy trends, and the exit strategy. A property at 50% occupancy with a clear path to 95% is a deal we want to see.",
    },
    {
      question: "What is the typical exit strategy for a multifamily bridge loan?",
      answer:
        "Most common exits are refinancing into agency debt (Fannie Mae or Freddie Mac multifamily programs), conventional bank financing, or CMBS once the property is stabilized with 90%+ occupancy and 6-12 months of trailing income history. Some borrowers also exit through sale of the stabilized asset.",
    },
    {
      question: "Does Requity finance mixed-use properties with residential units?",
      answer:
        "Yes. Mixed-use properties with ground-floor commercial and upper-floor residential units are eligible. We evaluate the full income picture including both commercial leases and residential rents.",
    },
    {
      question: "How fast can Requity close on a multifamily acquisition?",
      answer:
        "We can close multifamily acquisitions in as few as 10 business days from signed term sheet. Most deals close within 10-15 business days. We deliver term sheets within 48 hours of receiving a complete deal package.",
    },
    {
      question: "What markets does Requity cover for multifamily lending?",
      answer:
        "Requity Lending provides multifamily financing nationwide. We evaluate each market based on employment growth, population trends, rental demand, and comparable property performance.",
    },
    {
      question: "Can I get a bridge loan for a multifamily property I already own?",
      answer:
        "Yes. We finance both acquisitions and refinances. If you own a multifamily property that needs renovation capital or you want to pull equity for your next acquisition, a bridge loan can provide that capital faster than a conventional refinance.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Multifamily Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for multifamily and apartment building acquisitions, renovations, and lease-up. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/multifamily",
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
      <FAQSchema faqs={mfFAQs} />

      {/* HERO */}
      <PageHero
        label="Multifamily"
        headline={
          <>
            Apartment building{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans for multifamily acquisitions, value-add renovations, and lease-up capital. From 5-unit buildings to mid-size complexes, financed by a lender who operates in the space."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your Multifamily Deal <ArrowRight size={16} />
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

      {/* WHY REQUITY */}
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
                owns apartments
              </em>{" "}
              too
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Most bridge lenders evaluate multifamily deals from a
              spreadsheet. Requity Group acquires, renovates, and manages
              apartment buildings through our investment platform. We know
              what a realistic renovation timeline looks like because we
              live it.
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
              From straightforward apartment acquisitions to heavy value-add
              renovations with lease-up capital and full repositioning.
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

      {/* DEAL ECONOMICS */}
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
              A representative value-add multifamily acquisition showing how
              bridge financing enables the deal and creates equity through
              renovation and rent optimization.
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
                    ["Purchase Price", "$1,800,000"],
                    ["Units", "24"],
                    ["Price Per Unit", "$75,000"],
                    ["Current Occupancy", "62%"],
                    ["Avg Rent (occupied)", "$750/mo"],
                    ["Current NOI", "$6,200/mo"],
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
                    ["Bridge Loan", "$1,350,000"],
                    ["Renovation Holdback", "$360,000"],
                    ["Total Facility", "$1,710,000"],
                    ["Rate", "12% IO"],
                    ["Reno Budget/Unit", "$15,000"],
                    ["Borrower Equity", "$450,000"],
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
                    ["Occupancy", "95%"],
                    ["Avg Rent (renovated)", "$1,050/mo"],
                    ["Stabilized NOI", "$14,800/mo"],
                    ["Appraised Value", "$3,200,000"],
                    ["Per Unit Value", "$133,000"],
                    ["Equity Created", "~$1,040,000"],
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
              Multifamily lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={mfFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a multifamily{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              deal?
            </em>
          </>
        }
        body="Submit your apartment building details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your Multifamily Deal <ArrowRight size={16} />
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
