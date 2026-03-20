import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import FAQSection from "../../components/FAQSection";
import FAQSchema from "../../components/FAQSchema";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ | Requity Income Fund",
  description:
    "Frequently asked questions about the Requity Income Fund. Learn about target returns, distributions, fees, redemption, tax advantages, and how to get started investing.",
  openGraph: {
    title: "FAQ | Requity Income Fund",
    description:
      "Everything you need to know about investing in the Requity Income Fund. 10% target return, monthly distributions, 0% management fee.",
  },
};

const FAQS = [
  {
    question: "What is the Requity Income Fund?",
    answer:
      "Requity Income Fund LP is a Delaware limited partnership that originates first-lien bridge loans secured by commercial and residential real estate. The fund targets a 10% annual return paid monthly and is open to accredited investors with a $100,000 minimum investment.",
  },
  {
    question: "How are distributions paid?",
    answer:
      "Distributions are paid monthly from Available Cash after expenses and reserves. Income begins at the end of your first full calendar month as a limited partner. You can receive cash distributions directly to your bank account, or elect to reinvest through the DRIP program for compounded returns.",
  },
  {
    question: "What is the GP first-loss position?",
    answer:
      "The General Partner has committed $1,000,000 of its own capital in a subordinated first-loss position. This means GP capital absorbs fund-level losses before any Limited Partner is impacted. The GP does not earn performance allocation until investors receive their 10% preferred return. Full alignment.",
  },
  {
    question: "What are the fees?",
    answer:
      "The fund charges 0% management fee. The GP absorbs all partnership expenses. The GP earns a performance allocation of 100% of profits above the 10% hurdle rate, subject to a high-water mark. Investors keep 100% of return up to the hurdle with no fee drag on their capital.",
  },
  {
    question: "How do I redeem my investment?",
    answer:
      "After a 12-month lock-up period, you can redeem quarterly with 90 days written notice. Redemptions are paid from Redemption Cash. There are no early redemption penalties.",
  },
  {
    question: "What happens if a borrower defaults?",
    answer:
      "The fund has a structured default handling process: early warning monitoring, formal default and cure period, enforcement through foreclosure and personal guarantee pursuit, and recovery through asset sale or direct operation. As operators of 4,000+ units, the GP can take direct control and manage any property. In 70+ loans originated, this process has never been triggered. Zero defaults. Zero principal losses.",
  },
  {
    question: "Can I invest through a self-directed IRA or Solo 401(k)?",
    answer:
      "Yes. The fund accepts investments from self-directed IRAs (Traditional and Roth), Solo 401(k)s, and HSAs. You will need a qualified custodian. We work with multiple custodians and can guide you through the process.",
  },
  {
    question: "What types of loans does the fund originate?",
    answer:
      "The fund originates first-lien bridge loans across manufactured housing communities, single family fix-and-flip, multifamily, RV parks, industrial, and self-storage. Standard terms: 12% interest rate, 2 origination points, 12-24 month terms, interest-only with full recourse personal guarantees.",
  },
  {
    question: "What is the Section 199A tax benefit?",
    answer:
      "The GP intends to elect REIT status for a subsidiary entity (the Sub-REIT) that will hold qualifying loans. Income distributed as qualified REIT dividends may be eligible for the Section 199A deduction, potentially reducing the effective tax rate on a substantial portion of fund income by up to 20%. Consult your tax advisor for your specific situation.",
  },
  {
    question: "What reporting will I receive?",
    answer:
      "Monthly: Capital Account Statement with NAV, distributions, and performance summary, plus a Loan Portfolio Update showing every active loan. Quarterly: Performance Report with portfolio analytics and market commentary. Annually: K-1 Tax Package prepared by NAV Consulting. You also have 24/7 access to the investor portal at RequityGroup.com.",
  },
  {
    question: "What is the Distribution Reinvestment Program (DRIP)?",
    answer:
      "DRIP allows you to automatically reinvest monthly distributions back into the fund for compounded returns. On a $500,000 investment at 10%, DRIP grows your capital to approximately $1.3M over 10 years versus $500K plus $500K in cumulative cash distributions. You can elect DRIP at subscription and change your election annually.",
  },
  {
    question: "How is the fund structured?",
    answer:
      "Requity Income Fund LP is an evergreen, open-ended Delaware limited partnership managed by Requity Income Fund GP LLC. The fund is offered under Rule 506(c) to verified accredited investors. Fund-level leverage is capped at 1:1 of capital accounts.",
  },
  {
    question: "Who manages the fund?",
    answer:
      "Dylan Marma (CEO & Fund Manager, CCIM, CPM) leads all investment and lending decisions. The team includes Luis Velez (VP, Lending Originations), Jet (VP, Acquisitions & Asset Management), Grethel (COO), Mike Requita (Financial Controller), and Estefania (Lending Operations Manager).",
  },
  {
    question: "How do I get started?",
    answer:
      "Review the offering materials, then schedule a call with Dylan or Luis to discuss the fund and confirm suitability. Complete the Investor Questionnaire, execute the Signature Page, and wire your capital contribution. Contact dylan@requitygroup.com or luis@requitygroup.com to begin.",
  },
];

export default function FundFAQPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(140px, 18vw, 200px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <Link
            href="/fund"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--gold-muted)",
              textDecoration: "none",
              marginBottom: 32,
              animation: "fadeUp 0.8s ease both",
            }}
          >
            <ArrowLeft size={14} /> Back to Fund
          </Link>
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 600,
              fontSize: "clamp(36px, 4.5vw, 56px)",
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Frequently Asked{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Questions</em>
          </h1>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* FAQ Content */}
      <section className="light-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <div style={{ maxWidth: 760 }}>
              <FAQSection faqs={FAQS} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <FAQSchema faqs={FAQS} />

      {/* CTA */}
      <FooterCTA
        label="Ready to Invest"
        headline={<>Schedule a <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>call</em></>}
        body="Talk with Dylan or Luis about the fund, your questions, and next steps."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Schedule a Call <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
