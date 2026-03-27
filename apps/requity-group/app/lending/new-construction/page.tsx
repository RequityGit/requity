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
  Zap,
  Hammer,
  Clock,
  Home,
  MapPin,
  Building,
  Layers,
  PlusSquare,
  Trees,
  ClipboardCheck,
  Search,
  DollarSign,
  FileText,
  User,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "New Construction Loans | Ground-Up Residential Financing | Requity Lending",
  description:
    "New construction loans for residential builders and investors. Finance land acquisition and construction costs with draw-based funding. 12-24 month terms, up to 85% LTC, close in as few as 10 days.",
  openGraph: {
    title: "New Construction Loans | Requity Lending",
    description:
      "Ground-up construction financing for residential builders and investors. Up to 85% LTC, 100% of construction budget funded through draws. $150K-$3M.",
  },
  twitter: {
    card: "summary_large_image",
    title: "New Construction Loans | Requity Lending",
    description:
      "Ground-up residential construction financing. Up to 85% LTC, draw-based funding. Term sheets in 24 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$150K - $3M" },
  { label: "LTC", value: "Up to 85%" },
  { label: "Max LTV", value: "Up to 70%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "12 - 24 Months" },
  { label: "Closing", value: "As Few as 10 Days" },
  { label: "Construction Funding", value: "100% of Budget" },
  { label: "Prepayment", value: "No Penalty" },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "Single-Close Simplicity",
    description:
      "One loan covers both land acquisition and vertical construction. No need to coordinate separate land loans and construction facilities. One closing, one set of documents, and one point of contact from dirt to certificate of occupancy.",
  },
  {
    icon: <Hammer size={20} />,
    title: "Milestone-Based Draw Process",
    description:
      "Construction funds are released as phases are completed: site work, foundation, framing, mechanicals, and finish. Third-party inspections verify progress and funds are wired within 2-3 business days of approval. Interest is charged only on the drawn balance.",
  },
  {
    icon: <Clock size={20} />,
    title: "Flexible Exit Strategies",
    description:
      "Sell the completed home at market value, refinance into a long-term DSCR rental loan, or list and hold. Your exit plan can evolve as the market shifts during construction, and there is no prepayment penalty on early payoff.",
  },
];

const USE_CASES = [
  {
    icon: <Home size={22} />,
    title: "Spec Home Builds",
    description:
      "Build single-family homes for resale in high-demand markets. Finance the lot purchase and full construction cost through a single facility, then sell the completed home to an end buyer. Ideal for experienced builders targeting move-in-ready inventory in supply-constrained neighborhoods.",
  },
  {
    icon: <MapPin size={22} />,
    title: "Infill & Lot Development",
    description:
      "Develop vacant infill lots, subdivided parcels, or teardown-and-rebuild opportunities in established neighborhoods. These projects benefit from strong comparable sales, existing infrastructure, and buyer demand for new construction in areas where inventory is limited.",
  },
  {
    icon: <Building size={22} />,
    title: "Small Multifamily Construction",
    description:
      "Ground-up duplexes, triplexes, and fourplexes built as investment properties. Finance the full construction and hold or sell upon completion. Small multifamily new builds generate strong rental income and command premium valuations in markets with housing shortages.",
  },
  {
    icon: <Layers size={22} />,
    title: "Townhome Projects",
    description:
      "Small-scale townhome developments of 2-4 attached units per building. Townhomes offer efficient land use and strong buyer appeal for entry-level homeownership. Construction financing covers site work through finish with draws tied to each phase of the build.",
  },
  {
    icon: <PlusSquare size={22} />,
    title: "ADU & Detached Unit Construction",
    description:
      "Build accessory dwelling units on existing residential lots where zoning permits additional density. ADUs generate rental income, increase property value, and are increasingly popular in markets with housing affordability pressures and favorable local regulations.",
  },
  {
    icon: <Trees size={22} />,
    title: "Land Acquisition + Build",
    description:
      "Finance the land purchase and construction in a single facility. Acquire a buildable lot, break ground, and complete construction under one loan with one closing. Eliminates the need for a separate land loan and simplifies the capital stack for ground-up projects.",
  },
];

const DRAW_STEPS = [
  {
    icon: <ClipboardCheck size={22} />,
    title: "Submit Plans & Budget",
    description:
      "Provide your construction plans, permits, and a detailed line-item budget with your loan application. Our team reviews the build plan and structures a draw schedule around major construction phases: site work, foundation, framing, mechanicals, and finish.",
  },
  {
    icon: <Hammer size={22} />,
    title: "Complete Phase & Request Draw",
    description:
      "Finish a construction milestone and submit a draw request through our portal. Upload progress photos and documentation for the completed phase. Draw requests can be submitted at any point as milestones are reached.",
  },
  {
    icon: <Search size={22} />,
    title: "Third-Party Inspection",
    description:
      "A licensed inspector verifies that the completed work matches the approved plans and budget. Inspections are typically scheduled within 1-2 business days of your draw request to keep the project moving.",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Funds Released",
    description:
      "Once the inspection confirms the phase is complete, funds are wired to your account within 2-3 business days. Interest is calculated only on the drawn balance, so you pay nothing on future construction phases until they are funded.",
  },
];

export default function NewConstructionPage() {
  const constructionFAQs = [
    {
      question: "What is a new construction loan?",
      answer:
        "A new construction loan is a short-term financing facility designed for building residential properties from the ground up. The loan covers both the land acquisition and the vertical construction costs. Funds are released in phases through a draw process as construction milestones are completed, and interest is charged only on the amount that has been drawn. Terms are typically 12 to 24 months, giving the builder time to complete construction and sell or refinance the finished property.",
    },
    {
      question: "How much can I borrow for a new construction project?",
      answer:
        "Requity Lending provides new construction loans from $150,000 to $3,000,000. We lend up to 85% of the total project cost (land price plus construction budget) and up to 70% of the completed value. The construction portion of the loan is funded at 100% of the approved budget and released through draws as phases are completed and inspected.",
    },
    {
      question: "Do I need construction experience to qualify?",
      answer:
        "Prior construction or real estate investment experience is preferred but not always required. Builders with a track record of completed ground-up projects will receive the best terms and fastest approvals. First-time builders can qualify with a strong deal, a licensed general contractor, adequate reserves, and a realistic construction timeline and budget.",
    },
    {
      question: "How does the construction draw process work?",
      answer:
        "After closing, construction funds are held in escrow and released as milestones are completed. The draw schedule is structured around major phases: site work, foundation, framing, mechanicals (electrical, plumbing, HVAC), and finish (drywall, flooring, fixtures, landscaping). You submit a draw request through our portal, a third-party inspector verifies the work, and funds are wired within 2-3 business days of a successful inspection.",
    },
    {
      question: "How fast can Requity close on a new construction loan?",
      answer:
        "We can close new construction loans in as few as 10 business days from signed term sheet. Timeline depends on the completeness of your application package, including approved plans, permits, and a detailed construction budget. We deliver term sheets within 24 hours of receiving a complete deal package, and there is no credit pull required to receive a term sheet.",
    },
    {
      question: "Do I need approved plans and permits before applying?",
      answer:
        "You do not need approved plans to receive a term sheet or begin the underwriting process. However, approved plans and permits are required before closing. If you are in the planning or permitting phase, we can issue a conditional term sheet based on preliminary plans and close once approvals are in place. Early engagement helps us move quickly once permits are secured.",
    },
    {
      question: "Can I be my own general contractor?",
      answer:
        "In most cases, a licensed general contractor is required to manage the construction project. If you hold a valid general contractor license in the state where the property is located, you may serve as your own GC. Unlicensed borrowers will need to engage a licensed third-party general contractor. The GC agreement and license are part of the required loan documentation.",
    },
    {
      question: "What happens if construction costs exceed the original budget?",
      answer:
        "Cost overruns are common in construction. If your project exceeds the approved budget, we evaluate the situation on a case-by-case basis. Options may include a loan modification to increase the facility, reallocation of contingency funds within the existing budget, or additional borrower equity contribution. We recommend building a contingency buffer of 10-15% into your original construction budget.",
    },
    {
      question: "Can I finance land and construction in one loan?",
      answer:
        "Yes. Our new construction loan covers both the land acquisition and the full construction budget in a single facility with one closing. You do not need a separate land loan. The land portion funds at closing and construction draws are released as phases are completed. This simplifies the capital stack and reduces total closing costs compared to a two-loan structure.",
    },
    {
      question: "What types of properties can I build with a construction loan?",
      answer:
        "Requity finances ground-up construction of single-family homes, duplexes, triplexes, fourplexes, townhomes, and accessory dwelling units (ADUs). Properties must be residential and located in markets with demonstrated demand for new construction. We do not finance large-scale subdivisions, commercial buildings, or owner-occupied primary residences through this program.",
    },
    {
      question: "Do I need an LLC to get a new construction loan?",
      answer:
        "An LLC or other business entity is preferred but not strictly required. Most experienced builders operate through an entity for liability protection and tax purposes, and we can close in the name of your LLC. If you have not yet formed an entity, you can still qualify and close in your personal name. We recommend consulting with an attorney about entity structure before beginning a construction project.",
    },
    {
      question: "What are the costs of a new construction loan?",
      answer:
        "New construction loans are priced at 12% interest-only with origination points and standard closing costs. Interest is calculated only on the drawn balance, meaning you do not pay interest on construction funds until they are released through the draw process. There are no prepayment penalties, so you can pay off the loan as soon as the property sells or is refinanced.",
    },
    {
      question:
        "Can I convert my construction loan into a rental loan after the build is complete?",
      answer:
        "Yes. If you decide to hold the completed property as a rental rather than selling it, you can refinance out of the construction loan into a long-term DSCR rental loan once a certificate of occupancy is issued and a tenant is in place. Requity supports both the construction and the permanent financing, allowing you to transition from build to hold without changing lenders.",
    },
    {
      question:
        "Can I extend my construction loan if the build takes longer than expected?",
      answer:
        "Yes. Extension options are available if your construction timeline extends beyond the original loan term. Extensions are evaluated on a case-by-case basis and depend on project progress, remaining work, and market conditions. We recommend communicating early if you anticipate needing additional time so we can discuss options well before maturity.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "New Construction Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Ground-up construction loans for residential builders and investors. Loan sizes $150K-$3M, up to 85% LTC, 100% construction funding through draws, close in as few as 10 business days.",
    url: "https://requitygroup.com/lending/new-construction",
    category: "Construction Loan",
    amount: {
      "@type": "MonetaryAmount",
      minValue: 150000,
      maxValue: 3000000,
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
      <FAQSchema faqs={constructionFAQs} />

      {/* HERO */}
      <PageHero
        label="New Construction"
        headline={
          <>
            Ground-up residential{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Construction loans for builders and investors. Finance land acquisition and vertical construction through a single facility with draw-based funding released as milestones are completed. From spec homes to small multifamily."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your Construction Deal <ArrowRight size={16} />
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
              Built for builders who{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                break ground
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
              Ground-up construction requires a lender who understands the build
              process, funds draws quickly, and does not slow down your project
              timeline. Traditional banks take months to close and require
              extensive documentation. Requity delivers construction capital with
              speed and simplicity.
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
              From single-family spec homes to small multifamily builds and
              accessory dwelling units. Every ground-up project has a loan
              structure to match.
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

      {/* ELIGIBILITY & REQUIREMENTS */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Eligibility</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Who qualifies and{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                what you need
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
              New construction loans are for investment properties only, not
              owner-occupied residences. Both first-time builders and experienced
              developers can qualify with the right deal and team.
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
              <div className="card">
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <Building size={22} />
                </div>
                <h3
                  className="card-title"
                  style={{ fontSize: 20, marginBottom: 8 }}
                >
                  Eligible Property Types
                </h3>
                <p className="card-body" style={{ marginBottom: 16 }}>
                  We finance ground-up residential construction across a range of
                  property types and markets.
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    "Single-family homes (SFR)",
                    "2-4 unit residential properties",
                    "Townhomes",
                    "Accessory dwelling units (ADUs)",
                    "Infill lots with approved plans",
                    "Urban, suburban, and select rural markets",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <CheckCircle
                        size={16}
                        style={{
                          color: "var(--gold)",
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="type-body-sm"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <User size={22} />
                </div>
                <h3
                  className="card-title"
                  style={{ fontSize: 20, marginBottom: 8 }}
                >
                  Borrower Requirements
                </h3>
                <p className="card-body" style={{ marginBottom: 16 }}>
                  We underwrite the project first, then the builder. Experience
                  and a licensed GC are key factors.
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    "Prior construction or renovation experience preferred",
                    "First-time builders considered with strong deal and GC partnership",
                    "Licensed general contractor required (borrower or third-party)",
                    "LLC or entity structure preferred but not required",
                    "No W-2s, tax returns, or employment verification needed",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <CheckCircle
                        size={16}
                        style={{
                          color: "var(--gold)",
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="type-body-sm"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <FileText size={22} />
                </div>
                <h3
                  className="card-title"
                  style={{ fontSize: 20, marginBottom: 8 }}
                >
                  What to Bring
                </h3>
                <p className="card-body" style={{ marginBottom: 16 }}>
                  A complete deal package helps us deliver a term sheet within
                  24 hours.
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    "Property address or lot information with purchase price",
                    "Construction plans and permits (or timeline to obtain)",
                    "Detailed construction budget with line-item breakdown",
                    "General contractor agreement and license",
                    "Comparable sales for completed value estimate",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <CheckCircle
                        size={16}
                        style={{
                          color: "var(--gold)",
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="type-body-sm"
                        style={{ color: "var(--text-mid)" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* DEAL ECONOMICS */}
      <section
        className="cream-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
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
              A representative new construction deal showing how a single
              facility covers the land acquisition and full build, and how value
              is created through the construction process.
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
              <div
                className="card"
                style={{ borderLeft: "3px solid var(--gold)" }}
              >
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
                  Land + Plans
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {[
                    ["Land Purchase Price", "$120,000"],
                    ["Plans & Permits", "$25,000"],
                    ["Completed Home Value", "$525,000"],
                    ["Property Type", "3BR / 2BA SFR"],
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

              <div
                className="card"
                style={{ borderLeft: "3px solid var(--gold)" }}
              >
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
                  Loan Structure
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {[
                    ["Land Loan (85%)", "$102,000"],
                    ["Construction Holdback", "$280,000"],
                    ["Total Facility", "$382,000"],
                    ["Rate", "12% IO (drawn balance)"],
                    ["Borrower Equity", "$43,000 + closing"],
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

              <div
                className="card"
                style={{ borderLeft: "3px solid var(--gold)" }}
              >
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
                  Completed Sale (14 Months)
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {[
                    ["Construction Cost", "$280,000"],
                    ["Total Basis", "$425,000"],
                    ["Sale Price", "$520,000"],
                    ["Holding Costs", "~$32,000"],
                    ["Net Profit", "~$63,000"],
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
                            label === "Net Profit"
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
              Representative example for illustrative purposes only. Actual deal
              economics vary based on market conditions, construction costs, and
              property specifics.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* DRAW PROCESS */}
      <section
        className="light-zone section-pad-lg"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Draw Process</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              How construction draws{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                work
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
              Your construction budget is held in escrow and released as phases
              are completed. The process is straightforward: finish the phase,
              request the draw, get paid.
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
              {DRAW_STEPS.map((step, i) => (
                <div key={step.title} className="card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-serif)",
                        fontSize: 16,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ color: "var(--gold)" }}>{step.icon}</div>
                  </div>
                  <h3
                    className="card-title"
                    style={{ fontSize: 20, marginBottom: 8 }}
                  >
                    {step.title}
                  </h3>
                  <p className="card-body">{step.description}</p>
                </div>
              ))}
            </div>
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
              New construction lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={constructionFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a construction{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              project?
            </em>
          </>
        }
        body="Submit your plans, budget, and lot details. Our lending team will deliver a term sheet within 24 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your Construction Deal <ArrowRight size={16} />
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
