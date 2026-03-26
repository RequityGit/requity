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
  Hammer,
  Home,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Paintbrush,
  Wrench,
  Gavel,
  RefreshCw,
  Layers,
  ClipboardCheck,
  Search,
  DollarSign,
  FileText,
  User,
  Building,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Fix and Flip Loans | Residential Bridge Financing | Requity Lending",
  description:
    "Fix and flip loans for residential real estate investors. Up to 90% LTC, 100% rehab financing, close in as few as 7 days. Short-term bridge loans for house flipping, renovations, and BRRRR strategies.",
  openGraph: {
    title: "Fix and Flip Loans | Requity Lending",
    description:
      "Residential bridge loans for fix-and-flip investors. Up to 90% LTC, 100% of rehab budget funded, close in 7 days. $100K-$3M.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fix and Flip Loans | Requity Lending",
    description:
      "Fix and flip financing. Up to 90% LTC, 100% rehab funded. Close in 7 days. Term sheets in 24 hours.",
  },
};

export const revalidate = 300;

const LOAN_DETAILS = [
  { label: "Loan Size", value: "$100K - $3M" },
  { label: "LTC", value: "Up to 90%" },
  { label: "Max ARV", value: "Up to 75%" },
  { label: "Rate", value: "12% Interest-Only" },
  { label: "Term", value: "6 - 18 Months" },
  { label: "Closing", value: "As Few as 7 Days" },
  { label: "Rehab Funding", value: "100% of Budget" },
  { label: "Prepayment", value: "No Penalty" },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "7-Day Close Advantage",
    description:
      "The best flip deals go fast. REO listings, auction properties, and off-market opportunities require proof of funds and a lender who can close on your timeline. We deliver term sheets in 24 hours and fund in as few as 7 business days.",
  },
  {
    icon: <Shield size={20} />,
    title: "Simple Rehab Draw Process",
    description:
      "Request a draw, schedule the inspection, and receive funds within 2-3 business days of approval. No complicated paperwork, no waiting weeks for reimbursement. Your renovation stays on schedule because your capital does too.",
  },
  {
    icon: <Clock size={20} />,
    title: "Flexible Exit Options",
    description:
      "Sell the property and pay off the loan at closing, or pivot to a BRRRR strategy and refinance into a long-term DSCR rental loan. Your business plan can evolve mid-project without penalty.",
  },
];

const USE_CASES = [
  {
    icon: <Paintbrush size={22} />,
    title: "Cosmetic Flips",
    description:
      "Light renovation projects focused on paint, flooring, fixtures, landscaping, and curb appeal. These deals move fast with lower rehab budgets and shorter hold times, making them ideal for newer investors building a track record.",
  },
  {
    icon: <Hammer size={22} />,
    title: "Full Gut Renovations",
    description:
      "Major rehab projects including kitchen and bathroom remodels, layout changes, roof replacement, electrical and plumbing upgrades. Higher rehab budgets and longer timelines, but significantly more value creation and profit potential.",
  },
  {
    icon: <Gavel size={22} />,
    title: "REO & Auction Acquisitions",
    description:
      "Bank-owned properties and auction purchases often require proof of funds and fast cash closings. Bridge financing with a 7-day close lets you compete with cash buyers while preserving your capital for renovations.",
  },
  {
    icon: <RefreshCw size={22} />,
    title: "BRRRR Strategy",
    description:
      "Buy, Rehab, Rent, Refinance, Repeat. Acquire a distressed property, renovate it, place a tenant, then refinance into a DSCR rental loan. Bridge financing covers the acquisition and rehab phases while you execute the long-term hold plan.",
  },
  {
    icon: <Home size={22} />,
    title: "Estate & Probate Acquisitions",
    description:
      "Inherited and estate properties often sell below market value but need significant updates. These deals typically require a fast, certain close to satisfy estate timelines and multiple heirs looking for a clean transaction.",
  },
  {
    icon: <Layers size={22} />,
    title: "Multi-Property Portfolio",
    description:
      "Experienced flippers running multiple projects simultaneously can structure a single facility to cover several properties. Streamlined underwriting, one set of loan documents, and consolidated draw management across your active pipeline.",
  },
];

const DRAW_STEPS = [
  {
    icon: <ClipboardCheck size={22} />,
    title: "Submit Scope of Work",
    description:
      "Include your detailed renovation budget and scope of work with your loan application. Our team reviews the rehab plan alongside the property and sets up draw milestones tied to your project phases.",
  },
  {
    icon: <Hammer size={22} />,
    title: "Complete Work & Request Draw",
    description:
      "Finish a renovation phase and submit a draw request through our portal. Upload progress photos and receipts for the completed work. Draw requests can be submitted at any point during the project.",
  },
  {
    icon: <Search size={22} />,
    title: "Third-Party Inspection",
    description:
      "A licensed inspector verifies that the work has been completed according to the approved scope. Inspections are typically scheduled within 1-2 business days of your draw request.",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Funds Released",
    description:
      "Once the inspection confirms the work is complete, funds are wired to your account within 2-3 business days. No waiting weeks for reimbursement, no unnecessary holdbacks on approved work.",
  },
];

export default function FixAndFlipPage() {
  const flipFAQs = [
    {
      question: "What is a fix and flip loan?",
      answer:
        "A fix and flip loan is a short-term bridge loan designed for real estate investors who purchase a property, renovate it, and sell it for a profit. The loan covers both the acquisition cost and the renovation budget. Terms are typically 6 to 18 months with interest-only payments, giving the borrower time to complete the rehab and sell the property.",
    },
    {
      question: "How much can I borrow for a fix and flip project?",
      answer:
        "Requity Lending provides fix and flip loans from $100,000 to $3,000,000. We lend up to 90% of the total project cost (purchase price plus renovation budget) and up to 75% of the after-repair value (ARV). The rehab portion of the loan is funded at 100% of the approved renovation budget and released through a draw process as work is completed.",
    },
    {
      question: "Do I need experience to qualify for a fix and flip loan?",
      answer:
        "Prior flip experience is helpful but not required for every deal. First-time flippers can qualify with a strong deal, adequate reserves, and a realistic renovation plan. Borrowers with a track record of completed flips will typically receive better terms, higher leverage, and faster approvals.",
    },
    {
      question: "How does the rehab draw process work?",
      answer:
        "After closing, you complete renovation work in phases and submit draw requests through our portal. A third-party inspector verifies the completed work, and funds are released within 2-3 business days of a successful inspection. You can submit draws at any point during the project as work milestones are completed.",
    },
    {
      question: "How fast can Requity close on a fix and flip loan?",
      answer:
        "We can close fix and flip loans in as few as 7 business days from signed term sheet. Most residential bridge deals close within 7-14 business days. We deliver term sheets within 24 hours of receiving a complete deal package, and there is no credit pull required to receive a term sheet.",
    },
    {
      question: "What types of renovations can I finance with a fix and flip loan?",
      answer:
        "Our rehab holdback covers virtually all renovation work: cosmetic updates (paint, flooring, fixtures), full gut renovations (kitchens, bathrooms, layout changes), structural work (roofing, foundation), and mechanical upgrades (electrical, plumbing, HVAC). The scope of work is reviewed during underwriting and approved as part of the loan.",
    },
    {
      question: "Can I convert my fix and flip loan into a rental loan?",
      answer:
        "Yes. If your business plan changes mid-project and you decide to hold the property as a rental, you can refinance out of the bridge loan into a long-term DSCR rental loan once the renovation is complete and a tenant is in place. This is the core of the BRRRR strategy, and Requity supports both the bridge and the permanent financing sides.",
    },
    {
      question: "What is the after-repair value (ARV) and how does it affect my loan?",
      answer:
        "The after-repair value is the estimated market value of the property after all renovations are completed. Requity underwrites fix and flip loans based on both the loan-to-cost (LTC) and the loan-to-ARV ratio. We lend up to 90% of total cost and up to 75% of ARV, whichever is lower. A higher ARV relative to your total cost means more available leverage.",
    },
    {
      question: "Does Requity finance fix and flip projects nationwide?",
      answer:
        "Requity Lending provides fix and flip financing nationwide. We evaluate each deal based on the local market, comparable sales, the property condition, and the borrower's renovation plan. Urban, suburban, and select rural markets with strong resale demand are all eligible.",
    },
    {
      question: "What are the costs of a fix and flip loan?",
      answer:
        "Fix and flip loans are priced at 12% interest-only with origination points and standard closing costs. Interest is calculated only on the drawn balance, so you do not pay interest on rehab funds until they are released. There are no prepayment penalties, so you can pay off the loan as soon as the property sells without additional cost.",
    },
    {
      question: "What property types are eligible for a fix and flip loan?",
      answer:
        "Requity finances single-family homes, duplexes, triplexes, fourplexes, townhomes, and warrantable condominiums. Properties must be residential investment properties. We do not finance owner-occupied primary residences, vacant land, or commercial properties through the fix and flip program. Properties in any condition are eligible, including distressed and bank-owned.",
    },
    {
      question: "Do I need an LLC to get a fix and flip loan?",
      answer:
        "An LLC is preferred but not required. Many experienced investors hold properties in an LLC for liability protection, and we can close in the name of your entity. First-time investors who have not yet formed an LLC can still qualify and close in their personal name. We recommend consulting with an attorney or CPA about entity structure before your first project.",
    },
    {
      question: "What is the 70% rule in house flipping?",
      answer:
        "The 70% rule is a common guideline used by fix and flip investors to evaluate deal profitability. It states that your maximum purchase price plus renovation costs should not exceed 70% of the property's after-repair value (ARV). For example, if the ARV is $400,000, your total investment (purchase plus rehab) should stay below $280,000 to maintain a healthy profit margin after holding costs, closing costs, and selling expenses.",
    },
    {
      question: "Can I extend my fix and flip loan if the project takes longer than expected?",
      answer:
        "Yes. Extension options are available if your renovation or sale timeline extends beyond the original loan term. Extensions are evaluated on a case-by-case basis and depend on project progress, remaining work, and market conditions. We recommend communicating early if you anticipate needing additional time so we can discuss options before maturity.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "Fix and Flip Loans",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Fix and flip bridge loans for residential real estate investors. Loan sizes $100K-$3M, up to 90% LTC, 100% rehab financing, close in as few as 7 business days.",
    url: "https://requitygroup.com/lending/fix-and-flip",
    category: "Bridge Loan",
    amount: {
      "@type": "MonetaryAmount",
      minValue: 100000,
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
      <FAQSchema faqs={flipFAQs} />

      {/* HERO */}
      <PageHero
        label="Fix & Flip"
        headline={
          <>
            Residential flip{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              financing
            </em>
          </>
        }
        body="Bridge loans built for house flippers. Up to 90% of total project cost, 100% of your rehab budget funded through draws, and closings in as few as 7 days. From cosmetic refreshes to full gut renovations."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your Flip Deal <ArrowRight size={16} />
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
              Built for flippers who{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                move fast
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
              The best flip deals are won by investors who can close quickly with
              certainty. Bank financing takes too long and hard money lenders
              charge too much. Requity bridges the gap with competitive rates,
              fast closings, and a draw process that keeps your renovation on
              schedule.
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
              From light cosmetic refreshes to full gut renovations and
              multi-property portfolios. Every residential investment strategy
              has a loan structure to match.
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
              Fix and flip loans are for investment properties only, not
              primary residences. Both first-time flippers and experienced
              investors can qualify. Here is what we look at and what to bring.
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
                  We finance residential investment properties across a range of
                  types and conditions.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Single-family homes (SFR)",
                    "2-4 unit residential properties",
                    "Townhomes and condos (warrantable)",
                    "Properties in any condition (including distressed)",
                    "Urban, suburban, and select rural markets",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircle size={16} style={{ color: "var(--gold)", marginTop: 3, flexShrink: 0 }} />
                      <span className="type-body-sm" style={{ color: "var(--text-mid)" }}>{item}</span>
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
                  We underwrite the deal first, then the borrower. Experience
                  helps but is not required.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "First-time flippers welcome with strong deal economics",
                    "Experienced investors (2+ flips) receive better terms and faster approvals",
                    "LLC or entity structure preferred but not required",
                    "No W-2s, tax returns, or employment verification needed",
                    "No minimum credit score to receive a term sheet",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircle size={16} style={{ color: "var(--gold)", marginTop: 3, flexShrink: 0 }} />
                      <span className="type-body-sm" style={{ color: "var(--text-mid)" }}>{item}</span>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Property address and purchase price (or estimated value for refis)",
                    "Renovation scope of work with line-item budget",
                    "After-repair value (ARV) estimate with comparable sales",
                    "Entity documents (LLC operating agreement, if applicable)",
                    "Brief experience resume (past flips, if any)",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircle size={16} style={{ color: "var(--gold)", marginTop: 3, flexShrink: 0 }} />
                      <span className="type-body-sm" style={{ color: "var(--text-mid)" }}>{item}</span>
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
              A representative fix and flip deal showing how bridge financing
              covers the acquisition and renovation, and how value is created
              through the rehab process.
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
                    ["Purchase Price", "$285,000"],
                    ["After-Repair Value", "$425,000"],
                    ["Property Type", "3BR / 2BA SFR"],
                    ["Condition", "Dated, full renovation needed"],
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
                  Loan Structure
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Purchase Loan (90%)", "$256,500"],
                    ["Rehab Holdback", "$85,000"],
                    ["Total Facility", "$341,500"],
                    ["Rate", "12% IO"],
                    ["Borrower Equity", "$28,500 + closing"],
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
                  Completed Sale (6 Months)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Renovation Cost", "$85,000"],
                    ["Total Basis", "$370,000"],
                    ["Sale Price", "$420,000"],
                    ["Holding Costs", "~$20,000"],
                    ["Net Profit", "~$30,000"],
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
              economics vary based on market conditions, renovation scope, and
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
              How rehab draws{" "}
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
              Your renovation budget is held in escrow and released as work is
              completed. The process is straightforward: finish the work,
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
              Fix and flip lending FAQ
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={flipFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a flip{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              deal?
            </em>
          </>
        }
        body="Submit your property details and renovation plan. Our lending team will deliver a term sheet within 24 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit Your Flip Deal <ArrowRight size={16} />
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
