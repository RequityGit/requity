import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../../components/ScrollReveal";
import SectionLabel from "../../../components/SectionLabel";
import FooterCTA from "../../../components/FooterCTA";
import FAQSchema from "../../../components/FAQSchema";
import FAQSection from "../../../components/FAQSection";
import {
  ArrowRight,
  ArrowLeft,
  Trees,
  TrendingUp,
  Wrench,
  Users,
  Zap,
  Shield,
  DollarSign,
  CalendarRange,
  MapPin,
  Tent,
  Wifi,
  Sun,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "RV Park & Campground Syndications | Outdoor Hospitality Investment | Requity Group",
  description:
    "Invest in RV park and campground syndications with Requity Group. Outdoor hospitality properties with strong revenue growth, fragmented ownership, and multiple income streams. 14-17% target IRR.",
  openGraph: {
    title: "RV Park & Campground Syndications | Requity Group",
    description:
      "Value-add RV park and campground investments. Outdoor recreation megatrend, fragmented market, amenity-driven NOI growth. 14-17% target IRR.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RV Park & Campground Syndications | Requity Group",
    description:
      "Value-add outdoor hospitality investments. Strong revenue growth. Monthly distributions. Tax-advantaged returns.",
  },
};

export const revalidate = 300;

const rvFAQs = [
  {
    question: "Why are RV parks and campgrounds an attractive investment?",
    answer:
      "The outdoor recreation industry generates over $1 trillion annually in U.S. economic impact. RV ownership has grown significantly, with over 11 million households now owning an RV. The supply of quality parks has not kept pace with demand, creating favorable pricing dynamics. RV parks also offer multiple revenue streams (site rental, cabins, glamping, amenity fees, retail) and lower capital expenditure requirements compared to traditional real estate.",
  },
  {
    question: "How does seasonality affect RV park investments?",
    answer:
      "Many RV parks generate the majority of revenue during peak season (typically April through October in most markets). Our strategy accounts for this by targeting parks with extended season potential, adding long-term and annual sites to create year-round base income, and pricing the acquisition based on realistic seasonal revenue. We also target markets with milder climates or strong winter snowbird demand to reduce seasonality risk.",
  },
  {
    question: "What does a value-add strategy look like for an RV park?",
    answer:
      "Our typical approach includes upgrading sites from partial to full hookup (water, sewer, electric), adding premium site types (pull-through sites, glamping units, cabins), implementing dynamic and seasonal pricing, improving amenities (pools, playgrounds, Wi-Fi, dog parks), expanding the total number of sites on underutilized acreage, and professionalizing operations with modern reservation systems and marketing.",
  },
  {
    question: "What are the risks specific to RV park investing?",
    answer:
      "Key risks include weather and seasonal dependence, environmental and zoning regulations, competition from new park development, changes in fuel prices affecting RV travel, deferred infrastructure maintenance, and the operational complexity of running a hospitality business. We mitigate these through conservative underwriting that stress-tests revenue assumptions, thorough physical due diligence, and active hands-on management.",
  },
  {
    question:
      "What is the difference between a campground and an RV park?",
    answer:
      "The terms are often used interchangeably, but generally an RV park focuses on accommodating recreational vehicles with hookup sites, while a campground may include tent sites, cabins, and other lodging types. Many properties are hybrid operations. Our investment strategy targets both, with a focus on properties where we can add value through site improvements, amenity additions, and revenue optimization regardless of the specific classification.",
  },
];

export default function RVCampgroundsPage() {
  return (
    <main>
      <FAQSchema faqs={rvFAQs} />

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
          {/* Back link */}
          <Link
            href="/invest/syndications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              marginBottom: 32,
              animation: "fadeUp 0.8s ease both",
            }}
          >
            <ArrowLeft size={14} /> All Syndications
          </Link>

          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 16,
              animation: "fadeUp 0.8s 0.05s ease both",
            }}
          >
            Asset Class
          </p>

          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 800,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            RV Parks &amp;{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Campgrounds
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
            Outdoor hospitality assets with fragmented ownership, strong revenue
            growth potential, and multiple income streams in a booming industry.
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
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          2. INVESTMENT THESIS
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
              className="rv-pitch-grid"
            >
              <div>
                <SectionLabel>Investment Thesis</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  The outdoor recreation{" "}
                  <em>megatrend</em>
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
                    The outdoor hospitality industry is experiencing a
                    generational shift. RV ownership has hit record highs, with
                    over 11 million U.S. households now owning an RV. The
                    pandemic accelerated a trend that was already building:
                    families and retirees are choosing outdoor travel experiences
                    over traditional hotels, and that preference has proven
                    durable.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    The supply side has not kept pace. The majority of RV parks
                    and campgrounds in the U.S. are still owned by small,
                    independent operators who lack the capital, systems, and
                    expertise to optimize their properties. This fragmented
                    ownership creates a deep pipeline of acquisition
                    opportunities for professional operators willing to invest in
                    improvements.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                    }}
                  >
                    Unlike traditional real estate, RV parks benefit from
                    multiple revenue streams: nightly and monthly site rentals,
                    cabin and glamping income, amenity fees, retail, and event
                    hosting. This diversification provides resilience and
                    multiple levers for NOI growth.
                  </p>
                </div>
              </div>

              {/* Right: key metrics */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 32,
                  paddingTop: 64,
                }}
              >
                {[
                  {
                    value: "11M+",
                    label: "U.S. households that own an RV",
                  },
                  {
                    value: "$1T+",
                    label: "Annual U.S. outdoor recreation economic impact",
                  },
                  {
                    value: "80%+",
                    label: "Of parks owned by independent operators",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: "2px solid var(--gold)",
                      paddingLeft: 28,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(40px, 4.5vw, 64px)",
                        color: "var(--text)",
                        letterSpacing: "-2px",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {stat.value}
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--text-mid)",
                        lineHeight: 1.6,
                        maxWidth: 300,
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. VALUE-ADD PLAYBOOK
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
              <SectionLabel light>Value-Add Playbook</SectionLabel>
              <h2
                className="type-h2"
                style={{
                  color: "#fff",
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                How we create{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--gold-muted)" }}
                >
                  value
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                background: "var(--navy-border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
              className="rv-playbook-grid"
            >
              {[
                {
                  icon: <Wrench size={22} />,
                  title: "Site Upgrades",
                  body: "Convert basic sites to full hookup (water, sewer, 30/50 amp electric). Full hookup sites command 40-80% higher nightly rates. Upgrade roads, add concrete pads, and improve site spacing for larger modern rigs.",
                },
                {
                  icon: <Tent size={22} />,
                  title: "Premium Accommodations",
                  body: "Add glamping tents, tiny cabins, and park model RVs. These attract guests who do not own RVs, expanding the addressable market while generating the highest per-site revenue in the park.",
                },
                {
                  icon: <TrendingUp size={22} />,
                  title: "Dynamic Pricing",
                  body: "Implement revenue management systems with seasonal, weekend, and event-based pricing. Most mom-and-pop parks use flat rates year-round, leaving significant revenue on the table during peak demand periods.",
                },
                {
                  icon: <Sun size={22} />,
                  title: "Amenity Additions",
                  body: "Pools, playgrounds, dog parks, pickleball courts, camp stores, and event spaces. Premium amenities increase occupancy, justify higher rates, drive longer stays, and create ancillary revenue streams.",
                },
                {
                  icon: <MapPin size={22} />,
                  title: "Site Expansion",
                  body: "Develop additional sites on underutilized acreage. A vacant acre generating $0 can produce $30,000-$80,000 annually once developed with 8-10 RV sites. Expansion is the highest-ROI capital deployment in this asset class.",
                },
                {
                  icon: <Wifi size={22} />,
                  title: "Operations & Marketing",
                  body: "Modern reservation systems, professional photography, SEO, OTA listings, and responsive guest communication. Professionalizing operations and marketing can increase bookings 30-50% at parks acquired from independent operators.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "clamp(28px, 3vw, 44px)",
                    background: "rgba(12,28,48,0.6)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--gold-muted)",
                      marginBottom: 16,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 20,
                      color: "#fff",
                      marginBottom: 12,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "var(--navy-text-mid)",
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          4. SAMPLE INVESTMENT PROFILE
          ════════════════════════════════════════════════════════════ */}
      <section
        className="cream-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <SectionLabel>Sample Investment Profile</SectionLabel>
              <h2
                className="section-title"
                style={{ margin: "0 auto", maxWidth: 560 }}
              >
                What <em>$100,000</em> could look like
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-light)",
                  fontStyle: "italic",
                  maxWidth: 520,
                  margin: "16px auto 0",
                }}
              >
                The following is a hypothetical illustration, not an actual
                offering or guarantee of returns. Actual results will vary.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              {/* Investment entry */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    Your Investment
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Closing day, Year 0
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 24,
                  color: "var(--text)",
                  letterSpacing: "-1px",
                }}>
                  $100,000
                </div>
              </div>

              {/* Annual cash flow header */}
              <div style={{
                padding: "24px 0 12px",
              }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                }}>
                  Targeted Annual Cash Flow
                </p>
              </div>

              {/* Years 1-5 distributions */}
              {[
                { year: "Year 1", coc: "6%", amount: "$6,000", note: "Early operations, seasonal ramp-up" },
                { year: "Year 2", coc: "8%", amount: "$8,000", note: "Site upgrades and pricing optimization" },
                { year: "Year 3", coc: "9%", amount: "$9,000", note: "New sites online, amenity revenue growing" },
                { year: "Year 4", coc: "10%", amount: "$10,000", note: "Near-stabilized, expanded capacity" },
                { year: "Year 5", coc: "10%", amount: "$10,000", note: "Stabilized operations, exit preparation" },
              ].map((yr, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr auto",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: "1px solid var(--border-light)",
                    gap: 16,
                  }}
                >
                  <p style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text)",
                  }}>
                    {yr.year}
                  </p>
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                      {yr.note}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      color: "var(--text)",
                      letterSpacing: "-0.5px",
                    }}>
                      {yr.amount}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: "var(--text-light)",
                      marginLeft: 8,
                    }}>
                      ({yr.coc} CoC)
                    </span>
                  </div>
                </div>
              ))}

              {/* Total distributions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
                  Total Distributions (Yrs 1-5)
                </p>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $43,000
                </div>
              </div>

              {/* Sale proceeds */}
              <div style={{
                padding: "24px 0 12px",
              }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                }}>
                  Year 5 Exit
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                    Return of Capital
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Your original investment returned at sale
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $100,000
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                    Sale Proceeds (Your Share)
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Profit from property appreciation at exit
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $77,000
                </div>
              </div>

              {/* Total return */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "24px 0",
                  marginTop: 8,
                  background: "var(--white)",
                  borderRadius: 12,
                  paddingLeft: 24,
                  paddingRight: 24,
                  border: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    Total Return
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Distributions + return of capital + sale proceeds
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 32,
                    color: "var(--gold)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}>
                    $220,000
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: "var(--text-light)",
                    fontWeight: 500,
                  }}>
                    2.2X Equity Multiple
                  </p>
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "var(--text-light)",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: 32,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              This illustration is for educational purposes only and does not
              represent an actual or projected investment. Targeted returns are
              not guaranteed. Actual results will differ materially. Past
              performance is not indicative of future results. Distributions
              are targeted, not guaranteed, and may vary.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. REQUITY RV EXPERIENCE
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
              className="rv-pitch-grid"
            >
              <div>
                <SectionLabel>Our Experience</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  Lending and operating in{" "}
                  <em>outdoor hospitality</em>
                </h2>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--text-mid)",
                    maxWidth: 480,
                    marginBottom: 24,
                  }}
                >
                  Requity Group has been active in the RV park and campground
                  space through both our lending and equity platforms. We have
                  originated bridge loans for RV park acquisitions, expansions,
                  and repositioning projects, giving us deep insight into what
                  makes these properties succeed and where operators run into
                  trouble.
                </p>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--text-mid)",
                    maxWidth: 480,
                  }}
                >
                  Our underwriting approach for RV parks is informed by this
                  lending experience. We understand seasonal cash flow patterns,
                  infrastructure replacement costs, and the capital requirements
                  for site expansion. When we present a syndication opportunity,
                  the business plan has been stress-tested against what we have
                  seen across dozens of RV park transactions.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "var(--border-light)",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 32,
                }}
              >
                {[
                  { val: "10%", lbl: "Of Loan Portfolio in RV/Campground" },
                  { val: "0", lbl: "Defaults in RV Lending" },
                  { val: "$70M+", lbl: "Total Capital Deployed" },
                  { val: "4,000+", lbl: "Units Under Management" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "clamp(28px, 3vw, 44px)",
                      background: "var(--white)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(32px, 4vw, 48px)",
                        color: "var(--text)",
                        letterSpacing: "-2px",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-light)",
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
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. FAQ
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{
          padding: "clamp(60px, 8vw, 120px) 0",
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
              RV park &amp; campground questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={rvFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. CTA
          ════════════════════════════════════════════════════════════ */}
      <FooterCTA
        headline={
          <>
            Invest in{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              outdoor hospitality
            </em>
          </>
        }
        body="Request access to learn about upcoming RV park and campground syndication opportunities. We will share our deal pipeline, underwriting approach, and portfolio track record."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <a
            href="mailto:invest@requitygroup.com?subject=RV Park Syndication Inquiry"
            className="btn-secondary"
          >
            Email Us
          </a>
        }
      />

      {/* Disclosures */}
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
            offering memoranda pursuant to Regulation D and have not been
            registered under the Securities Act of 1933. Syndication investments
            are speculative, illiquid, and involve risk of loss including total
            loss of capital. Target returns, illustrative economics, and
            industry statistics are not guaranteed and may not reflect current
            conditions. Past performance is not indicative of future results.
            Consult your tax, legal, and financial advisors before investing.
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
              .rv-pitch-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
              .rv-playbook-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
