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
  Home,
  RefreshCw,
  Building2,
  Layers,
  Key,
  FileCheck,
  TrendingUp,
  Banknote,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title: "DSCR Rental Loans | Investment Property Financing | Requity Lending",
  description:
    "Long-term rental loans qualified on property cash flow, not personal income. 30-year fixed and adjustable rate options. No tax returns, no W-2s. $100K-$2M.",
  openGraph: {
    title: "DSCR Rental Loans | Requity Lending",
    description:
      "Rental property financing qualified on DSCR, not personal income. 30-year fixed and ARM options. No tax returns, no W-2s. Up to 80% LTV.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DSCR Rental Loans | Requity Lending",
    description:
      "Long-term rental loans on property cash flow. No income docs. 1-4 units and small multifamily.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$100K - $2M" },
  { label: "LTV", value: "Up to 80%" },
  { label: "Rate", value: "Competitive Rates" },
  { label: "Term", value: "30 Year Terms" },
  { label: "Income Docs", value: "No Income Docs" },
  { label: "Property Types", value: "1-4 & 5+ Units" },
];

const WHY_ITEMS = [
  {
    icon: <FileCheck size={20} />,
    title: "No Income Verification",
    description:
      "Qualification is based entirely on the property's debt service coverage ratio. No tax returns, no W-2s, no paystubs. Self-employed borrowers, investors with complex income structures, and high-net-worth individuals all qualify the same way: does the property cash flow?",
  },
  {
    icon: <RefreshCw size={20} />,
    title: "Bridge-to-DSCR Pipeline",
    description:
      "Many rental investors start with a short-term bridge loan to acquire and stabilize a property, then refinance into a long-term DSCR loan once leases are in place. We lend on both ends of that pipeline, which means we understand your business plan and can structure both loans together.",
  },
  {
    icon: <TrendingUp size={20} />,
    title: "Built for Portfolio Scale",
    description:
      "Each DSCR loan is underwritten on the property's cash flow, not your aggregate personal income. That means you can hold 10, 20, or 50 properties without hitting a debt-to-income wall. We also offer blanket and portfolio loan structures for investors ready to cross-collateralize.",
  },
];

const USE_CASES = [
  {
    icon: <Home size={22} />,
    title: "Stabilized Rentals",
    description:
      "Permanent financing for single-family rentals and small multifamily properties with existing tenants and documented lease income. If the rent covers the debt service, you qualify. Straightforward DSCR calculation, no income documentation required.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "BRRRR Exit",
    description:
      "Complete your Buy, Rehab, Rent, Refinance, Repeat strategy with a 30-year DSCR loan on the back end. Once your property is rehabbed and rented, refinance out of your bridge or hard money loan into permanent debt. Pull your equity out and move on to the next deal.",
  },
  {
    icon: <Layers size={22} />,
    title: "Portfolio Refi",
    description:
      "Consolidate multiple single-family rentals into a portfolio loan structure. Simplify your debt stack, reduce your number of lenders, and potentially improve your overall rate. Portfolio loans are evaluated on aggregate DSCR across all properties in the pool.",
  },
  {
    icon: <Building2 size={22} />,
    title: "Short-Term Rentals",
    description:
      "Finance Airbnb, VRBO, and other short-term rental properties using market rent or trailing 12-month STR income to calculate DSCR. Markets with strong short-term rental demand often support higher rents than long-term leases, resulting in favorable DSCR even at higher loan amounts.",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Small Multifamily 5-8",
    description:
      "5-8 unit properties sit in a lending gap: too large for residential programs, too small for most commercial lenders. Our DSCR program covers this asset class. Underwriting is based on the property's net operating income and debt service, just like larger commercial deals.",
  },
  {
    icon: <Key size={22} />,
    title: "New Purchase with Lease",
    description:
      "Purchasing a rental property with an existing tenant and lease in place? DSCR financing is available at acquisition using the current lease rent as the income figure. No seasoning requirement on the lease. Close with long-term financing from day one.",
  },
];

export default function DscrRentalPage() {
  const dscrFAQs = [
    {
      question: "What is a DSCR loan?",
      answer:
        "A DSCR (Debt Service Coverage Ratio) loan qualifies borrowers based on the rental property's cash flow rather than the borrower's personal income. The DSCR is calculated by dividing the property's gross monthly rent by the monthly debt service (principal, interest, taxes, insurance, and HOA if applicable). A DSCR of 1.0 means the property exactly covers its debt service. Most lenders require a minimum DSCR of 1.0 to 1.25.",
    },
    {
      question: "Do I need to show tax returns or W-2s for a DSCR loan?",
      answer:
        "No. DSCR loans require no personal income documentation. There are no tax returns, W-2s, paystubs, or debt-to-income ratio calculations. Qualification is based entirely on the property's rental income relative to its debt service. This makes DSCR loans particularly attractive for self-employed investors, retirees, and anyone with complex income structures.",
    },
    {
      question: "What DSCR ratio is required to qualify?",
      answer:
        "We generally require a minimum DSCR of 1.0, meaning the property's rent must at least cover the full monthly debt service. Higher DSCR ratios (1.20 and above) typically unlock better rates and higher LTV. Properties with DSCR below 1.0 may still be eligible under certain programs with compensating factors such as a lower LTV or strong borrower credit.",
    },
    {
      question: "What property types are eligible for DSCR financing?",
      answer:
        "Eligible property types include single-family rentals (1-4 units), small multifamily (5-8 units), condominiums, townhomes, and short-term rental properties. The property must be a non-owner-occupied investment property. Primary residences and owner-occupied duplexes are not eligible for DSCR programs.",
    },
    {
      question: "How is DSCR calculated for short-term rentals?",
      answer:
        "For short-term rental properties (Airbnb, VRBO), we can calculate DSCR using either the market long-term rent for the property or the trailing 12-month gross STR income, depending on which better reflects the property's cash flow. Markets with strong vacation or business travel demand often support STR income that exceeds long-term lease rates.",
    },
    {
      question: "Can I use a DSCR loan to refinance an existing rental?",
      answer:
        "Yes. DSCR loans are available for both purchases and refinances, including rate-and-term refinances and cash-out refinances. Cash-out refinances allow you to pull equity from a stabilized rental property for reinvestment, reserves, or other purposes. Maximum cash-out LTV is typically 75-80% depending on the property type and DSCR.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "DSCR Rental Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Long-term rental loans qualified on property cash flow, not personal income. 30-year fixed and adjustable rate options. No tax returns, no W-2s. $100K-$2M, up to 80% LTV.",
    url: "https://requitygroup.com/lending/dscr-rental",
    category: "DSCR Loan",
    amount: {
      "@type": "MonetaryAmount",
      minValue: 100000,
      maxValue: 2000000,
      currency: "USD",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <FAQSchema faqs={dscrFAQs} />

      {/* HERO */}
      <PageHero
        label="DSCR Rental"
        headline={
          <>
            Rental property{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Long-term rental loans qualified on property cash flow, not personal income. 30-year fixed and adjustable rate options. No tax returns, no W-2s."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Apply Now <ArrowRight size={16} />
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
              Permanent financing from people who{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                own rentals
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
              Most lenders treat rental property as a liability on your personal
              balance sheet. We treat it as a business. DSCR lending evaluates
              each property on its own cash flow, which means your portfolio
              can grow without your personal income becoming the bottleneck.
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
        id="use-cases"
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
              How rental investors use DSCR financing
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              From single-family rentals to small multifamily, from BRRRR exits
              to short-term rental portfolios, DSCR loans cover the full range
              of residential investment property strategies. No personal income
              required at any stage.
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
      <section
        id="deal-economics"
        className="light-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Example</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Sample DSCR deal economics
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              A straightforward single-family rental acquisition using DSCR
              financing. Qualification is based entirely on the property&apos;s
              monthly rent relative to its debt service.
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
                  Property
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Property Type", "SFR (3 bed / 2 bath)"],
                    ["Purchase Price", "$285,000"],
                    ["Loan Amount (75% LTV)", "$213,750"],
                    ["Monthly Rent", "$2,100"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
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
                  Loan Terms
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Rate", "7.25%"],
                    ["Term", "30-Year Fixed"],
                    ["Monthly P&I", "$1,459"],
                    ["Taxes + Insurance", "$290"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
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
                  DSCR Qualification
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Total Monthly Payment", "$1,749"],
                    ["Monthly Rent", "$2,100"],
                    ["DSCR", "1.20x"],
                    ["Income Docs Required", "None"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: label === "DSCR" ? "var(--gold)" : "var(--text)" }}>{value}</span>
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
              rates, terms, and deal economics vary based on market conditions,
              borrower credit, and property specifics.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 40 }}
            >
              DSCR rental lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={dscrFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a rental{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              property?
            </em>
          </>
        }
        body="Submit your rental property details and our lending team will review your DSCR scenario. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Apply Now <ArrowRight size={16} />
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
