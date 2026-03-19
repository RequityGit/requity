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
  TrendingUp,
  Wrench,
  RefreshCw,
  Users,
  Layers,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Small Bay Industrial & Flex Space Bridge Loans",
  description:
    "Bridge loans for small bay industrial, flex space, and light manufacturing properties. Finance acquisitions, conversions, and lease-up. 10K-100K SF. Close in 10 days.",
  openGraph: {
    title: "Small Bay Industrial Financing | Requity Lending",
    description:
      "Bridge financing for small bay industrial and flex space acquisitions. Multi-tenant buildings 10K-100K SF. $250K-$10M. Close in as few as 10 business days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Small Bay Industrial Financing | Requity Lending",
    description:
      "Bridge financing for small bay industrial and flex space. Close in 10 days. Term sheets in 48 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 80%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "TI Capital", value: "Available" },
];

const USE_CASES = [
  {
    icon: <Warehouse size={22} />,
    title: "Multi-Tenant Flex Acquisitions",
    description:
      "Acquire small bay industrial buildings with 4-20 suites in the 1,000-5,000 SF range. These multi-tenant properties generate diversified income from small businesses, contractors, e-commerce operators, and service companies. Bridge financing underwrites to the stabilized rent roll, not just current occupancy.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "Office-to-Industrial Conversion",
    description:
      "Convert obsolete suburban office buildings into flex industrial space. Office vacancy is elevated nationally while small bay industrial demand is at historic highs. Bridge capital funds the acquisition and conversion, with improvement holdbacks releasing as tenant improvements are completed.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Building Upgrades & Modernization",
    description:
      "Fund electrical upgrades (3-phase power), loading dock additions, HVAC improvements, LED lighting, and roll-up door installations that transform dated buildings into modern flex space commanding premium rents. Each improvement directly increases per-square-foot rental rates.",
  },
  {
    icon: <Users size={22} />,
    title: "Lease-Up Capital",
    description:
      "Finance vacant or underoccupied industrial buildings during the tenant improvement and leasing period. Bridge loans provide 12-18 months of runway to build out suites, market the space, and sign tenants without the pressure of conventional debt service coverage requirements.",
  },
  {
    icon: <Layers size={22} />,
    title: "Subdivision & Bay Creation",
    description:
      "Acquire single-tenant industrial buildings and subdivide into multi-tenant small bays. A 30,000 SF warehouse leased to one tenant at $6/SF can generate $10-$14/SF when subdivided into 2,000-5,000 SF bays. Bridge financing covers the acquisition and build-out.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Portfolio Consolidation",
    description:
      "Combine multiple small bay industrial acquisitions into a single bridge facility. Operators building a portfolio of flex and light industrial properties can streamline closings and reduce transaction costs across multiple simultaneous acquisitions.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "The Strongest CRE Fundamentals",
    description:
      "Small bay industrial has the lowest vacancy rate and strongest rent growth of any commercial asset class. E-commerce, last-mile logistics, and the growth of small business operations are driving demand that new construction cannot keep pace with.",
  },
  {
    icon: <Shield size={20} />,
    title: "Underserved by Traditional Lenders",
    description:
      "Banks prefer large single-tenant industrial with credit tenants. Multi-tenant small bay buildings with diverse tenant bases and frequent turnover do not fit conventional underwriting. Bridge financing fills this gap for experienced operators.",
  },
  {
    icon: <Clock size={20} />,
    title: "Speed Wins in a Tight Market",
    description:
      "Institutional capital has discovered small bay industrial, compressing cap rates and accelerating deal timelines. A 10-day close with no financing contingency differentiates your offer in a market where multiple bidders are common.",
  },
];

export default function SmallBayIndustrialPage() {
  const sbiFAQs = [
    {
      question: "What is small bay industrial real estate?",
      answer:
        "Small bay industrial refers to multi-tenant industrial buildings where individual suites typically range from 1,000 to 5,000 square feet. These properties serve small businesses, contractors, e-commerce fulfillment operations, light manufacturers, and service companies. Total building sizes typically range from 10,000 to 100,000 square feet with 4-20+ individual tenant suites.",
    },
    {
      question: "Does Requity Lending finance small bay industrial acquisitions?",
      answer:
        "Yes. Small bay industrial and flex space are active lending categories. We finance acquisitions, lease-up, building modernization, office-to-industrial conversions, and subdivision of larger buildings into multi-tenant small bays. Loan sizes range from $250K to $10M.",
    },
    {
      question: "Can I finance the conversion of office space to industrial flex?",
      answer:
        "Yes. Office-to-industrial conversion is one of the strongest value-add plays in commercial real estate. We structure bridge loans with improvement holdbacks to cover both the acquisition and conversion costs. Funds release as construction milestones are completed.",
    },
    {
      question: "How does Requity underwrite multi-tenant industrial with vacancy?",
      answer:
        "We evaluate the property based on market rents for comparable flex and small bay space, the borrower's leasing plan, tenant improvement budgets, and the exit strategy. A multi-tenant industrial building at 50-60% occupancy with below-market rents and strong local demand is a deal we want to evaluate.",
    },
    {
      question: "What is the typical exit strategy for a small bay industrial bridge loan?",
      answer:
        "Most common exits include refinancing into conventional bank financing or SBA 504 loans once the property reaches 85%+ occupancy with 6-12 months of trailing income history. Some borrowers also exit through sale of the stabilized asset at significantly compressed cap rates.",
    },
    {
      question: "Can I include tenant improvement capital in the bridge loan?",
      answer:
        "Yes. We structure tenant improvement holdbacks directly into the bridge loan. This covers suite build-outs, demising walls, electrical upgrades, HVAC, loading areas, and other improvements needed to lease individual bays. Draws release as TI work is completed.",
    },
    {
      question: "How fast can Requity close on a small bay industrial property?",
      answer:
        "We can close in as few as 10 business days from signed term sheet. Most industrial deals close within 10-15 business days. Term sheets are delivered within 48 hours of receiving a complete deal package.",
    },
    {
      question: "What markets does Requity cover for industrial lending?",
      answer:
        "Requity Lending provides small bay industrial financing nationwide. We evaluate markets based on industrial vacancy rates, e-commerce penetration, population and employment growth, and comparable rental rates for flex and small bay space.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Small Bay Industrial Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for small bay industrial and flex space properties. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/small-bay-industrial",
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
      <FAQSchema faqs={sbiFAQs} />

      {/* HERO */}
      <PageHero
        label="Small Bay Industrial"
        headline={
          <>
            Flex &amp; light industrial{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans for small bay industrial, flex space, and light manufacturing properties. Acquisition, conversion, and lease-up capital for the strongest asset class in commercial real estate."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your Industrial Deal <ArrowRight size={16} />
            </Link>
            <Link href="/lending" className="btn-editorial-light">
              <ArrowLeft size={14} /> All Loan Programs
            </Link>
          </div>
        }
      />

      {/* LOAN TERMS */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--navy-border)" }}>
            {LOAN_DETAILS.map((item, i) => (
              <div key={item.label} style={{ padding: "28px 0", textAlign: "center", borderRight: i < LOAN_DETAILS.length - 1 ? "1px solid var(--navy-border)" : "none" }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--gold-muted)", marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--navy-text-mid)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY REQUITY */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Why Small Bay Industrial</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>
              The strongest fundamentals in{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>commercial real estate</em>
            </h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              Small bay industrial has the lowest vacancy rates, strongest rent growth, and most favorable supply-demand dynamics of any commercial asset class. E-commerce, last-mile logistics, and small business growth are driving demand that new construction cannot satisfy.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {WHY_ITEMS.map((item) => (
                <div key={item.title} className="card">
                  <div style={{ color: "var(--gold)", marginBottom: 16 }}>{item.icon}</div>
                  <h3 className="card-title" style={{ fontSize: 20, marginBottom: 8 }}>{item.title}</h3>
                  <p className="card-body">{item.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* USE CASES */}
      <section className="cream-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Use Cases</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>What we finance</h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 600, marginBottom: 48 }}>
              From multi-tenant flex acquisitions to office-to-industrial conversions and bay subdivision projects.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {USE_CASES.map((item) => (
                <div key={item.title} className="card">
                  <div style={{ color: "var(--gold)", marginBottom: 16 }}>{item.icon}</div>
                  <h3 className="card-title" style={{ fontSize: 20, marginBottom: 8 }}>{item.title}</h3>
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
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>How the numbers work</h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              A representative small bay industrial acquisition: buy a half-vacant building, subdivide, lease up, and refinance at a significantly higher valuation.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>Acquisition</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Purchase Price", "$1,250,000"],
                    ["Building Size", "24,000 SF"],
                    ["Configuration", "6 bays (4,000 SF each)"],
                    ["Current Occupancy", "50% (3 of 6 leased)"],
                    ["Current Rent", "$6.50/SF NNN"],
                    ["Current NOI", "$4,200/mo"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>Bridge Loan</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Bridge Loan", "$940,000"],
                    ["TI Holdback", "$120,000"],
                    ["Total Facility", "$1,060,000"],
                    ["Rate", "12% IO"],
                    ["Borrower Equity", "$310,000"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>Stabilized (12 Months)</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Occupancy", "100% (6 of 6)"],
                    ["Avg Rent", "$11.00/SF NNN"],
                    ["Stabilized NOI", "$14,400/mo"],
                    ["Appraised Value", "$2,300,000"],
                    ["Equity Created", "~$930,000"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: l === "Equity Created" ? "var(--gold)" : "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <p className="type-body-sm" style={{ color: "var(--text-light)", marginTop: 24, fontStyle: "italic" }}>
              Representative example for illustrative purposes only. Actual deal economics vary based on market conditions, execution, and property specifics.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="light-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>Small bay industrial lending FAQ</h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={sbiFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={<>Have an industrial <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>deal?</em></>}
        body="Submit your small bay industrial or flex space details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={<Link href="/lending/apply" className="btn-primary">Submit Your Industrial Deal <ArrowRight size={16} /></Link>}
        secondaryCta={<Link href="/lending" className="btn-secondary">All Loan Programs <ArrowRight size={16} /></Link>}
      />
    </main>
  );
}
