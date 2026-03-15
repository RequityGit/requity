"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail } from "lucide-react";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const INTEREST_OPTIONS = [
  { value: "Individual Equity Offerings", label: "Individual Equity Offerings" },
  { value: "Individual Debt Offerings", label: "Individual Debt Offerings" },
  { value: "Debt Fund", label: "Debt Fund" },
  { value: "Equity Fund", label: "Equity Fund" },
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function RequestAccessPage() {
  const [step, setStep] = useState<"form" | "profile" | "complete">("form");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [profile, setProfile] = useState({
    accreditedStatus: "",
    targetInvestment: "",
    privateOfferExperience: "",
    investmentInterests: [] as string[],
    state: "",
    investmentTimeline: "",
    entityType: "",
    referralSource: "",
    additionalInfo: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const setProf =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  function toggleInterest(value: string) {
    setProfile((prev) => ({
      ...prev,
      investmentInterests: prev.investmentInterests.includes(value)
        ? prev.investmentInterests.filter((v) => v !== value)
        : [...prev.investmentInterests, value],
    }));
    if (error) setError("");
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }));
    if (error) setError("");
  }

  function validateForm() {
    if (!form.firstName.trim()) return "Please enter your first name.";
    if (!form.lastName.trim()) return "Please enter your last name.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return "Please enter a valid phone number.";
    return null;
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/investor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStep("profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/investor-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          ...profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStep("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 220px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p
            className="section-eyebrow"
            style={{ animation: "fadeUp 0.8s ease forwards", justifyContent: "center" }}
          >
            {step === "form" && "Invest with Requity"}
            {step === "profile" && "Investor Profile"}
            {step === "complete" && "All Set"}
          </p>
          <h1
            className="section-title section-title-light"
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              maxWidth: 720,
              margin: "0 auto",
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            {step === "form" && (
              <>
                Request <em>Access</em>
              </>
            )}
            {step === "profile" && (
              <>
                Thank You, <em>{form.firstName}</em>
              </>
            )}
            {step === "complete" && (
              <>
                You&apos;re All Set, <em>{form.firstName}</em>
              </>
            )}
          </h1>
          {step === "form" && (
            <p
              className="section-desc section-desc-light"
              style={{
                maxWidth: 520,
                margin: "20px auto 0",
                animation: "fadeUp 0.8s 0.2s ease both",
              }}
            >
              Submit your details below and our investor relations team will follow up
              with the offering documents and next steps.
            </p>
          )}
          {step === "complete" && (
            <p
              className="section-desc section-desc-light"
              style={{
                maxWidth: 520,
                margin: "20px auto 0",
                animation: "fadeUp 0.8s 0.2s ease both",
              }}
            >
              Our investor relations team will be in touch shortly with the offering
              documents and next steps.
            </p>
          )}
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Form Section */}
      <section className="light-zone" style={{ paddingTop: 0, paddingBottom: "clamp(80px, 10vw, 120px)" }}>
        <div className="container" style={{ maxWidth: 680 }}>
          {/* Step 1: Basic Info */}
          {step === "form" && (
            <form
              onSubmit={handleFormSubmit}
              style={{ animation: "fadeUp 0.6s ease forwards", marginTop: -20 }}
            >
              <div className="ra-grid">
                <div className="ra-field">
                  <label className="ra-label">
                    First Name <span style={{ color: "var(--gold)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="ra-input"
                    placeholder="John"
                    value={form.firstName}
                    onChange={set("firstName")}
                  />
                </div>
                <div className="ra-field">
                  <label className="ra-label">
                    Last Name <span style={{ color: "var(--gold)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="ra-input"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={set("lastName")}
                  />
                </div>
                <div className="ra-field">
                  <label className="ra-label">
                    Email <span style={{ color: "var(--gold)" }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="ra-input"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
                <div className="ra-field">
                  <label className="ra-label">
                    Phone <span style={{ color: "var(--gold)" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="ra-input"
                    placeholder="(813) 555-0100"
                    value={form.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              {error && <div className="ra-error">{error}</div>}

              <button type="submit" className="btn-primary ra-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Request Access"}
                {!submitting && <ArrowRight size={16} />}
              </button>

              <p className="ra-fine-print">
                By submitting, you acknowledge this is an expression of interest only and
                does not constitute a commitment to invest. Offers are made only to
                accredited investors through the fund&apos;s private placement memorandum.
              </p>
            </form>
          )}

          {/* Step 2: Investor Profile */}
          {step === "profile" && (
            <div style={{ animation: "fadeUp 0.6s ease forwards", marginTop: -20 }}>
              {/* Thank-you banner */}
              <div className="ra-confirm-banner">
                <div className="ra-confirm-icon">
                  <Check size={24} />
                </div>
                <p>
                  Thank you for your interest, {form.firstName}! We will follow up with
                  more information about our company. Filling out the profile below helps
                  us tailor investment opportunities specifically to you.
                </p>
                <span className="ra-confirm-email">
                  <Mail size={14} /> Confirmation sent to {form.email}
                </span>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="ra-grid">
                  {/* Accredited Status */}
                  <div className="ra-field ra-full">
                    <label className="ra-label">Accredited Investor Status</label>
                    <select
                      className="ra-input"
                      value={profile.accreditedStatus}
                      onChange={setProf("accreditedStatus")}
                    >
                      <option value="">Select your status</option>
                      <option value="Yes — Individual Net Worth">
                        Yes — Individual Net Worth ($1M+ excluding primary residence)
                      </option>
                      <option value="Yes — Individual Income">
                        Yes — Individual Income ($200K+ or $300K+ joint)
                      </option>
                      <option value="Yes — Entity">Yes — Entity ($5M+ in assets)</option>
                      <option value="No">No</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>
                  </div>

                  {/* Target Investment */}
                  <div className="ra-field">
                    <label className="ra-label">Target Investment Per Opportunity</label>
                    <select
                      className="ra-input"
                      value={profile.targetInvestment}
                      onChange={setProf("targetInvestment")}
                    >
                      <option value="">Select amount</option>
                      <option value="$25,000 – $50,000">$25,000 - $50,000</option>
                      <option value="$50,000 – $100,000">$50,000 - $100,000</option>
                      <option value="$100,000 – $250,000">$100,000 - $250,000</option>
                      <option value="$250,000 – $500,000">$250,000 - $500,000</option>
                      <option value="$500,000 – $1,000,000">$500,000 - $1,000,000</option>
                      <option value="$1,000,000+">$1,000,000+</option>
                    </select>
                  </div>

                  {/* Private Offer Experience */}
                  <div className="ra-field">
                    <label className="ra-label">Private Offer Experience</label>
                    <select
                      className="ra-input"
                      value={profile.privateOfferExperience}
                      onChange={setProf("privateOfferExperience")}
                    >
                      <option value="">Select experience level</option>
                      <option value="No prior experience">No prior experience</option>
                      <option value="1-2 investments">1-2 investments</option>
                      <option value="3-5 investments">3-5 investments</option>
                      <option value="6-10 investments">6-10 investments</option>
                      <option value="10+ investments">10+ investments</option>
                    </select>
                  </div>

                  {/* Investment Interests */}
                  <div className="ra-field ra-full">
                    <label className="ra-label">
                      Investment Interests{" "}
                      <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                        (select all that apply)
                      </span>
                    </label>
                    <div className="ra-checks">
                      {INTEREST_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`ra-check-card${profile.investmentInterests.includes(opt.value) ? " selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            hidden
                            checked={profile.investmentInterests.includes(opt.value)}
                            onChange={() => toggleInterest(opt.value)}
                          />
                          <span className="ra-check-box">
                            {profile.investmentInterests.includes(opt.value) && <Check size={14} />}
                          </span>
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* State */}
                  <div className="ra-field">
                    <label className="ra-label">State</label>
                    <select className="ra-input" value={profile.state} onChange={setProf("state")}>
                      <option value="">Select your state</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Investment Timeline */}
                  <div className="ra-field">
                    <label className="ra-label">Investment Timeline</label>
                    <select
                      className="ra-input"
                      value={profile.investmentTimeline}
                      onChange={setProf("investmentTimeline")}
                    >
                      <option value="">Select timeline</option>
                      <option value="Immediately">Immediately</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6-12 months">6-12 months</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                  </div>

                  {/* Entity Type */}
                  <div className="ra-field">
                    <label className="ra-label">How Will You Invest?</label>
                    <select
                      className="ra-input"
                      value={profile.entityType}
                      onChange={setProf("entityType")}
                    >
                      <option value="">Select entity type</option>
                      <option value="Individual">Individual</option>
                      <option value="Joint">Joint Account</option>
                      <option value="LLC">LLC</option>
                      <option value="Trust">Trust</option>
                      <option value="IRA / Self-Directed IRA">IRA / Self-Directed IRA</option>
                      <option value="Other Entity">Other Entity</option>
                    </select>
                  </div>

                  {/* Referral Source */}
                  <div className="ra-field">
                    <label className="ra-label">How Did You Hear About Us?</label>
                    <input
                      type="text"
                      className="ra-input"
                      placeholder="Referral, podcast, Google..."
                      value={profile.referralSource}
                      onChange={setProf("referralSource")}
                    />
                  </div>

                  {/* Additional Info */}
                  <div className="ra-field ra-full">
                    <label className="ra-label">Additional Information</label>
                    <textarea
                      className="ra-input"
                      placeholder="Any questions, preferences, or details you'd like to share..."
                      value={profile.additionalInfo}
                      onChange={setProf("additionalInfo")}
                      rows={4}
                    />
                  </div>
                </div>

                {error && <div className="ra-error">{error}</div>}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 32 }}>
                  <button type="submit" className="btn-primary ra-submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Profile"}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("complete");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-light)",
                      cursor: "pointer",
                      fontSize: 14,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      padding: "8px 16px",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === "complete" && (
            <div
              className="ra-success-card"
              style={{ animation: "fadeUp 0.6s ease forwards", marginTop: -20 }}
            >
              <div className="ra-success-icon">
                <Check size={32} />
              </div>
              <h2>Thank You, {form.firstName}</h2>
              <p>
                Our investor relations team will reach out within 1-2 business days with the
                offering documents and next steps. We look forward to connecting with you.
              </p>
              <span className="ra-confirm-email" style={{ marginBottom: 32 }}>
                <Mail size={14} /> A confirmation has been sent to {form.email}
              </span>
              <Link href="/" className="btn-editorial">
                Back to Home <span className="arrow"><ArrowRight size={14} /></span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section
        className="dark-zone"
        style={{ padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 800, margin: "0 auto" }}>
            This page is for informational purposes only and does not constitute an offer to sell or
            a solicitation of an offer to buy any securities. Offers are made only to accredited
            investors through the fund&apos;s private placement memorandum. Past performance is not
            indicative of future results. All investments involve risk, including the potential loss
            of principal.
          </p>
        </div>
      </section>

      <style>{`
        .ra-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .ra-field.ra-full { grid-column: 1 / -1; }
        .ra-label {
          display: block;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .ra-input {
          width: 100%;
          padding: 14px 16px;
          font-family: var(--font-sans);
          font-size: 15px;
          color: var(--navy);
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 0;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          -webkit-appearance: none;
        }
        .ra-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(180,155,80,0.1);
        }
        .ra-input::placeholder { color: var(--text-light); opacity: 0.6; }
        select.ra-input {
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
        textarea.ra-input {
          resize: vertical;
          min-height: 100px;
          line-height: 1.6;
        }
        .ra-submit {
          width: 100%;
          margin-top: 32px;
          justify-content: center;
        }
        .ra-error {
          margin-top: 20px;
          padding: 14px 20px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.2);
          color: #b91c1c;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-sans);
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .ra-fine-print {
          font-size: 12px;
          color: var(--text-light);
          line-height: 1.7;
          margin-top: 20px;
          text-align: center;
          opacity: 0.7;
        }
        .ra-confirm-banner {
          text-align: center;
          padding: 32px;
          margin-bottom: 32px;
          background: rgba(180,155,80,0.04);
          border: 1px solid rgba(180,155,80,0.15);
        }
        .ra-confirm-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(180,155,80,0.1);
          color: var(--gold);
          margin-bottom: 16px;
        }
        .ra-confirm-banner p {
          font-size: 14px;
          color: var(--text-mid);
          line-height: 1.7;
          max-width: 500px;
          margin: 0 auto 12px;
        }
        .ra-confirm-email {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-light);
        }
        .ra-checks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ra-check-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--cream);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.3s;
          user-select: none;
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-mid);
          font-weight: 500;
        }
        .ra-check-card:hover {
          border-color: var(--gold);
          background: rgba(180,155,80,0.03);
        }
        .ra-check-card.selected {
          border-color: var(--gold);
          background: rgba(180,155,80,0.06);
          color: var(--navy);
        }
        .ra-check-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border: 1.5px solid var(--border);
          transition: all 0.3s;
          color: transparent;
        }
        .ra-check-card.selected .ra-check-box {
          border-color: var(--gold);
          background: var(--gold);
          color: #fff;
        }
        .ra-success-card {
          text-align: center;
          padding: 56px 40px;
          background: var(--cream);
          border: 1px solid var(--border);
        }
        .ra-success-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(180,155,80,0.1);
          color: var(--gold);
          margin-bottom: 28px;
        }
        .ra-success-card h2 {
          font-family: var(--font-serif);
          font-size: 32px;
          font-weight: 400;
          color: var(--navy);
          margin-bottom: 16px;
        }
        .ra-success-card p {
          font-size: 15px;
          color: var(--text-mid);
          line-height: 1.7;
          max-width: 480px;
          margin: 0 auto 24px;
        }
        @media (max-width: 768px) {
          .ra-grid { grid-template-columns: 1fr; }
          .ra-checks { grid-template-columns: 1fr; }
          .ra-success-card { padding: 40px 24px; }
          .ra-success-card h2 { font-size: 28px; }
          .ra-confirm-banner { padding: 24px; }
        }
      `}</style>
    </main>
  );
}
