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
  Repeat,
  Clock,
  DollarSign,
  FileCheck,
  Zap,
  Shield,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Transactional Funding for Wholesalers | Same-Day Double Close",
  description:
    "Same-day transactional funding for real estate wholesalers. Finance double closes and assignment transactions. 1-2% of loan balance. Funds available in hours.",
  openGraph: {
    title: "Transactional Funding for Wholesalers | Requity Lending",
    description:
      "Same-day funding for double closes. 1-2% of loan balance. No credit check, no income verification. Designed for real estate wholesalers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transactional Funding | Requity Lending",
    description:
      "Same-day funding for double closes and wholesale transactions. 1-2% of loan balance.",
  },
};

export const revalidate = 300;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit Your A-B Contract",
    description:
      "Send us your purchase agreement (A-B contract) and your end-buyer agreement (B-C contract). We verify that both closings are scheduled for the same day and that the end buyer's funds are confirmed.",
  },
  {
    step: "02",
    title: "Receive Proof of Funds",
    description:
      "Within hours, we issue a proof of funds letter and wire instructions. The title company receives confirmation that funds will be available for the A-B closing.",
  },
  {
    step: "03",
    title: "We Fund the A-B Close",
    description:
      "On closing day, we wire the purchase funds to the title company for the A-B transaction. You take title to the property momentarily.",
  },
  {
    step: "04",
    title: "B-C Close Completes",
    description:
      "The end buyer closes the B-C transaction the same day. Their funds repay our transactional capital, and your wholesale profit is disbursed to you at closing.",
  },
];

const WHY_ITEMS = [
  {
    icon: <Zap size={20} />,
    title: "Same-Day Funding",
    description:
      "Capital is wired to the title company on closing day. No multi-day hold periods, no waiting for wires to clear. Your A-B close happens on schedule regardless of the end buyer's title company or funding timeline.",
  },
  {
    icon: <Shield size={20} />,
    title: "No Personal Qualification",
    description:
      "Transactional funding is secured by the deal, not the borrower. No credit check, no income verification, no tax returns. The only requirement is a confirmed end buyer with verified funds for the B-C closing.",
  },
  {
    icon: <Clock size={20} />,
    title: "24-Hour Turnaround",
    description:
      "Submit your contracts today, get proof of funds today. We move at the speed wholesale deals require. Many deals are approved and funded within 24 hours of first contact.",
  },
];

export default function TransactionalFundingPage() {
  const tfFAQs = [
    {
      question: "What does transactional funding cost?",
      answer:
        "Transactional funding is typically 1% to 2% of the loan balance (the A-B purchase price). The fee is deducted from proceeds at closing. There are no upfront fees, application fees, or processing charges. The exact rate depends on deal size and complexity.",
    },
    {
      question: "How does a double close work with transactional funding?",
      answer:
        "In a double close, you (the wholesaler) purchase the property from the seller (A-B transaction) and immediately resell it to your end buyer (B-C transaction) on the same day. Transactional funding provides the capital for the A-B purchase. When the B-C close completes, the end buyer's funds repay the transactional lender, and your profit (the spread between A-B and B-C prices) is disbursed to you.",
    },
    {
      question: "Do I need good credit to get transactional funding?",
      answer:
        "No. Transactional funding is not based on your personal credit, income, or net worth. The funding decision is based entirely on the deal: a valid A-B purchase contract, a confirmed B-C end buyer with verified funds, and a title company that can facilitate a same-day double close.",
    },
    {
      question: "What if my end buyer's closing is delayed?",
      answer:
        "If the B-C closing does not occur on the same day as the A-B closing, the transactional funds remain deployed and additional per-diem charges may apply. We work with the title company to coordinate timing and minimize the risk of delays. It is critical that the end buyer's financing is confirmed before we fund the A-B transaction.",
    },
    {
      question: "What is the minimum and maximum deal size?",
      answer:
        "We fund transactional deals from $50,000 to $5,000,000. Most wholesale double closes fall in the $100K to $1M range. Larger deals are evaluated on a case-by-case basis.",
    },
    {
      question: "How fast can I get proof of funds?",
      answer:
        "Proof of funds letters are typically issued within hours of receiving your complete deal package (A-B contract, B-C contract, end buyer's proof of funds or pre-approval). For deals submitted before noon, same-day proof of funds is standard.",
    },
    {
      question: "Does the title company need to be involved?",
      answer:
        "Yes. Both the A-B and B-C closings are facilitated through a title company or closing attorney. We wire funds directly to the title company for the A-B close. The title company coordinates the sequential closings and manages the disbursement of all proceeds.",
    },
    {
      question: "Can I use transactional funding for assignment deals?",
      answer:
        "Transactional funding is specifically designed for double closes where you take title momentarily. If you are assigning the contract (selling the contract itself rather than the property), you typically do not need transactional funding since no purchase occurs. However, some sellers or title companies do not allow assignments, making a double close with transactional funding the necessary alternative.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Transactional Funding for Real Estate Wholesalers",
    provider: {
      "@type": "FinancialService",
      name: "Requity Lending",
      url: "https://requitygroup.com/lending",
    },
    description:
      "Same-day transactional funding for real estate wholesale double closes. 1-2% of loan balance, no credit check, funds available in hours.",
    url: "https://requitygroup.com/lending/transactional-funding",
    areaServed: { "@type": "Country", name: "United States" },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <FAQSchema faqs={tfFAQs} />

      {/* HERO */}
      <PageHero
        label="Transactional Funding"
        headline={
          <>
            Same-day capital for{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              double closes
            </em>
          </>
        }
        body="Transactional funding for real estate wholesalers executing double closes. We provide the A-B purchase capital so you can close and resell on the same day. No credit check, no income verification."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit Your Deal <ArrowRight size={16} />
            </Link>
            <Link href="/lending" className="btn-editorial-light">
              <ArrowLeft size={14} /> All Programs
            </Link>
          </div>
        }
      />

      {/* PRICING BAR */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", borderTop: "1px solid var(--navy-border)" }}>
            {[
              { label: "Fee", value: "1 - 2%" },
              { label: "Deal Size", value: "$50K - $5M" },
              { label: "Proof of Funds", value: "Same Day" },
              { label: "Credit Check", value: "None" },
              { label: "Funding Speed", value: "24 Hours" },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ padding: "28px 0", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid var(--navy-border)" : "none" }}>
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
            <SectionLabel>Why Requity</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>
              Built for{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>wholesalers</em>
            </h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              Your margin lives and dies on execution speed. Transactional funding should never be the bottleneck. We provide same-day proof of funds, 24-hour closings, and a process designed around how wholesale deals actually work.
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

      {/* HOW IT WORKS */}
      <section className="dark-zone section-pad-lg" style={{ overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>Process</SectionLabel>
            <h2 className="type-h2" style={{ color: "#fff", marginBottom: 16 }}>
              From contract to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>closing</em>
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75, color: "var(--navy-text-mid)", maxWidth: 560, marginBottom: 56 }}>
              Four steps, one day. Submit your contracts, get proof of funds, close both sides, collect your spread.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="card-navy" style={{ padding: "36px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <div className="step-icon">{[<FileCheck key={0} size={22} />, <DollarSign key={1} size={22} />, <Repeat key={2} size={22} />, <CheckCircle key={3} size={22} />][i]}</div>
                    <span className="step-label">Step {step.step}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 400, color: "#fff", marginBottom: 12, lineHeight: 1.25, letterSpacing: "-0.3px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--navy-text-mid)" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* DEAL EXAMPLE */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Example</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>How the numbers work</h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              A representative wholesale double close showing how transactional funding covers the A-B purchase and you keep the spread.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>
                  A-B Transaction (Your Purchase)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Purchase Price", "$320,000"],
                    ["Transactional Funding", "$320,000"],
                    ["Funding Fee (1.5%)", "$4,800"],
                    ["Your Cash Needed", "$0"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>
                  B-C Transaction (Your Sale)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Sale Price", "$365,000"],
                    ["Repays Transactional Funds", "$320,000"],
                    ["Transactional Fee", "$4,800"],
                    ["Closing Costs (est.)", "$5,200"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ borderLeft: "3px solid var(--gold)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 20 }}>
                  Your Profit
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Gross Spread", "$45,000"],
                    ["Less: Funding Fee", "-$4,800"],
                    ["Less: Closing Costs", "-$5,200"],
                    ["Net Profit", "$35,000"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                      <span style={{ color: "var(--text-mid)" }}>{l}</span>
                      <span style={{ fontWeight: 600, color: l === "Net Profit" ? "var(--gold)" : "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <p className="type-body-sm" style={{ color: "var(--text-light)", marginTop: 24, fontStyle: "italic" }}>
              Representative example for illustrative purposes only. Actual costs vary based on deal size, closing costs, and market.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="light-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>Transactional funding FAQ</h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={tfFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={<>Have a wholesale <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>deal?</em></>}
        body="Submit your A-B and B-C contracts and get proof of funds today. Same-day funding, no credit check, no income verification."
        primaryCta={<Link href="/lending/apply" className="btn-primary">Submit Your Deal <ArrowRight size={16} /></Link>}
        secondaryCta={<Link href="/lending" className="btn-secondary">All Programs <ArrowRight size={16} /></Link>}
      />
    </main>
  );
}
