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
