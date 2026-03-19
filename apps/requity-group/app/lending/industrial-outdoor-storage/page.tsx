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
  Truck,
  Container,
  MapPin,
  TrendingUp,
  Wrench,
  Shield as ShieldIcon,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Industrial Outdoor Storage (IOS) Financing | Bridge Loans",
  description:
    "Bridge loans for industrial outdoor storage properties. Finance truck yards, container storage, equipment yards, and open-air industrial sites. Close in 10 days.",
  openGraph: {
    title: "IOS Financing | Industrial Outdoor Storage Bridge Loans | Requity Lending",
    description:
      "Bridge financing for IOS properties: truck terminals, container yards, equipment storage. $250K-$10M. Close in as few as 10 business days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IOS Bridge Loans | Requity Lending",
    description:
      "Bridge financing for industrial outdoor storage. Truck yards, container storage, equipment yards. Close in 10 days.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$250K - $10M" },
  { label: "LTC", value: "Up to 75%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Improvement Capital", value: "Available" },
];

const USE_CASES = [
  {
    icon: <Truck size={22} />,
    title: "Truck Yard & Terminal Acquisitions",
    description:
      "Acquire truck yards, trailer parking facilities, and freight terminals. These properties generate strong cash flow from trucking companies, logistics operators, and last-mile delivery services that need secure outdoor parking and staging areas.",
  },
  {
    icon: <Container size={22} />,
    title: "Container & Equipment Storage",
    description:
      "Finance container storage yards, heavy equipment depots, and material staging areas. Intermodal facilities near ports, rail, and highway interchange locations command premium lease rates driven by supply chain demand.",
  },
  {
    icon: <MapPin size={22} />,
    title: "Land Acquisition & Entitlement",
    description:
      "Acquire raw or underutilized land with industrial zoning suitable for IOS conversion. Properties near ports, intermodal facilities, and major logistics corridors with proper zoning are increasingly scarce. Bridge capital lets you secure the land while you execute site improvements.",
  },
  {
    icon: <Wrench size={22} />,
    title: "Site Improvements",
    description:
      "Fund grading, paving, fencing, security systems, lighting, drainage, and utility connections that transform raw land into a functional IOS facility. Improvement holdbacks release funds as each phase of site work is completed and inspected.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Value-Add Repositioning",
    description:
      "Acquire underperforming IOS properties with below-market rents, poor site conditions, or underutilized acreage. Improve the facility, implement professional management, adjust rates to market, and refinance at a significantly higher valuation.",
  },
  {
    icon: <ShieldIcon size={22} />,
    title: "Zoning & Use Conversion",
    description:
      "Finance properties being converted from other industrial uses to outdoor storage. Former manufacturing sites, scrap yards, and underutilized industrial parcels can be repositioned as IOS facilities to capture the growing demand for outdoor industrial space.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "We Underwrite Land Value, Not Just Buildings",
    description:
      "Traditional lenders focus on building improvements. IOS value is in the land, the zoning, and the location relative to logistics infrastructure. Our underwriting model evaluates the full income potential of the site, not just the structures on it.",
  },
  {
    icon: <Shield size={20} />,
    title: "First-Mover Lending in IOS",
    description:
      "Regional banks handle ~90% of IOS financing because most national bridge lenders have not built underwriting models for the asset class. Requity fills that gap with bridge capital specifically structured for outdoor industrial properties.",
  },
  {
    icon: <Clock size={20} />,
    title: "Speed in a Scarcity Market",
    description:
      "Properly zoned industrial land near logistics corridors is disappearing. Municipalities are restricting new IOS zoning. When a site becomes available, the operator who can close in 10 days with no financing contingency wins.",
  },
];

export default function IOSPage() {
  const iosFAQs = [
    {
      question: "What is industrial outdoor storage (IOS)?",
      answer:
        "Industrial outdoor storage refers to open-air industrial properties used for parking, storage, and staging of trucks, trailers, containers, heavy equipment, construction materials, and other industrial goods. Common IOS property types include truck yards, trailer parking facilities, container depots, equipment storage yards, and material staging areas. The value is primarily in the land, zoning, and location rather than building improvements.",
    },
    {
      question: "Does Requity Lending finance industrial outdoor storage properties?",
      answer:
        "Yes. IOS is an active and growing lending category for Requity. We finance acquisitions of existing IOS facilities, land acquisition for IOS development, site improvements (grading, paving, fencing, utilities), and value-add repositioning of underperforming outdoor industrial properties.",
    },
    {
      question: "Why is IOS difficult to finance with traditional lenders?",
      answer:
        "Traditional lenders focus on building improvements as collateral. IOS properties have minimal structures, with the value concentrated in the land, zoning entitlements, and location relative to logistics infrastructure. Most banks lack underwriting models for this asset class. Regional banks handle approximately 90% of IOS financing as a result. Bridge lenders like Requity fill the gap for acquisitions that need speed or fall outside traditional guidelines.",
    },
    {
      question: "How does Requity underwrite IOS properties?",
      answer:
        "We evaluate IOS properties based on: zoning and entitlements (current and highest-and-best use), location relative to ports, intermodal facilities, and highway interchanges, comparable lease rates for outdoor industrial space in the market, existing lease income and tenant quality, site condition and improvement needs, and the borrower's operating plan and exit strategy.",
    },
    {
      question: "Can I include site improvement capital in my IOS bridge loan?",
      answer:
        "Yes. We structure improvement holdbacks for grading, paving, fencing, security systems, lighting, drainage, and utility connections. Funds release on a draw basis as each phase of site work is completed and inspected.",
    },
    {
      question: "What is the typical exit strategy for an IOS bridge loan?",
      answer:
        "Common exits include refinancing into conventional bank financing once the property has stabilized income and documented tenant history, sale of the improved facility at a compressed cap rate, or long-term hold with permanent financing from a regional bank familiar with the asset class.",
    },
    {
      question: "What cap rates are IOS properties trading at?",
      answer:
        "IOS cap rates vary widely based on location, zoning, and improvements. Properties near major logistics hubs in tier-1 markets trade at 5-7% cap rates. Secondary market IOS with strong fundamentals trades at 7-9%. Unimproved or transitional sites can be acquired at higher yields with significant upside potential through site improvements and professional management.",
    },
    {
      question: "How fast can Requity close on an IOS acquisition?",
      answer:
        "We can close IOS acquisitions in as few as 10 business days from signed term sheet. Term sheets are delivered within 48 hours of receiving a complete deal package including site details, zoning confirmation, and operating plan.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Industrial Outdoor Storage Bridge Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Bridge loans for industrial outdoor storage (IOS) properties including truck yards, container storage, and equipment yards. Loan sizes $250K-$10M, 12% interest-only, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/industrial-outdoor-storage",
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
      <FAQSchema faqs={iosFAQs} />

      {/* HERO */}
      <PageHero
        label="Industrial Outdoor Storage"
        headline={
          <>
            IOS{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans for industrial outdoor storage: truck yards, container depots, equipment storage, and open-air industrial sites. Acquisition and improvement capital for the fastest-growing niche in commercial real estate."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your IOS Deal <ArrowRight size={16} />
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
            <SectionLabel>Why Requity for IOS</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>
              Built for an asset class{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>banks cannot underwrite</em>
            </h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              Industrial outdoor storage is the fastest-growing niche in commercial real estate, but traditional lenders have not caught up. Their models need buildings as collateral. IOS value is in the land, the zoning, and the logistics location. We underwrite accordingly.
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
              From stabilized truck yard acquisitions to raw land conversion for container storage and equipment depots.
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
              A representative IOS acquisition: secure a zoned industrial site, improve it for truck and container storage, lease to logistics operators, and refinance at stabilized value.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>Acquisition</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Purchase Price", "$1,800,000"],
                    ["Site Size", "5 acres"],
                    ["Zoning", "Industrial (IOS permitted)"],
                    ["Current Use", "Underutilized gravel yard"],
                    ["Current Income", "$4,500/mo (month-to-month)"],
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
                    ["Bridge Loan", "$1,350,000"],
                    ["Site Improvement Holdback", "$280,000"],
                    ["Total Facility", "$1,630,000"],
                    ["Rate", "12% IO"],
                    ["Borrower Equity", "$450,000"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>Stabilized (14 Months)</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Improvements", "Paved, fenced, lit, secured"],
                    ["Tenants", "3 logistics operators (NNN)"],
                    ["Stabilized NOI", "$18,500/mo"],
                    ["Appraised Value", "$3,100,000"],
                    ["Equity Created", "~$1,020,000"],
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
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>IOS lending FAQ</h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={iosFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={<>Have an IOS <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>deal?</em></>}
        body="Submit your industrial outdoor storage property details and our lending team will deliver a term sheet within 48 hours. No obligation, no credit pull."
        primaryCta={<Link href="/lending/apply" className="btn-primary">Submit Your IOS Deal <ArrowRight size={16} /></Link>}
        secondaryCta={<Link href="/lending" className="btn-secondary">All Loan Programs <ArrowRight size={16} /></Link>}
      />
    </main>
  );
}
