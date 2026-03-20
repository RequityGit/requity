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
  Shield,
  Users,
  Briefcase,
  Scale,
  CheckCircle,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Guarantor Support | Balance Sheet & Experience Partners",
  description:
    "Need balance sheet strength or experience to qualify for your commercial real estate loan? Requity provides guarantor support through our network. 1.5-2.5% of loan balance.",
  openGraph: {
    title: "Guarantor Support for CRE Loans | Requity Group",
    description:
      "Balance sheet and experience support for borrowers who need additional guarantor strength. Leverage our network to qualify for deals your personal financials cannot support alone.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guarantor Support | Requity Group",
    description:
      "Need a guarantor for your CRE loan? Balance sheet and experience support from 1.5-2.5% of loan balance.",
  },
};

export const revalidate = 300;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit Your Deal",
    description:
      "Share your deal details, the loan you are pursuing, and what guarantor requirements the lender has specified. We evaluate the gap between your current financials and what the lender needs.",
  },
  {
    step: "02",
    title: "We Match a Guarantor",
    description:
      "From our network of experienced operators and high-net-worth individuals, we identify a guarantor whose balance sheet and experience profile satisfies the lender's requirements.",
  },
  {
    step: "03",
    title: "Structure the Agreement",
    description:
      "We facilitate a guarantor agreement that defines the scope of the guarantee, compensation, and protections for both the borrower and guarantor. Terms are deal-specific and transparent.",
  },
  {
    step: "04",
    title: "Close Your Deal",
    description:
      "The guarantor signs onto the loan alongside you. You close the deal that your personal balance sheet could not support alone, and the guarantor is compensated at closing.",
  },
];

const USE_CASES = [
  {
    icon: <Shield size={22} />,
    title: "Net Worth Requirements",
    description:
      "Many commercial lenders require the guarantor's net worth to equal or exceed the loan amount. If your personal net worth falls short, a guarantor partner bridges the gap without requiring you to bring in an equity partner.",
  },
  {
    icon: <Briefcase size={22} />,
    title: "Experience Requirements",
    description:
      "Lenders often require guarantors with a track record of owning or operating similar asset types. First-time multifamily buyers, MHP acquirers, or operators entering a new asset class can leverage an experienced guarantor to satisfy this requirement.",
  },
  {
    icon: <Scale size={22} />,
    title: "Liquidity Requirements",
    description:
      "Post-closing liquidity requirements (typically 6-12 months of debt service in liquid assets) can disqualify otherwise strong borrowers. A guarantor with sufficient liquidity satisfies this requirement without reducing your capital available for the deal.",
  },
  {
    icon: <Users size={22} />,
    title: "Key Principal Substitution",
    description:
      "Agency lenders (Fannie Mae, Freddie Mac) and CMBS require a Key Principal who meets specific financial thresholds. If your primary borrower does not qualify, a guarantor can serve as the Key Principal on the loan.",
  },
];

export default function GuarantorSupportPage() {
  const guarantorFAQs = [
    {
      question: "What does guarantor support cost?",
      answer:
        "Guarantor support is typically 1.5% to 2.5% of the loan balance for non-recourse guarantees. Recourse guarantees and deals with unique risk profiles are priced on a deal-specific basis. Compensation is paid at closing from loan proceeds.",
    },
    {
      question: "What is the difference between recourse and non-recourse guarantor support?",
      answer:
        "Non-recourse guarantor support means the guarantor is only exposed to standard 'bad boy' carve-outs (fraud, environmental, bankruptcy filing) rather than full repayment liability. This is the most common structure and is priced at 1.5-2.5% of loan balance. Full recourse guarantees, where the guarantor takes on repayment liability, carry higher compensation and are structured on a deal-specific basis.",
    },
    {
      question: "What types of loans can Requity provide guarantor support for?",
      answer:
        "We provide guarantor support for agency loans (Fannie Mae, Freddie Mac), CMBS, bank financing, SBA 504 and 7(a), and bridge loans that require additional guarantor strength. Common asset types include multifamily, manufactured housing, commercial, and mixed-use properties.",
    },
    {
      question: "Can I use guarantor support if this is my first commercial real estate deal?",
      answer:
        "Yes. In fact, first-time commercial borrowers are one of the most common use cases. Lenders want to see experience on the guarantor, and our network includes operators with extensive track records across multiple asset classes. The guarantor provides the experience credential while you build your own track record.",
    },
    {
      question: "Does the guarantor take an equity position in my deal?",
      answer:
        "No. Guarantor support is a fee-for-service arrangement, not an equity partnership. The guarantor receives a fee (typically 1.5-2.5% of loan balance) and signs the guarantee. They do not receive ownership, profit participation, or decision-making authority in your deal.",
    },
    {
      question: "How long does it take to match a guarantor?",
      answer:
        "Typically 3-5 business days from receiving your complete deal package and lender requirements. For standard agency and bank loans, we can often identify a match within 48 hours. Complex or large deals may require additional time.",
    },
    {
      question: "What information does the guarantor need from me?",
      answer:
        "The guarantor will need to review the deal summary, property details, business plan, and loan terms. They do not need access to your personal financial statements. You will need to share the lender's guarantor requirements (net worth, liquidity, experience thresholds) so we can match appropriately.",
    },
    {
      question: "Can I combine guarantor support with a Requity bridge loan?",
      answer:
        "Yes. Borrowers frequently use our bridge loan program for the acquisition phase, then seek guarantor support when refinancing into permanent agency or bank financing where the guarantor requirements are more stringent. We can coordinate both services.",
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Guarantor Support for Commercial Real Estate",
    provider: {
      "@type": "FinancialService",
      name: "Requity Group",
      url: "https://requitygroup.com",
    },
    description:
      "Balance sheet and experience guarantor support for commercial real estate borrowers. Non-recourse guarantees from 1.5-2.5% of loan balance.",
    url: "https://requitygroup.com/lending/guarantor-support",
    areaServed: { "@type": "Country", name: "United States" },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <FAQSchema faqs={guarantorFAQs} />

      {/* HERO */}
      <PageHero
        label="Guarantor Support"
        headline={
          <>
            Balance sheet &amp; experience{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              partners
            </em>
          </>
        }
        body="Need additional guarantor strength to close your deal? We connect borrowers with qualified guarantors from our network so your personal financials never stand between you and a closed transaction."
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Request Guarantor Support <ArrowRight size={16} />
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", borderTop: "1px solid var(--navy-border)" }}>
            {[
              { label: "Non-Recourse", value: "1.5 - 2.5%" },
              { label: "Recourse", value: "Deal-Specific" },
              { label: "Matching Speed", value: "48 Hrs - 5 Days" },
              { label: "Paid At", value: "Closing" },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ padding: "28px 0", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid var(--navy-border)" : "none" }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--gold-muted)", marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--navy-text-mid)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHEN YOU NEED A GUARANTOR */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Use Cases</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 16 }}>
              When you need a{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>guarantor</em>
            </h2>
            <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 48 }}>
              Lenders evaluate guarantors on three dimensions: net worth, liquidity, and experience. If you fall short on any one, guarantor support fills the gap without diluting your ownership.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
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
              How it{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>works</em>
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75, color: "var(--navy-text-mid)", maxWidth: 560, marginBottom: 56 }}>
              From initial inquiry to a signed guarantee, the process is designed to move at the speed your deal requires.
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="card-navy" style={{ padding: "36px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <div className="step-icon"><Zap size={22} /></div>
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

      {/* KEY DISTINCTION */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
              <SectionLabel>Key Distinction</SectionLabel>
              <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 24 }}>
                Fee for service, not equity
              </h2>
              <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 32 }}>
                Guarantor support is a fee-based service. The guarantor receives 1.5-2.5% of the loan balance at closing and signs the guarantee. They do not receive ownership, profit participation, or any decision-making authority in your deal. You retain 100% of your equity and control.
              </p>
              <div style={{ display: "inline-flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                {[
                  "No equity dilution",
                  "No profit sharing",
                  "No management authority",
                  "Fee paid at closing from loan proceeds",
                  "Clean exit when loan is refinanced or repaid",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-mid)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="light-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>Guarantor support FAQ</h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={guarantorFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={<>Need a <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>guarantor?</em></>}
        body="Tell us about your deal and the lender requirements you need to satisfy. We will match you with a qualified guarantor from our network."
        primaryCta={<Link href="/lending/apply" className="btn-primary">Request Guarantor Support <ArrowRight size={16} /></Link>}
        secondaryCta={<Link href="/lending" className="btn-secondary">All Programs <ArrowRight size={16} /></Link>}
      />
    </main>
  );
}
