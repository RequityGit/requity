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
  Warehouse,
  Package,
  Store,
  TrendingUp,
  Wrench,
  RefreshCw,
  KeyRound,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Commercial Bridge Loans | Small Bay Industrial, Self Storage & Retail",
  description:
    "Bridge loans for commercial real estate: small bay industrial, self storage, and multi-tenant retail. Acquisition, value-add, and repositioning financing. Close in 10 days.",
  openGraph: {
    title: "Commercial Bridge Loans | Requity Lending",
    description:
      "Bridge financing for small bay industrial, self storage facilities, and multi-tenant retail centers. $250K-$10M. Close in as few as 10 business days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Commercial Bridge Loans | Requity Lending",
    description:
      "Bridge financing for industrial, self storage, and retail. Close in 10 days. Term sheets in 48 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 80%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Rehab Capital", value: "Available" },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "Speed on Off-Market Deals",
    description:
      "The best commercial deals are sourced directly and require fast closings. A 10-day close with no financing contingency wins deals that 60-day bank processes lose. We provide proof of funds and close on your timeline.",
  },
  {
    icon: <Shield size={20} />,
    title: "Business Plan Underwriting",
    description:
      "Banks underwrite trailing NOI. We underwrite the opportunity. A half-vacant industrial building or a self storage facility with below-market rates gets funded based on where it is going, not where it is today.",
  },
  {
    icon: <Clock size={20} />,
    title: "Flexible Structures",
    description:
      "Improvement holdbacks for renovations, interest reserves for lease-up periods, and extension options for projects that need additional runway. We structure loans around your business plan, not a rigid product box.",
  },
];

/* ── SMALL BAY INDUSTRIAL ── */
const INDUSTRIAL_USES = [
  {
    icon: <Warehouse size={22} />,
    title: "Flex/Industrial Acquisitions",
    description:
      "Acquire small bay industrial, flex, and light manufacturing properties. These 10,000-100,000 SF multi-tenant buildings are too small for institutional capital but generate strong cash flow when properly leased and managed.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Conversion & Repositioning",
    description:
      "Convert obsolete office or retail to industrial flex space. Subdivide large single-tenant buildings into multi-tenant small bays. Upgrade loading docks, electrical, and HVAC to attract higher-paying tenants.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Lease-Up Capital",
    description:
      "Finance the acquisition and lease-up of vacant or underoccupied industrial space. Bridge capital provides runway to execute tenant improvements, marketing, and lease negotiations without the pressure of conventional debt service coverage requirements.",
  },
];

/* ── SELF STORAGE ── */
const STORAGE_USES = [
  {
    icon: <Package size={22} />,
    title: "Facility Acquisitions",
    description:
      "Acquire existing self storage facilities that need operational improvements, rate optimization, or physical upgrades. Mom-and-pop operators with below-market rates and minimal online presence represent the strongest value-add opportunities.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "Expansion & Conversion",
    description:
      "Finance the addition of climate-controlled units, construction of new buildings on existing land, or conversion of adjacent retail or warehouse space into storage. Adding 100 units at $100/month creates $120,000 in annual revenue.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Revenue Management Optimization",
    description:
      "Acquire underpriced facilities, implement modern revenue management software, raise rates to market, add tenant insurance and ancillary revenue streams. Bridge capital funds the acquisition while you execute the NOI improvement plan.",
  },
];

/* ── MULTI-TENANT RETAIL ── */
const RETAIL_USES = [
  {
    icon: <Store size={22} />,
    title: "Strip Center & Neighborhood Retail",
    description:
      "Acquire multi-tenant strip centers, neighborhood retail plazas, and service-oriented retail properties. Grocery-anchored, medical, or service tenant bases provide stable cash flow. Bridge financing covers acquisitions with near-term lease expirations or vacancy that conventional lenders avoid.",
  },
  {
    icon: <KeyRound size={22} />,
    title: "Tenant Turnover & Re-Leasing",
    description:
      "Finance properties where anchor or major tenants have vacated or given notice. Bridge capital provides time to execute tenant improvements, market the space, and sign replacement tenants at higher rates before refinancing into permanent debt.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Facade & Common Area Upgrades",
    description:
      "Renovation capital for exterior upgrades, parking lot improvements, signage, and common area modernization that attract higher-quality tenants and justify rent increases. Improvement holdbacks fund the work as it is completed.",
  },
];

export default function CommercialBridgePage() {
  const creFAQs = [
    {
      question: "What types of commercial properties does Requity Lending finance?",
      answer:
        "Requity Lending provides bridge financing for a wide range of commercial real estate including small bay industrial, flex space, self storage facilities, multi-tenant retail centers, strip malls, mixed-use properties, and other commercial asset classes. We also have dedicated programs for manufactured housing communities, RV parks, and multifamily properties.",
    },
    {
      question: "Does Requity finance small bay industrial and flex space?",
      answer:
        "Yes. Small bay industrial and flex properties are an active lending category. We finance acquisitions, tenant improvements, conversions from other use types, and lease-up capital for multi-tenant industrial buildings. Typical properties range from 10,000 to 100,000 square feet.",
    },
    {
      question: "Can Requity Lending finance self storage acquisitions?",
      answer:
        "Yes. We finance self storage facility acquisitions, expansions (adding units on existing land), conversions from other property types, and operational turnarounds. Our underwriting accounts for the unique revenue characteristics of self storage including unit mix, occupancy ramp curves, and rate optimization potential.",
    },
    {
      question: "Does Requity finance multi-tenant retail properties?",
      answer:
        "Yes. We finance strip centers, neighborhood retail, and service-oriented multi-tenant retail properties. Properties with near-term lease expirations, vacancy, or anchor tenant turnover are common bridge loan scenarios where conventional lenders cannot move fast enough or take the lease-up risk.",
    },
    {
      question: "How does Requity underwrite a commercial property with significant vacancy?",
      answer:
        "We evaluate the property based on its stabilized potential, not just trailing income. Our underwriting examines market rents for comparable space, the borrower's leasing plan and timeline, tenant improvement budgets, and the exit strategy. A commercial property at 50% occupancy with strong market fundamentals and an experienced operator is a deal we want to evaluate.",
    },
    {
      question: "Can I include tenant improvement capital in my bridge loan?",
      answer:
        "Yes. We structure improvement holdbacks that cover tenant improvements, common area upgrades, facade renovations, and other capital expenditures needed to lease and stabilize the property. Funds are released on a draw basis as work is completed.",
    },
    {
      question: "What is the typical exit strategy for a commercial bridge loan?",
      answer:
        "Common exits include refinancing into conventional bank financing, SBA 504 loans, CMBS, or agency debt once the property is stabilized with documented occupancy and income. Some borrowers also exit through sale of the improved, stabilized asset.",
    },
    {
      question: "How fast can Requity close on a commercial property?",
      answer:
        "We can close commercial acquisitions in as few as 10 business days from signed term sheet. Most deals close within 10-15 business days. We deliver term sheets within 48 hours of receiving a complete deal package.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Commercial Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for commercial real estate including small bay industrial, self storage, and multi-tenant retail. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/commercial-bridge",
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
      <FAQSchema faqs={creFAQs} />

      {/* HERO */}
      <PageHero
        label="Commercial Bridge"
        headline={
          <>
            Commercial real estate{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              bridge financing
            </em>
          </>
        }
        body="Bridge loans for small bay industrial, self storage, and multi-tenant retail. Acquisition, repositioning, and lease-up capital for commercial operators who need speed and flexibility."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your CRE Deal <ArrowRight size={16} />
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
              Built for deals banks{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                cannot close
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
              Conventional lenders need stabilized income, clean tenant rolls,
              and 60-90 days to close. The best commercial deals have none of
              those things. Bridge financing lets you acquire, improve, and
              stabilize before seeking permanent capital.
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

      {/* ═══════════════════════════════════════════════
          SMALL BAY INDUSTRIAL
         ═══════════════════════════════════════════════ */}
      <section
        id="industrial"
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Industrial</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Small bay industrial &amp; flex space
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Multi-tenant industrial buildings are one of the strongest
              commercial asset classes in the current market: high demand from
              e-commerce, last-mile logistics, and small business tenants,
              with limited new supply and strong rent growth. Bridge financing
              lets you acquire underperforming buildings and execute the
              value-add play before permanent capital is available.
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
              {INDUSTRIAL_USES.map((item) => (
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

          {/* Industrial deal economics */}
          <ScrollReveal>
            <div
              style={{
                marginTop: 48,
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
                    ["Purchase Price", "$1,400,000"],
                    ["Building Size", "32,000 SF (8 bays)"],
                    ["Current Occupancy", "50%"],
                    ["Current NOI", "$4,200/mo"],
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
                  Bridge Loan
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Bridge Loan", "$1,050,000"],
                    ["TI/Reno Holdback", "$160,000"],
                    ["Total Facility", "$1,210,000"],
                    ["Borrower Equity", "$350,000"],
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
                  Stabilized (12 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Occupancy", "94%"],
                    ["Avg Rent", "$8.50/SF NNN"],
                    ["Stabilized NOI", "$12,800/mo"],
                    ["Equity Created", "~$640,000"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: label === "Equity Created" ? "var(--gold)" : "var(--text)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SELF STORAGE
         ═══════════════════════════════════════════════ */}
      <section
        id="self-storage"
        className="light-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Self Storage</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Self storage facility financing
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Self storage has proven itself as one of the most resilient
              commercial asset classes through multiple economic cycles. The
              value-add opportunity is clear: acquire facilities with
              below-market rates and minimal online presence, implement modern
              revenue management, and watch NOI climb. Bridge financing gives
              you the acquisition capital while you execute.
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
              {STORAGE_USES.map((item) => (
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

          {/* Storage deal economics */}
          <ScrollReveal>
            <div
              style={{
                marginTop: 48,
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
                    ["Purchase Price", "$950,000"],
                    ["Existing Units", "180"],
                    ["Current Occupancy", "72%"],
                    ["Avg Rate", "$85/unit/mo"],
                    ["Annual Revenue", "$132,000"],
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
                  Bridge Loan
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Bridge Loan", "$715,000"],
                    ["Expansion Holdback", "$140,000"],
                    ["Total Facility", "$855,000"],
                    ["Borrower Equity", "$235,000"],
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
                  Stabilized (14 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Total Units", "220 (40 added)"],
                    ["Occupancy", "90%"],
                    ["Avg Rate", "$115/unit/mo"],
                    ["Annual Revenue", "$273,000"],
                    ["Equity Created", "~$550,000"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: label === "Equity Created" ? "var(--gold)" : "var(--text)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MULTI-TENANT RETAIL
         ═══════════════════════════════════════════════ */}
      <section
        id="retail"
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Retail</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Multi-tenant retail financing
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Service-oriented and necessity-based retail continues to
              perform. Strip centers anchored by grocers, medical offices,
              and essential services generate stable cash flow with
              predictable demand. The value-add opportunity exists in
              properties with lease rollover, vacancy from anchor departure,
              or deferred maintenance that conventional lenders avoid.
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
              {RETAIL_USES.map((item) => (
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

          {/* Retail deal economics */}
          <ScrollReveal>
            <div
              style={{
                marginTop: 48,
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
                    ["Purchase Price", "$1,600,000"],
                    ["GLA", "18,000 SF (6 suites)"],
                    ["Current Occupancy", "67%"],
                    ["Anchor Tenant", "Vacant (departed)"],
                    ["Current NOI", "$5,400/mo"],
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
                  Bridge Loan
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Bridge Loan", "$1,200,000"],
                    ["TI Holdback", "$180,000"],
                    ["Total Facility", "$1,380,000"],
                    ["Borrower Equity", "$400,000"],
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
                  Stabilized (12 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Occupancy", "100%"],
                    ["New Anchor Tenant", "Signed (5-yr NNN)"],
                    ["Stabilized NOI", "$13,200/mo"],
                    ["Equity Created", "~$560,000"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{label}</span>
                      <span style={{ fontWeight: 600, color: label === "Equity Created" ? "var(--gold)" : "var(--text)" }}>{value}</span>
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
              Representative examples for illustrative purposes only. Actual
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
              Commercial bridge lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={creFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a commercial{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              deal?
            </em>
          </>
        }
        body="Submit your property details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your CRE Deal <ArrowRight size={16} />
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
