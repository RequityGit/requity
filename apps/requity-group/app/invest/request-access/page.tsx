"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, ArrowLeft } from "lucide-react";
import { formatPhone } from "@repo/lib";

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

const QUICK_INTERESTS = [
  { value: "bridge-lending-fund", label: "Bridge Lending Fund", desc: "8-12% target yield, monthly distributions" },
  { value: "direct-equity", label: "Direct Equity", desc: "15-22% target IRR, value-add real estate" },
  { value: "both", label: "Both / Exploring", desc: "I want to learn about all options" },
];

export default function RequestAccessPage() {
  const [step, setStep] = useState<"form" | "profile" | "complete">("form");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    quickInterest: "",
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
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/investor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          quickInterest: form.quickInterest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStep("profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setSubmitting(false); }
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
    } finally { setSubmitting(false); }
  }

  return (
    <main>
      {/* ── Step 1: Split layout — brand left, form right ── */}
      {step === "form" && (
        <section className="dark-zone hero-gradient ra-split-section">
          <div className="navy-grid-pattern">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
            ))}
          </div>
          <div className="container ra-split-container">
            {/* Left: Brand zone */}
            <div className="ra-split-brand">
              <p className="section-eyebrow" style={{ animation: "fadeUp 0.8s ease forwards" }}>
                Invest with Requity
              </p>
              <h1
                className="section-title section-title-light"
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  animation: "fadeUp 0.8s 0.1s ease both",
                }}
              >
                Request <em>Access</em>
              </h1>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                marginTop: 16,
                maxWidth: 360,
                animation: "fadeUp 0.8s 0.2s ease both",
              }}>
                Submit your details and our investor relations team will follow up with the offering documents and next steps.
              </p>

              {/* Trust stats */}
              <div className="ra-trust-stats">
                {[
                  { value: "$70M+", label: "Capital Deployed" },
                  { value: "Monthly", label: "Distributions" },
                  { value: "0", label: "Investor Losses" },
                ].map((stat) => (
                  <div key={stat.label} className="ra-trust-stat">
                    <div className="ra-trust-value">{stat.value}</div>
                    <div className="ra-trust-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="ra-split-form">
              <form onSubmit={handleFormSubmit}>
                <div className="ra-grid">
                  <div className="ra-field">
                    <label className="ra-label-light">First Name <span style={{ color: "var(--gold-muted)" }}>*</span></label>
                    <input type="text" className="ra-input-dark" placeholder="John" value={form.firstName} onChange={set("firstName")} />
                  </div>
                  <div className="ra-field">
                    <label className="ra-label-light">Last Name <span style={{ color: "var(--gold-muted)" }}>*</span></label>
                    <input type="text" className="ra-input-dark" placeholder="Smith" value={form.lastName} onChange={set("lastName")} />
                  </div>
                  <div className="ra-field">
                    <label className="ra-label-light">Email <span style={{ color: "var(--gold-muted)" }}>*</span></label>
                    <input type="email" className="ra-input-dark" placeholder="john@example.com" value={form.email} onChange={set("email")} />
                  </div>
                  <div className="ra-field">
                    <label className="ra-label-light">Phone <span style={{ color: "var(--gold-muted)" }}>*</span></label>
                    <input type="tel" className="ra-input-dark" placeholder="(813) 555-0100" value={form.phone} onChange={handlePhoneChange} />
                  </div>
                </div>

                {error && <div className="ra-error" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>{error}</div>}

                <button type="submit" className="ra-submit-gold" disabled={submitting}>
                  {submitting ? "Submitting..." : "Request Access"}
                  {!submitting && <ArrowRight size={16} />}
                </button>

                <p className="ra-fine-print" style={{ color: "rgba(255,255,255,0.25)" }}>
                  By submitting, you acknowledge this is an expression of interest only and
                  does not constitute a commitment to invest. Offers are made only to
                  accredited investors through the fund&apos;s private placement memorandum.
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 2: Thank you + profile (reframed) ── */}
      {step === "profile" && (
        <>
          <section
            className="dark-zone hero-gradient"
            style={{
              paddingTop: "clamp(100px, 12vw, 140px)",
              paddingBottom: "clamp(40px, 5vw, 56px)",
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
              <div className="ra-confirm-icon-hero">
                <Check size={28} />
              </div>
              <h1
                className="section-title section-title-light"
                style={{
                  fontSize: "clamp(32px, 4.5vw, 48px)",
                  maxWidth: 600,
                  margin: "0 auto",
                }}
              >
                Welcome, <em>{form.firstName}</em>
              </h1>
              <p
                className="section-desc section-desc-light"
                style={{ maxWidth: 480, margin: "16px auto 0" }}
              >
                Your request is confirmed. Our investor relations team will reach out within 1-2 business days.
              </p>
              <span className="ra-confirm-email" style={{ marginTop: 16, display: "inline-flex" }}>
                <Mail size={14} /> Confirmation sent to {form.email}
              </span>
            </div>
          </section>

          <div className="dark-to-light" style={{ height: 36 }} />

          <section className="light-zone" style={{ paddingTop: 0, paddingBottom: "clamp(60px, 8vw, 100px)" }}>
            <div className="container" style={{ maxWidth: 640 }}>
              <div style={{ animation: "fadeUp 0.6s ease forwards", marginTop: -12 }}>

                {/* Reframed profile intro */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <h2 style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(24px, 3vw, 32px)",
                    fontWeight: 400,
                    color: "var(--text)",
                    marginBottom: 10,
                  }}>
                    Help us prepare for your call
                  </h2>
                  <p style={{ fontSize: 15, color: "var(--text-mid)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
                    The more we know, the more relevant our first conversation will be. Everything below is optional.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="ra-grid">
                    {/* Accredited Status */}
                    <div className="ra-field ra-full">
                      <label className="ra-label">Accredited Investor Status</label>
                      <select className="ra-input" value={profile.accreditedStatus} onChange={setProf("accreditedStatus")}>
                        <option value="">Select your status</option>
                        <option value="Yes — Individual Net Worth">Yes - Individual Net Worth ($1M+ excluding primary residence)</option>
                        <option value="Yes — Individual Income">Yes - Individual Income ($200K+ or $300K+ joint)</option>
                        <option value="Yes — Entity">Yes - Entity ($5M+ in assets)</option>
                        <option value="No">No</option>
                        <option value="Not Sure">Not Sure</option>
                      </select>
                    </div>

                    {/* Target Investment */}
                    <div className="ra-field">
                      <label className="ra-label">Target Investment Per Opportunity</label>
                      <select className="ra-input" value={profile.targetInvestment} onChange={setProf("targetInvestment")}>
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
                      <select className="ra-input" value={profile.privateOfferExperience} onChange={setProf("privateOfferExperience")}>
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
                        <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span>
                      </label>
                      <div className="ra-checks">
                        {INTEREST_OPTIONS.map((opt) => (
                          <label key={opt.value} className={`ra-check-card${profile.investmentInterests.includes(opt.value) ? " selected" : ""}`}>
                            <input type="checkbox" hidden checked={profile.investmentInterests.includes(opt.value)} onChange={() => toggleInterest(opt.value)} />
                            <span className="ra-check-box">{profile.investmentInterests.includes(opt.value) && <Check size={14} />}</span>
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="ra-field">
                      <label className="ra-label">State</label>
                      <select className="ra-input" value={profile.state} onChange={setProf("state")}>
                        <option value="">Select your state</option>
                        {US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>

                    <div className="ra-field">
                      <label className="ra-label">Investment Timeline</label>
                      <select className="ra-input" value={profile.investmentTimeline} onChange={setProf("investmentTimeline")}>
                        <option value="">Select timeline</option>
                        <option value="Immediately">Immediately</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6-12 months">6-12 months</option>
                        <option value="Just exploring">Just exploring</option>
                      </select>
                    </div>

                    <div className="ra-field">
                      <label className="ra-label">How Will You Invest?</label>
                      <select className="ra-input" value={profile.entityType} onChange={setProf("entityType")}>
                        <option value="">Select entity type</option>
                        <option value="Individual">Individual</option>
                        <option value="Joint">Joint Account</option>
                        <option value="LLC">LLC</option>
                        <option value="Trust">Trust</option>
                        <option value="IRA / Self-Directed IRA">IRA / Self-Directed IRA</option>
                        <option value="Other Entity">Other Entity</option>
                      </select>
                    </div>

                    <div className="ra-field">
                      <label className="ra-label">How Did You Hear About Us?</label>
                      <input type="text" className="ra-input" placeholder="Referral, podcast, Google..." value={profile.referralSource} onChange={setProf("referralSource")} />
                    </div>

                    <div className="ra-field ra-full">
                      <label className="ra-label">Additional Information</label>
                      <textarea className="ra-input" placeholder="Any questions, preferences, or details you'd like to share..." value={profile.additionalInfo} onChange={setProf("additionalInfo")} rows={4} />
                    </div>
                  </div>

                  {error && <div className="ra-error">{error}</div>}

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 32 }}>
                    <button type="submit" className="btn-primary ra-submit" disabled={submitting} style={{ marginTop: 0 }}>
                      {submitting ? "Submitting..." : "Submit Profile"}
                      {!submitting && <ArrowRight size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep("complete"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{
                        background: "none", border: "none", color: "var(--text-light)",
                        cursor: "pointer", fontSize: 14, textDecoration: "underline",
                        textUnderlineOffset: 3, padding: "8px 16px", fontFamily: "var(--font-sans)",
                      }}
                    >
                      Skip for now
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Step 3: Complete ── */}
      {step === "complete" && (
        <>
          <section
            className="dark-zone hero-gradient"
            style={{
              paddingTop: "clamp(140px, 18vw, 200px)",
              paddingBottom: "clamp(80px, 10vw, 120px)",
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
              <div className="ra-confirm-icon-hero">
                <Check size={32} />
              </div>
              <h1
                className="section-title section-title-light"
                style={{
                  fontSize: "clamp(32px, 4.5vw, 48px)",
                  maxWidth: 600,
                  margin: "0 auto 16px",
                }}
              >
                You&apos;re All Set, <em>{form.firstName}</em>
              </h1>
              <p className="section-desc section-desc-light" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
                Our investor relations team will reach out within 1-2 business days with the offering documents and next steps.
              </p>
              <span className="ra-confirm-email" style={{ marginBottom: 36, display: "inline-flex" }}>
                <Mail size={14} /> A confirmation has been sent to {form.email}
              </span>
              <div style={{ marginTop: 24 }}>
                <Link href="/" className="btn-editorial-light">
                  Back to Home <span className="arrow"><ArrowRight size={14} /></span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Disclaimer */}
      <section className="dark-zone" style={{ padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
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
        /* Split layout */
        .ra-split-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 80px 0;
          position: relative;
        }
        .ra-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(40px, 6vw, 80px);
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .ra-split-brand {
          animation: fadeUp 0.8s ease forwards;
        }
        .ra-split-form {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: clamp(28px, 3vw, 44px);
          animation: fadeUp 0.8s 0.15s ease both;
        }
        .ra-trust-stats {
          display: flex;
          gap: 32px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .ra-trust-stat {}
        .ra-trust-value {
          font-family: var(--font-serif);
          font-size: 24px;
          color: var(--gold-muted);
          margin-bottom: 2px;
        }
        .ra-trust-label {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--navy-text-mid);
        }
        .ra-label-light {
          display: block;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .ra-input-dark {
          width: 100%;
          padding: 14px 16px;
          font-family: var(--font-sans);
          font-size: 15px;
          color: #fff;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          -webkit-appearance: none;
        }
        .ra-input-dark:focus {
          border-color: var(--gold-muted);
          box-shadow: 0 0 0 3px rgba(180,155,80,0.1);
        }
        .ra-input-dark::placeholder { color: rgba(255,255,255,0.2); }
        .ra-submit-gold {
          width: 100%;
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px 32px;
          background: var(--gold);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          transition: all 0.25s;
        }
        .ra-submit-gold:hover {
          background: var(--gold-muted);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(160,138,78,0.3);
        }
        .ra-submit-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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

        /* Quick interest cards */
        .ra-quick-interests {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .ra-quick-card {
          padding: 16px 14px;
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 0;
          cursor: pointer;
          text-align: left;
          transition: all 0.25s;
          font-family: inherit;
          color: inherit;
        }
        .ra-quick-card:hover {
          border-color: var(--gold);
        }
        .ra-quick-card.selected {
          border-color: var(--gold);
          background: rgba(160,138,78,0.06);
          box-shadow: 0 0 0 1px var(--gold);
        }
        .ra-quick-name {
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }
        .ra-quick-desc {
          font-size: 12px;
          color: var(--text-light);
          line-height: 1.4;
        }
        .ra-quick-card.selected .ra-quick-name { color: var(--navy); }
        .ra-quick-card.selected .ra-quick-desc { color: var(--gold); }

        /* Accredited checkbox */
        .ra-accredited-check {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          background: var(--cream);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.25s;
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-mid);
          line-height: 1.5;
          user-select: none;
        }
        .ra-accredited-check:hover { border-color: var(--gold); }
        .ra-accredited-check.checked {
          border-color: var(--gold);
          background: rgba(160,138,78,0.04);
          color: var(--text);
        }

        .ra-submit {
          width: 100%;
          margin-top: 28px;
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
        .ra-confirm-icon-hero {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--gold-muted);
          color: var(--gold-muted);
          margin-bottom: 20px;
          animation: applyCheckPop 0.5s var(--ease-out);
        }
        @keyframes applyCheckPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .ra-confirm-email {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
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
        .ra-check-card:hover { border-color: var(--gold); background: rgba(180,155,80,0.03); }
        .ra-check-card.selected { border-color: var(--gold); background: rgba(180,155,80,0.06); color: var(--navy); }
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
        .ra-check-card.selected .ra-check-box,
        .ra-accredited-check.checked .ra-check-box {
          border-color: var(--gold);
          background: var(--gold);
          color: #fff;
        }
        @media (max-width: 968px) {
          .ra-split-container { grid-template-columns: 1fr; }
          .ra-split-section { padding-top: 100px; min-height: auto; }
          .ra-split-brand { text-align: center; }
          .ra-split-brand .section-eyebrow { justify-content: center; }
          .ra-trust-stats { justify-content: center; }
        }
        @media (max-width: 768px) {
          .ra-grid { grid-template-columns: 1fr; }
          .ra-checks { grid-template-columns: 1fr; }
          .ra-trust-stats { flex-direction: column; gap: 16px; align-items: center; text-align: center; }
          .ra-split-form { padding: 24px 20px; }
        }
      `}</style>
    </main>
  );
}
