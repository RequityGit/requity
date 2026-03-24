# Claude Code Prompt: Create Lending Homepage PR

Run these steps in order. Do NOT ask questions, just execute.

## 1. Create branch and checkout

```bash
git checkout main && git pull origin main && git checkout -b lending-homepage-revamp
```

## 2. Replace the lending page

Replace the ENTIRE contents of `apps/requity-group/app/lending/page.tsx` with the code below (overwrite completely):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type { PageSection, LoanProgram, SiteStat, Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import SectionLabel from "../components/SectionLabel";
import AnimatedLine from "../components/AnimatedLine";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import {
  ArrowRight,
  Zap,
  CheckCircle,
  HardHat,
  MessageSquare,
  Send,
  FileText,
  Search,
  DollarSign,
  Clock,
  Shield,
  Handshake,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Requity Lending | Bridge Loans for Real Estate",
  description:
    "Bridge loans for commercial and residential real estate from an operator who understands your deal. Close in as little as 10 days. Term sheets in 24 hours.",
  openGraph: {
    title: "Requity Lending | Bridge Loans for Real Estate",
    description:
      "Bridge loans by real operators. Close in 10 days. CRE bridge, manufactured housing, RV parks, multifamily financing. Up to 80% LTV.",
  },
  twitter: {
    title: "Requity Lending | Bridge Loans for Real Estate",
    description:
      "Bridge loans by real operators. Close in 10 days. CRE bridge, manufactured housing, RV parks, multifamily financing.",
  },
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Fast Execution": <Zap size={22} />,
  "Certainty of Close": <Shield size={22} />,
  "Operator Mentality": <HardHat size={22} />,
  "Direct Communication": <MessageSquare size={22} />,
};

const PROCESS_ICONS = [
  <Send key="1" size={22} />,
  <FileText key="2" size={22} />,
  <Search key="3" size={22} />,
  <DollarSign key="4" size={22} />,
];

const PROCESS_STEPS = [
  {
    title: "Submit Your Deal",
    description:
      "Complete our simple deal submission form with your property and project details. No credit pull, no commitment.",
  },
  {
    title: "Receive a Term Sheet",
    description:
      "Our team reviews your request and delivers a term sheet within 24 hours of receiving a complete package.",
  },
  {
    title: "Underwriting & Diligence",
    description:
      "We conduct property-level due diligence and finalize loan documents with clear, direct communication throughout.",
  },
  {
    title: "Close & Fund",
    description:
      "Funds are wired at closing. Most deals close in 10-14 days from term sheet acceptance.",
  },
];

const LENDING_STATS = [
  { label: "Fastest Close", value: "10 Days" },
  { label: "Term Sheet Turnaround", value: "24 Hrs" },
  { label: "Max LTV", value: "80%" },
  { label: "Loans Funded", value: "150+" },
];

export default async function LendingPage() {
  const [sections, programs, testimonials] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "lending" },
    }),
    fetchSiteData<LoanProgram>("site_loan_programs", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whySection = sections.find((s) => s.section_key === "why");
  const benefits =
    (whySection?.metadata?.benefits as Array<{
      title: string;
      description: string;
    }>) ?? [];

  const featuredTestimonials = testimonials
    .filter((t) => t.is_featured)
    .slice(0, 3);

  return (
    <main>
      {/* HERO */}
      <PageHero
        label="Bridge Lending"
        headline={
          hero?.heading ? (
            renderEmText(hero.heading)
          ) : (
            <>
              Close in{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                10 days
              </em>
              , not 10 weeks
            </>
          )
        }
        body={
          hero?.body_text ??
          "Residential and commercial bridge loans from an operator who understands your deal. Direct communication, fast execution, certainty of close."
        }
        cta={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <Link href="/lending/apply" className="btn-primary">
              Submit a Deal <ArrowRight size={16} />
            </Link>
            <a href="#programs" className="btn-editorial-light">
              View Programs <span className="arrow">&rarr;</span>
            </a>
          </div>
        }
      />

      {/* STATS BAR */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <AnimatedLine light />
          <div className="stats-grid on-navy">
            {LENDING_STATS.map((stat) => (
              <div key={stat.label} className="stat-cell">
                <div className="stat-num gold">{stat.value}</div>
                <div className="stat-lbl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY REQUITY LENDING */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>Why Us</SectionLabel>
              </div>
              <div>
                <h2
                  className="type-h2"
                  style={{ color: "var(--text)", marginBottom: 32 }}
                >
                  {whySection?.heading
                    ? renderEmText(whySection.heading)
                    : "Built by operators, for operators"}
                </h2>
                <p
                  className="type-body"
                  style={{
                    color: "var(--text-mid)",
                    maxWidth: 680,
                    marginBottom: 44,
                  }}
                >
                  {whySection?.body_text ??
                    "We invest in real estate ourselves, so we understand your deal from both sides of the table. That means faster decisions, smarter structuring, and a lender who speaks your language."}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24,
              }}
            >
              {benefits.length > 0
                ? benefits.map((b) => (
                    <div key={b.title} className="value-item">
                      <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                        {BENEFIT_ICONS[b.title] ?? <Zap size={22} />}
                      </div>
                      <h4>{b.title}</h4>
                      <p>{b.description}</p>
                    </div>
                  ))
                : [
                    {
                      icon: <Clock size={22} />,
                      title: "Fast Execution",
                      desc: "Term sheets in 24 hours, closings in as fast as 10 business days. We move at the speed your deal requires.",
                    },
                    {
                      icon: <Shield size={22} />,
                      title: "Certainty of Close",
                      desc: "Direct balance sheet lender with capital ready to deploy. No last-minute surprises or committee delays.",
                    },
                    {
                      icon: <HardHat size={22} />,
                      title: "Operator Mentality",
                      desc: "We invest in real estate too. We understand renovation timelines, lease-up risk, and exit strategies firsthand.",
                    },
                    {
                      icon: <Handshake size={22} />,
                      title: "Direct Access",
                      desc: "Talk to decision-makers from day one. No call centers, no layers of bureaucracy, no runaround.",
                    },
                  ].map((b) => (
                    <div key={b.title} className="value-item">
                      <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                        {b.icon}
                      </div>
                      <h4>{b.title}</h4>
                      <p>{b.desc}</p>
                    </div>
                  ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ padding: "0 0 24px" }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* LOAN PROGRAMS */}
      <section id="programs" className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Loan Programs</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 16 }}
            >
              Flexible bridge{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                financing
              </em>
            </h2>
            <p
              className="type-body"
              style={{
                color: "var(--text-mid)",
                maxWidth: 600,
                marginBottom: 56,
              }}
            >
              Tailored loan structures for residential, commercial, and
              value-add projects. Every program is backed by our direct lending
              balance sheet.
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
              {programs.map((program) => (
                <div key={program.id} className="card">
                  <h3 className="card-title" style={{ fontSize: 23 }}>
                    {program.display_name}
                  </h3>
                  {program.tagline && (
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 13,
                        color: "var(--gold)",
                        fontWeight: 500,
                        marginBottom: 8,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {program.tagline}
                    </p>
                  )}
                  <p className="card-body" style={{ marginBottom: 20 }}>
                    {program.description}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {(program.features as string[]).map((feature, i) => (
                      <li key={i} className="program-feature">
                        <CheckCircle
                          size={15}
                          className="program-feature-icon"
                          style={{ flexShrink: 0 }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PROCESS */}
      <section
        className="dark-zone section-pad-lg"
        style={{ overflow: "hidden" }}
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
            <SectionLabel light>Our Process</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "#fff", marginBottom: 16 }}
            >
              From submission to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                funding
              </em>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                maxWidth: 560,
                marginBottom: 56,
              }}
            >
              We have streamlined our process to get you from application to
              closing as quickly as possible, with clear communication at every
              step.
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
              {PROCESS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="card-navy"
                  style={{ padding: "36px 32px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div className="step-icon">{PROCESS_ICONS[i]}</div>
                    <span className="step-label">Step {i + 1}</span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 21,
                      fontWeight: 400,
                      color: "#fff",
                      marginBottom: 12,
                      lineHeight: 1.25,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.75,
                      color: "var(--navy-text-mid)",
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {featuredTestimonials.length > 0 && (
        <section className="cream-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <SectionLabel>Testimonials</SectionLabel>
              <h2
                className="type-h2"
                style={{ color: "var(--text)", marginBottom: 48 }}
              >
                Trusted by borrowers and brokers
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                }}
              >
                {featuredTestimonials.map((t) => (
                  <div key={t.id} className="test-card">
                    <div className="big-q">&ldquo;</div>
                    <div className="stars">{"★".repeat(t.rating)}</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <FooterCTA
        label="Get Started"
        headline={
          <>
            Have a deal?{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Let&apos;s talk.
            </em>
          </>
        }
        body="Submit your deal details and our lending team will deliver a term sheet within 24 hours. No obligation, no credit pull."
        primaryCta={
          <Link href="/lending/apply" className="btn-primary">
            Submit a Deal <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/invest" className="btn-secondary">
            Looking to Invest? <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
```

## 3. Create the apply page

Create the file `apps/requity-group/app/lending/apply/page.tsx` (create the `apply` directory if it doesn't exist) with this content:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import SectionLabel from "../../components/SectionLabel";
import ScrollReveal from "../../components/ScrollReveal";
import FooterCTA from "../../components/FooterCTA";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Submit a Deal | Requity Lending",
  description:
    "Submit your bridge loan request to Requity Lending. Term sheets in 24 hours, closings in as fast as 10 days.",
};

export default function ApplyPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 200px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
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
          <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
            <SectionLabel light>Submit a Deal</SectionLabel>
          </div>
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 700,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Tell us about your{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              project
            </em>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--navy-text-mid)",
              maxWidth: 520,
              animation: "fadeUp 0.8s 0.2s ease both",
              marginTop: 24,
            }}
          >
            Fill out the form below and our team will review your deal. Expect a
            term sheet within 24 hours of receiving a complete submission.
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Form Section */}
      <section className="light-zone section-pad-lg">
        <div className="container" style={{ maxWidth: 720 }}>
          <ScrollReveal>
            <div
              className="card"
              style={{
                padding: "48px 44px",
                borderRadius: 16,
              }}
            >
              <h2
                className="type-h3"
                style={{
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                Deal Submission
              </h2>
              <p
                className="type-body-sm"
                style={{
                  color: "var(--text-mid)",
                  marginBottom: 36,
                }}
              >
                All fields are optional at this stage. The more detail you
                provide, the faster we can turn around a term sheet.
              </p>

              {/* Contact Info */}
              <fieldset
                style={{
                  border: "none",
                  padding: 0,
                  margin: "0 0 36px",
                }}
              >
                <legend
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                    padding: 0,
                  }}
                >
                  Contact Information
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FormField label="Full Name" name="name" />
                  <FormField label="Email" name="email" type="email" />
                  <FormField label="Phone" name="phone" type="tel" />
                  <FormField label="Company" name="company" />
                </div>
              </fieldset>

              {/* Property Info */}
              <fieldset
                style={{
                  border: "none",
                  padding: 0,
                  margin: "0 0 36px",
                }}
              >
                <legend
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                    padding: 0,
                  }}
                >
                  Property Details
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FormField label="Property Address" name="address" />
                  <FormSelect
                    label="Property Type"
                    name="property_type"
                    options={[
                      "Residential (1-4 units)",
                      "Multifamily (5+)",
                      "Mixed Use",
                      "Commercial",
                      "Land",
                      "Other",
                    ]}
                  />
                  <FormField
                    label="Purchase Price / Value"
                    name="value"
                    placeholder="$"
                  />
                  <FormField
                    label="Loan Amount Requested"
                    name="loan_amount"
                    placeholder="$"
                  />
                </div>
              </fieldset>

              {/* Deal Info */}
              <fieldset
                style={{
                  border: "none",
                  padding: 0,
                  margin: "0 0 36px",
                }}
              >
                <legend
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "3px",
                    textTransform: "uppercase" as const,
                    color: "var(--gold)",
                    marginBottom: 20,
                    padding: 0,
                  }}
                >
                  Deal Details
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <FormSelect
                    label="Loan Purpose"
                    name="purpose"
                    options={[
                      "Acquisition",
                      "Refinance",
                      "Cash-Out Refinance",
                      "Renovation / Rehab",
                      "Bridge to Permanent",
                    ]}
                  />
                  <FormSelect
                    label="Timeline"
                    name="timeline"
                    options={[
                      "Urgent (under 2 weeks)",
                      "Standard (2-4 weeks)",
                      "Flexible (1+ months)",
                    ]}
                  />
                </div>
                <div style={{ marginTop: 16 }}>
                  <FormTextarea
                    label="Tell us about the deal"
                    name="notes"
                    placeholder="Exit strategy, renovation scope, current status of the property, anything that helps us understand the opportunity."
                  />
                </div>
              </fieldset>

              {/* Submit */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <Link
                  href="/lending"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--text-light)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} /> Back to Lending
                </Link>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Submit Deal <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Trust signals */}
          <ScrollReveal>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 32,
                marginTop: 40,
                flexWrap: "wrap" as const,
              }}
            >
              {[
                "No credit pull required",
                "No commitment or fees",
                "Response within 24 hours",
              ].map((text) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--text-mid)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {text}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        headline={
          <>
            Prefer to talk{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              directly
            </em>
            ?
          </>
        }
        body="Our lending team is available to discuss your project. Reach out anytime."
        primaryCta={
          <a href="mailto:lending@requitygroup.com" className="btn-primary">
            Email Our Team <ArrowRight size={16} />
          </a>
        }
        secondaryCta={
          <Link href="/lending" className="btn-secondary">
            Back to Lending
          </Link>
        }
      />
    </main>
  );
}

/* -- Form Field Components -- */
function FormField({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--text)",
          outline: "none",
          boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--text)",
          outline: "none",
          boxSizing: "border-box" as const,
        }}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={4}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--text)",
          outline: "none",
          resize: "vertical" as const,
          boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
}
```

## 4. Stage, commit, push, and create PR

```bash
git add apps/requity-group/app/lending/page.tsx apps/requity-group/app/lending/apply/page.tsx
git commit -m "feat: rebuild lending homepage and add deal submission page

- Rebuild /lending as full standalone homepage for requitylending.com
- Add /lending/apply deal submission form page
- Pull loan programs, testimonials, page sections from Supabase
- Hero, stats bar, why-us section, loan programs grid, process steps, testimonials, footer CTA
- Deal form with contact info, property details, deal details fieldsets
- Shared design system: PageHero, FooterCTA, ScrollReveal, SectionLabel, AnimatedLine
- All CTAs point to /lending/apply instead of mailto"

git push -u origin lending-homepage-revamp

gh pr create --title "Rebuild lending homepage for requitylending.com merge" --body "## Summary
- Rebuilt \`/lending\` as a full standalone homepage matching the requitygroup.com design system, ready to serve as the requitylending.com homepage
- Added \`/lending/apply\` deal submission form with structured fieldsets for contact info, property details, and deal details
- Loan programs pulled dynamically from Supabase \`site_loan_programs\` table
- Testimonials pulled from \`site_testimonials\` (featured only)
- Page sections (hero, why-us) pulled from \`site_page_sections\` with hardcoded fallbacks
- Uses shared components: PageHero, FooterCTA, ScrollReveal, SectionLabel, AnimatedLine

## Next Steps (follow-up PRs)
- Add \`middleware.ts\` for domain-based routing (requitylending.com -> /lending rewrite)
- Configure Netlify domain alias for requitylending.com
- Wire up deal submission form to Supabase or email endpoint

## Test plan
- [ ] Verify /lending page renders with all sections
- [ ] Verify /lending/apply form renders with all fieldsets
- [ ] Verify loan programs load from Supabase
- [ ] Verify testimonials display when featured ones exist
- [ ] Check responsive layout on mobile
- [ ] Verify all CTA links point to correct destinations"
```

Done. After the PR is created, paste the URL back here.
