import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import FAQSchema from "../../components/FAQSchema";
import FAQSection from "../../components/FAQSection";
import {
  ArrowRight,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Target,
  Home,
  Trees,
  ShieldCheck,
  Landmark,
  FileText,
  Users,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Real Estate Syndications | Value-Add Equity Investments | Requity Group",
  description:
    "Invest in value-add real estate syndications with Requity Group. Targeting ~2X capital over 5 years with monthly cash flow. Tax-advantaged returns through depreciation and bonus depreciation. $50K minimum. Accredited investors.",
  openGraph: {
    title: "Real Estate Syndications | Requity Group",
    description:
      "Value-add real estate syndications targeting 14-17% IRR with monthly distributions and significant tax advantages. Manufactured housing and RV park opportunities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Syndications | Requity Group",
    description:
      "Value-add real estate syndications. Monthly cash flow. Tax-advantaged returns. Targeting ~2X capital over 5 years.",
  },
};

export const revalidate = 300;

const syndicationFAQs = [
  {
    question: "What is a real estate syndication?",
    answer:
      "A real estate syndication is a partnership where investors pool capital to acquire, improve, and operate a property. Requity Group serves as the general partner (GP), handling all aspects of acquisition, renovation, property management, and disposition. Investors participate as limited partners (LPs), contributing capital and receiving a share of cash flow and profits without day-to-day involvement.",
  },
  {
    question: "How are returns generated?",
    answer:
      "Returns come from two sources: ongoing cash flow from property operations and appreciation realized at sale or refinance. We acquire value-add properties below replacement cost, increase net operating income through renovations and operational improvements, then exit at a higher valuation. We target to pay distributions monthly from cash flow throughout the hold period. The combination of ongoing income and back-end appreciation is how we target ~2X investor capital over the hold period.",
  },
  {
    question: "What are the risks of investing in a syndication?",
    answer:
      "Real estate syndications are illiquid investments with risk of partial or total loss of capital. Risks include market downturns, construction delays, slower-than-projected lease-up, interest rate changes, and operational challenges. Targeted returns are not guaranteed. Past performance does not predict future results. You should only invest capital you can afford to have locked up for the full hold period.",
  },
  {
    question: "How do the tax benefits work?",
    answer:
      "As a limited partner, you receive a K-1 reflecting your share of the property's depreciation deductions. Cost segregation studies accelerate depreciation into the early years of ownership, and bonus depreciation can generate substantial first-year deductions. These losses can offset passive income and, for qualifying real estate professionals, active income. Tax benefits depend on your individual situation and are subject to changes in tax law, so consult your tax advisor.",
  },
  {
    question: "What is the minimum investment?",
    answer:
      "The typical minimum investment is $50,000 per syndication. Minimums may vary by deal. Most offerings are structured under SEC Rule 506(b) or 506(c) and are available to accredited investors.",
  },
  {
    question: "How and when do I receive distributions?",
    answer:
      "We target to pay monthly distributions from property cash flow, typically beginning within 60-90 days of acquisition. Distribution amounts vary based on property performance and are not guaranteed. Distributions are paid via ACH to your designated bank account, with detailed reporting through your investor portal.",
  },
  {
    question: "When can I expect to get my capital back?",
    answer:
      "Target hold periods are typically 3-5 years, depending on the business plan. Capital is returned upon a liquidity event such as a sale or refinance. These are illiquid investments, so investors should be prepared to hold for the full term. Early exits are generally not available.",
  },
];

export default function SyndicationsPage() {
  return (
    <main>
      <FAQSchema faqs={syndicationFAQs} />

      {/* ════════════════════════════════════════════════════════════
          1. HERO
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 22vw, 260px)",
          paddingBottom: "clamp(100px, 14vw, 200px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div className="navy-glow" style={{ top: "5%", right: "10%" }} />
        <div className="navy-bottom-fade" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 900,
              animation: "fadeUp 0.8s ease both",
            }}
          >
            Own Real Assets.{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Build Real Wealth.
            </em>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 18,
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 560,
              marginTop: 32,
              animation: "fadeUp 0.8s 0.15s ease both",
            }}
          >
            Value-add real estate syndications with monthly cash flow,
            significant tax advantages, and a target of ~2X your capital over 5
            years.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 48,
              animation: "fadeUp 0.8s 0.3s ease both",
              flexWrap: "wrap",
            }}
          >
            <Link href="/invest/request-access" className="btn-primary">
              Request Access <ArrowRight size={16} />
            </Link>
          </div>

          {/* Floating stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 1,
              marginTop: 80,
              animation: "fadeUp 0.8s 0.45s ease both",
              background: "var(--navy-border)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {[
              { val: "14-17%", lbl: "Target IRR" },
              { val: "~2X", lbl: "Target Equity Multiple" },
              { val: "3-5 Yrs", lbl: "Hold Period" },
              { val: "$50K", lbl: "Minimum Investment" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "36px 24px",
                  textAlign: "center",
                  background: "rgba(12,28,48,0.85)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(28px, 3.5vw, 40px)",
                    color: "var(--gold-muted)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 500,
                  }}
                >
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          2. HOW SYNDICATIONS WORK
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="synd-pitch-grid"
            >
              <div>
                <SectionLabel>How It Works</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  A smarter way to own{" "}
                  <em>real estate</em>
                </h2>

                <div style={{ maxWidth: 480 }}>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    In a syndication, you invest alongside Requity Group to
                    acquire a value-add property. We handle everything: finding
                    the deal, negotiating the purchase, managing renovations,
                    operating the asset, and executing the exit. You receive
                    targeted monthly distributions from cash flow and a share of the
                    profits when the property is sold or refinanced.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    We focus on value-add opportunities where there is a clear
                    path to increasing net operating income. That means
                    properties with below-market rents, deferred maintenance,
                    operational inefficiencies, or expansion potential. We buy
                    right, improve the asset, and create value that did not exist
                    at acquisition.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 0,
                    }}
                  >
                    The result: investors earn cash flow along the way and
                    participate in the upside when the improved property trades
                    at a higher valuation.
                  </p>
                </div>
              </div>

              {/* Right: numbered steps */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  paddingTop: 64,
                }}
              >
                {[
                  {
                    num: "01",
                    title: "We acquire",
                    body: "We identify and purchase a value-add property below replacement cost with a clear business plan to increase NOI.",
                  },
                  {
                    num: "02",
                    title: "We improve",
                    body: "Renovations, infrastructure upgrades, and operational improvements drive revenue growth and reduce expenses.",
                  },
                  {
                    num: "03",
                    title: "You earn monthly",
                    body: "We target to pay distributions monthly from property cash flow throughout the hold period. Distributions are not guaranteed.",
                  },
                  {
                    num: "04",
                    title: "We exit",
                    body: "The stabilized property is sold or refinanced at a higher valuation, returning capital plus profits to investors.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 20,
                      padding: "24px 0",
                      borderBottom:
                        i < 3
                          ? "1px solid var(--border-light)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 28,
                        color: "var(--gold)",
                        letterSpacing: "-1px",
                        lineHeight: 1,
                        flexShrink: 0,
                        width: 40,
                        paddingTop: 4,
                      }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 20,
                          color: "var(--text)",
                          marginBottom: 8,
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 15,
                          lineHeight: 1.7,
                          color: "var(--text-mid)",
                        }}
                      >
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. KEY TERMS
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone"
        style={{
          padding: "clamp(80px, 12vw, 160px) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>

        <div
          className="container"
          style={{ position: "relative", zIndex: 1 }}
        >
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <SectionLabel light>Key Terms</SectionLabel>
              <h2
                className="type-h2"
                style={{
                  color: "#fff",
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                Built for{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--gold-muted)" }}
                >
                  alignment
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 1,
                background: "var(--navy-border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
              className="synd-terms-grid"
            >
              {[
                {
                  label: "Target IRR",
                  value: "14-17%",
                  detail: "Net to investor",
                },
                {
                  label: "Equity Multiple",
                  value: "1.8-2.2X",
                  detail: "Target over hold period",
                },
                {
                  label: "Hold Period",
                  value: "3-5 Years",
                  detail: "Varies by deal",
                },
                {
                  label: "Distributions",
                  value: "Monthly",
                  detail: "Targeted, not guaranteed",
                },
                {
                  label: "Minimum",
                  value: "$50,000",
                  detail: "May vary by offering",
                },
                {
                  label: "Structure",
                  value: "506(b) / (c)",
                  detail: "Accredited investors",
                },
              ].map((term, i) => (
                <div
                  key={i}
                  style={{
                    padding: "clamp(24px, 3vw, 36px)",
                    background: "rgba(12,28,48,0.6)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontWeight: 500,
                      marginBottom: 12,
                    }}
                  >
                    {term.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(28px, 3vw, 40px)",
                      color: "var(--gold-muted)",
                      letterSpacing: "-1.5px",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {term.value}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {term.detail}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          4. TAX ADVANTAGES
          ════════════════════════════════════════════════════════════ */}
      <section
        className="cream-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Tax Advantages</SectionLabel>
            <h2
              className="section-title"
              style={{ maxWidth: 560, marginBottom: 20 }}
            >
              Invest smarter with{" "}
              <em>tax-advantaged</em> returns
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.85,
                color: "var(--text-mid)",
                maxWidth: 600,
                marginBottom: 56,
              }}
            >
              Real estate syndications offer tax benefits that most other
              investments cannot match. These advantages can meaningfully improve
              your after-tax returns throughout the hold period.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(32px, 4vw, 64px)",
                alignItems: "start",
              }}
              className="synd-pitch-grid"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Depreciation */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      <Landmark size={18} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        color: "var(--text)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Depreciation
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      paddingLeft: 48,
                    }}
                  >
                    The IRS allows real estate investors to deduct the cost of
                    property improvements over time, even as the property
                    appreciates in value. Cost segregation studies reclassify
                    building components into shorter depreciation schedules,
                    accelerating deductions into the early years of ownership
                    when they are most valuable to you.
                  </p>
                </div>

                {/* Bonus Depreciation */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      <Percent size={18} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        color: "var(--text)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Bonus Depreciation
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      paddingLeft: 48,
                    }}
                  >
                    Under the Tax Cuts and Jobs Act, qualifying property
                    components can be depreciated at an accelerated rate in the
                    first year of ownership. Under current tax law, bonus
                    depreciation allows for significant first-year deductions
                    that can offset taxable income from other sources.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Passive Loss Offsets */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        color: "var(--text)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Passive Loss Offsets
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      paddingLeft: 48,
                    }}
                  >
                    Depreciation deductions generate paper losses that can
                    offset passive income from other real estate investments or
                    business interests. For investors who qualify as real estate
                    professionals under IRS rules, these losses may also offset
                    W-2 or active business income, significantly reducing your
                    overall tax burden.
                  </p>
                </div>

                {/* K-1 Reporting */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 20,
                        color: "var(--text)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      K-1 Reporting
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      paddingLeft: 48,
                    }}
                  >
                    As a limited partner, you receive an annual Schedule K-1
                    reflecting your allocable share of the partnership&apos;s
                    income, losses, deductions, and credits. This flows directly
                    to your personal tax return. We work with experienced real
                    estate CPAs to deliver K-1s as early as possible each tax
                    season.
                  </p>
                </div>

                {/* Illustrative example */}
                <div
                  style={{
                    background: "var(--white)",
                    borderRadius: 12,
                    padding: 28,
                    border: "1px solid var(--border-light)",
                    marginTop: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      marginBottom: 16,
                    }}
                  >
                    Illustrative Example
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "var(--text-mid)",
                      marginBottom: 16,
                    }}
                  >
                    A $100,000 investment in a syndication with a cost
                    segregation study could generate $40,000-$80,000 in
                    first-year depreciation deductions, depending on the asset
                    and applicable bonus depreciation rate. For an investor in
                    the 37% federal bracket, that represents $15,000-$30,000 in
                    potential tax savings in year one alone.
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-light)",
                      fontStyle: "italic",
                    }}
                  >
                    This is a hypothetical illustration only. Actual tax benefits
                    depend on your individual circumstances, applicable tax
                    rates, and the specific property. Consult your tax advisor.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. ASSET CLASSES
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionLabel>Asset Classes</SectionLabel>
              <h2 className="section-title" style={{ margin: "0 auto", maxWidth: 500 }}>
                Where we <em>invest</em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
              className="synd-asset-grid"
            >
              {/* MHC Card */}
              <Link
                href="/invest/syndications/mhc"
                style={{ textDecoration: "none" }}
              >
                <div className="synd-asset-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "var(--cream)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                      }}
                    >
                      <Home size={22} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "var(--gold)",
                          marginBottom: 2,
                        }}
                      >
                        01
                      </p>
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "clamp(22px, 2.5vw, 28px)",
                          color: "var(--text)",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        Manufactured Housing
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    Affordable housing with recession-resilient demand,
                    low tenant turnover, and significant lot rent upside in
                    value-add communities. We acquire, improve infrastructure,
                    and increase NOI through operational excellence.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 24,
                    }}
                  >
                    {["Affordable Housing", "Low Turnover", "Lot Rent Upside", "Infrastructure Value-Add"].map(
                      (tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--text-mid)",
                            padding: "6px 12px",
                            background: "var(--cream)",
                            borderRadius: 6,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Learn More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>

              {/* RV Campgrounds Card */}
              <Link
                href="/invest/syndications/rv-campgrounds"
                style={{ textDecoration: "none" }}
              >
                <div className="synd-asset-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "var(--cream)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold)",
                      }}
                    >
                      <Trees size={22} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: "var(--gold)",
                          marginBottom: 2,
                        }}
                      >
                        02
                      </p>
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "clamp(22px, 2.5vw, 28px)",
                          color: "var(--text)",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        RV Parks &amp; Campgrounds
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    Outdoor hospitality assets with fragmented ownership,
                    strong revenue growth potential, and multiple income streams.
                    We acquire underperforming parks and drive NOI through
                    amenity upgrades, dynamic pricing, and site expansion.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 24,
                    }}
                  >
                    {["Outdoor Recreation", "Fragmented Market", "Revenue Optimization", "Amenity-Driven NOI"].map(
                      (tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--text-mid)",
                            padding: "6px 12px",
                            background: "var(--cream)",
                            borderRadius: 6,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Learn More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. WHY REQUITY — Operator Credibility
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone"
        style={{
          padding: "clamp(80px, 12vw, 160px) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>

        <div
          className="container"
          style={{ position: "relative", zIndex: 1 }}
        >
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="synd-pitch-grid"
            >
              <div>
                <SectionLabel light>Why Requity</SectionLabel>
                <h2
                  className="type-h2"
                  style={{
                    color: "#fff",
                    maxWidth: 480,
                    marginBottom: 32,
                  }}
                >
                  We don&apos;t just invest.{" "}
                  <em
                    style={{
                      fontStyle: "italic",
                      color: "var(--gold-muted)",
                    }}
                  >
                    We operate.
                  </em>
                </h2>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--navy-text-mid)",
                    maxWidth: 480,
                    marginBottom: 24,
                  }}
                >
                  Requity Group is vertically integrated. We lend on the same
                  asset classes we invest in and manage over 4,000 units across
                  our portfolio. When we underwrite a syndication, we are
                  checking the business plan against what we know from running
                  these properties ourselves every day.
                </p>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--navy-text-mid)",
                    maxWidth: 480,
                  }}
                >
                  This is not a fund-of-funds or a blind pool. Every deal is
                  presented individually so you can evaluate the asset, the
                  market, and the business plan before committing capital. We
                  invest our own money alongside yours in every transaction.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 28,
                  paddingTop: 40,
                }}
              >
                {[
                  {
                    icon: <Layers size={20} />,
                    title: "Vertically Integrated",
                    body: "Acquisitions, lending, asset management, and investor relations under one roof. We control the full value chain.",
                  },
                  {
                    icon: <Users size={20} />,
                    title: "4,000+ Units Managed",
                    body: "We operate manufactured housing communities, RV parks, and multifamily properties across our portfolio.",
                  },
                  {
                    icon: <DollarSign size={20} />,
                    title: "$70M+ Investor Capital",
                    body: "Over $70 million raised and deployed across equity and credit strategies with proven results.",
                  },
                  {
                    icon: <Target size={20} />,
                    title: "GP Co-Investment",
                    body: "We invest our own capital in every syndication. Our interests are aligned with yours from day one.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(160, 138, 78, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#fff",
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: "var(--navy-text-mid)",
                        }}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          7. FAQ
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{
          padding: "clamp(80px, 12vw, 160px) 0",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 40 }}
            >
              Frequently asked questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={syndicationFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          8. CTA
          ════════════════════════════════════════════════════════════ */}
      <FooterCTA
        headline={
          <>
            Ready to{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              invest in real assets
            </em>
            ?
          </>
        }
        body="Request access to learn about upcoming syndication opportunities. We will walk you through our process, share our track record, and send you offering materials."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <a
            href="mailto:invest@requitygroup.com?subject=Syndication Inquiry"
            className="btn-secondary"
          >
            Email Us
          </a>
        }
      />

      {/* ════════════════════════════════════════════════════════════
          DISCLOSURES
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{
          padding: "48px 0",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div className="container">
          <p
            style={{
              fontSize: 11,
              lineHeight: 1.8,
              color: "var(--text-light)",
              maxWidth: 900,
            }}
          >
            <strong style={{ color: "var(--text-mid)", fontWeight: 600 }}>
              Important Disclosures:
            </strong>{" "}
            Requity Group LLC is not registered as an investment adviser.
            Interests in individual syndications are offered under separate
            offering memoranda pursuant to Rule 506(b) or 506(c) of Regulation D
            and have not been registered under the Securities Act of 1933.
            Syndication investments are speculative, illiquid, and involve risk
            of loss including total loss of capital. Target returns and
            projections are not guaranteed. Past performance is not indicative of
            future results. Tax benefits depend on individual circumstances and
            are subject to changes in tax law. Consult your tax, legal, and
            financial advisors before investing.
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-light)",
              marginTop: 12,
            }}
          >
            Requity Group LLC | 401 E Jackson St, Suite 3300 | Tampa, FL 33602
          </p>
        </div>
      </section>

      {/* Responsive overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .synd-pitch-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
              .synd-asset-grid {
                grid-template-columns: 1fr !important;
              }
              .synd-terms-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            @media (max-width: 480px) {
              .synd-terms-grid {
                grid-template-columns: 1fr !important;
              }
            }
            .synd-asset-card {
              padding: clamp(28px, 3vw, 40px);
              background: var(--white);
              border: 1px solid var(--border-light);
              border-radius: 16px;
              transition: border-color 0.2s, box-shadow 0.2s;
              height: 100%;
            }
            .synd-asset-card:hover {
              border-color: var(--gold);
              box-shadow: 0 8px 32px rgba(160, 138, 78, 0.08);
            }
          `,
        }}
      />
    </main>
  );
}
