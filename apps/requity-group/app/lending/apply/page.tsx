"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LOAN_TYPES,
  RESIDENTIAL_IDS,
  COMMERCIAL_IDS,
  RESIDENTIAL_TYPES,
  COMMERCIAL_TYPES,
  COMMERCIAL_TERM_TYPES,
  TIMELINES,
  EXPERIENCE_LEVELS,
  CREDIT_SCORE_RANGES,
  DEALS_24_MONTHS,
  CITIZENSHIP_OPTIONS,
  TERM_OPTIONS,
  DEFAULT_SLIDER,
  LOAN_PROGRAMS,
  formatPhone,
  formatCurrencyInput,
  parseCurrency,
  qualifyForProgram,
  calculateTerms,
  type CalculatedTerms,
  type PricingProgram,
} from "@repo/lib";
import SectionLabel from "../../components/SectionLabel";
import { ArrowRight, ArrowLeft, Shield, Clock, Phone } from "lucide-react";

/* ── Helpers ── */
function findProgramForTerm(
  form: Record<string, string>,
  termMonths: number,
): PricingProgram | null {
  const config = LOAN_PROGRAMS[form.loanType];
  if (!config || config.programs.length === 0) return null;
  return (
    config.programs.find((p) => p.loanTermMonths === termMonths) ??
    config.programs[0]
  );
}

/* ── Loan Type SVG Icons (lightweight, no React dependency in shared pkg) ── */
const LOAN_ICONS: Record<string, React.ReactNode> = {
  "CRE Bridge": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 34h28" /><path d="M8 34V18l12-8 12 8v16" /><path d="M16 34v-8h8v8" /><rect x="14" y="20" width="4" height="4" /><rect x="22" y="20" width="4" height="4" /></svg>
  ),
  "Manufactured Housing": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="16" width="32" height="16" rx="2" /><path d="M4 22h32" /><path d="M10 16V12h6v4" /><circle cx="12" cy="32" r="2" /><circle cx="28" cy="32" r="2" /><path d="M20 22v10" /></svg>
  ),
  "RV Park": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 30l12-18 12 18" /><path d="M14 30l6-9 6 9" /><path d="M20 12V8" /><path d="M4 30h32" /><path d="M18 30v-4h4v4" /></svg>
  ),
  Multifamily: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="8" width="28" height="26" /><path d="M6 16h28" /><path d="M6 24h28" /><path d="M16 8v26" /><path d="M26 8v26" /><path d="M18 34v-4h4v4" /></svg>
  ),
  "Fix & Flip": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6l14 12H6L20 6z" /><rect x="10" y="18" width="20" height="16" /><rect x="16" y="24" width="8" height="10" /><path d="M30 14l4-4M34 10l-3 1 2 2-1 3" /></svg>
  ),
  "DSCR Rental": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="6" width="24" height="28" rx="2" /><path d="M14 14h12" /><path d="M14 20h12" /><path d="M14 26h8" /><path d="M20 6V2" /><circle cx="30" cy="30" r="6" fill="var(--navy)" /><path d="M30 27v6M28 30h4" /></svg>
  ),
  "New Construction": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 34V14h16v20" /><path d="M10 34h24" /><path d="M18 20h8" /><path d="M18 26h8" /><path d="M22 14V6l-8 8" /><path d="M6 34l4-10" /><path d="M8 24v10" /></svg>
  ),
};

/* ═══ Component ═══ */
export default function LoanIntakePage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [generatedTerms, setGeneratedTerms] = useState<CalculatedTerms | null>(null);
  const [loanCategory, setLoanCategory] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<unknown>(null);

  const [selectedTermMonths, setSelectedTermMonths] = useState(12);
  const [form, setForm] = useState<Record<string, string>>({
    loanType: "",
    propertyAddress: "",
    city: "",
    state: "",
    purchasePrice: "",
    loanAmount: "",
    unitsOrLots: "",
    rehabBudget: "",
    afterRepairValue: "",
    timeline: "",
    creditScore: "",
    dealsInLast24Months: "",
    citizenshipStatus: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    experienceLevel: "",
  });

  const [sliderPercent, setSliderPercent] = useState(75);
  const [thousandsRaw, setThousandsRaw] = useState<Record<string, string>>({
    purchasePrice: "",
    rehabBudget: "",
    afterRepairValue: "",
  });

  const handleThousandsKeyDown =
    (field: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      const raw = thousandsRaw[field] || "";
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const newRaw = raw + e.key;
        const cleaned = String(parseInt(newRaw));
        setThousandsRaw((prev) => ({ ...prev, [field]: cleaned }));
        setForm((prev) => ({
          ...prev,
          [field]: formatCurrencyInput(String(parseInt(cleaned) * 1000)),
        }));
        setError("");
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const newRaw = raw.slice(0, -1);
        setThousandsRaw((prev) => ({ ...prev, [field]: newRaw }));
        setForm((prev) => ({
          ...prev,
          [field]: newRaw
            ? formatCurrencyInput(String(parseInt(newRaw) * 1000))
            : "",
        }));
        setError("");
      }
    };

  const handleThousandsPaste =
    (field: string) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const digits = e.clipboardData.getData("text").replace(/\D/g, "");
      if (digits) {
        const cleaned = String(parseInt(digits));
        setThousandsRaw((prev) => ({ ...prev, [field]: cleaned }));
        setForm((prev) => ({
          ...prev,
          [field]: formatCurrencyInput(String(parseInt(cleaned) * 1000)),
        }));
        setError("");
      }
    };

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      if (field === "phone") value = formatPhone(value);
      if (field === "loanAmount") value = formatCurrencyInput(value);
      setForm((prev) => ({ ...prev, [field]: value }));
      setError("");
    };

  const selectCategory = (cat: string) => {
    setLoanCategory(cat);
    setForm((prev) => ({ ...prev, loanType: "" }));
    setError("");
  };

  const selectLoanType = (id: string) => {
    setForm((prev) => ({ ...prev, loanType: id }));
    setError("");
    setDirection(1);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToCategories = () => {
    setLoanCategory(null);
    setForm((prev) => ({ ...prev, loanType: "" }));
    setError("");
  };

  /* ── Google Places ── */
  const initAutocomplete = useCallback(() => {
    if (!addressInputRef.current || !(window as any).google?.maps?.places) return;
    if (autocompleteRef.current) return;
    const ac = new (window as any).google.maps.places.Autocomplete(
      addressInputRef.current,
      { types: ["address"], componentRestrictions: { country: "us" }, fields: ["address_components", "formatted_address"] },
    );
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.address_components) {
        let streetNumber = "", route = "", city = "", st = "", zip = "";
        for (const c of place.address_components) {
          const t = c.types;
          if (t.includes("street_number")) streetNumber = c.long_name;
          if (t.includes("route")) route = c.long_name;
          if (t.includes("locality")) city = c.long_name;
          if (t.includes("sublocality_level_1") && !city) city = c.long_name;
          if (t.includes("administrative_area_level_1")) st = c.short_name;
          if (t.includes("postal_code")) zip = c.long_name;
        }
        const street = streetNumber ? `${streetNumber} ${route}` : route;
        const display = [street, city, st].filter(Boolean).join(", ") + (zip ? ` ${zip}` : "");
        if (addressInputRef.current) addressInputRef.current.value = display;
        setForm((prev) => ({
          ...prev,
          propertyAddress: street || display || prev.propertyAddress,
          city: city || prev.city,
          state: st || prev.state,
        }));
      }
    });
    autocompleteRef.current = ac;
  }, []);

  useEffect(() => {
    if ((window as any).google?.maps?.places) { initAutocomplete(); return; }
    fetch("/api/maps-config")
      .then((r) => r.json())
      .then(({ key }) => {
        if (!key) return;
        const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existing) { existing.addEventListener("load", () => initAutocomplete(), { once: true }); return; }
        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        s.async = true;
        s.defer = true;
        s.onload = () => initAutocomplete();
        document.head.appendChild(s);
      })
      .catch(() => {});
  }, [initAutocomplete]);

  useEffect(() => {
    if (step === 2) { const t = setTimeout(() => initAutocomplete(), 150); return () => clearTimeout(t); }
    if (autocompleteRef.current && (window as any).google?.maps?.event) {
      (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }
    autocompleteRef.current = null;
    document.querySelectorAll(".pac-container").forEach((el) => el.remove());
  }, [step, initAutocomplete]);

  const hasAutoTerms = !!LOAN_PROGRAMS[form.loanType];
  const isCommercial = COMMERCIAL_TERM_TYPES.includes(form.loanType);
  const totalSteps = 4;
  const showRehab = ["Fix & Flip", "New Construction", "CRE Bridge"].includes(form.loanType);
  const rehabLabel =
    form.loanType === "New Construction" ? "Construction Budget"
    : form.loanType === "Fix & Flip" ? "Rehab Budget"
    : "Rehab / Renovation Budget";
  const unitsLabel = ["Manufactured Housing", "RV Park", "Multifamily"].includes(form.loanType) ? "Number of Units" : "Number of Units / Lots";
  const arvLabel = (LOAN_PROGRAMS[form.loanType]?.arvLabel as string | undefined) || "After Repair Value (ARV)";
  const stepLabels = ["Loan Type", "Deal Details", "Loan Terms", "Contact Info"];

  const totalCost = parseCurrency(form.purchasePrice) + parseCurrency(form.rehabBudget);
  const sliderLoanAmount = totalCost > 0 ? Math.round((totalCost * sliderPercent) / 100) : 0;
  const fillPercent = DEFAULT_SLIDER.max > DEFAULT_SLIDER.min ? ((sliderPercent - DEFAULT_SLIDER.min) / (DEFAULT_SLIDER.max - DEFAULT_SLIDER.min)) * 100 : 0;
  const arvNum = parseCurrency(form.afterRepairValue);
  const ltc = totalCost > 0 ? (sliderLoanAmount / totalCost) * 100 : 0;
  const ltv = arvNum > 0 ? (sliderLoanAmount / arvNum) * 100 : null;
  const equityIn = totalCost - sliderLoanAmount;

  useEffect(() => {
    const tc = parseCurrency(form.purchasePrice) + parseCurrency(form.rehabBudget);
    if (tc > 0) {
      const amount = Math.round((tc * sliderPercent) / 100);
      setForm((prev) => ({ ...prev, loanAmount: formatCurrencyInput(String(amount)) }));
    } else {
      setForm((prev) => ({ ...prev, loanAmount: "" }));
    }
  }, [form.purchasePrice, form.rehabBudget, sliderPercent]);

  function handleTermChange(months: number) {
    setSelectedTermMonths(months);
    if (hasAutoTerms && isCommercial) {
      const program = findProgramForTerm(form, months);
      if (program) setGeneratedTerms(calculateTerms(form, program));
    }
  }

  function validateStep() {
    if (step === 1 && !form.loanType) return "Please select a loan program.";
    if (step === 2) {
      if (!form.purchasePrice) return "Please enter the purchase price.";
      if (!form.loanAmount) return "Please set the loan amount.";
      if (hasAutoTerms) {
        if (!form.afterRepairValue) return "Please enter the after repair value.";
        if (!form.creditScore) return "Please select your credit score range.";
        if (!form.dealsInLast24Months) return "Please select your deal experience.";
        if (!form.citizenshipStatus) return "Please select your citizenship status.";
      }
    }
    if (step === 4) {
      if (!form.firstName) return "Please enter your first name.";
      if (!form.lastName) return "Please enter your last name.";
      if (!form.email) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
      if (!form.phone || form.phone.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
      if (!hasAutoTerms && !form.experienceLevel) return "Please select your experience level.";
    }
    return "";
  }

  function goNext() {
    if (step === 2 && addressInputRef.current) {
      const domValue = addressInputRef.current.value;
      if (domValue && domValue !== form.propertyAddress) setForm((prev) => ({ ...prev, propertyAddress: domValue }));
    }
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step === 2 && hasAutoTerms) {
      let program;
      if (COMMERCIAL_TERM_TYPES.includes(form.loanType)) {
        program = findProgramForTerm(form, selectedTermMonths);
      } else {
        program = qualifyForProgram(form);
      }
      if (program) setGeneratedTerms(calculateTerms(form, program as Record<string, unknown>));
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...form, generatedTerms: generatedTerms || null };
      const res = await fetch("/api/loan-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success ── */
  if (submitted) {
    return (
      <main>
        <section className="dark-zone hero-gradient" style={{ paddingTop: "clamp(160px, 20vw, 220px)", paddingBottom: "clamp(80px, 10vw, 120px)", position: "relative", overflow: "hidden" }}>
          <div className="navy-grid-pattern">{Array.from({ length: 14 }).map((_, i) => (<div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />))}</div>
          <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 28px", borderRadius: "50%", border: "2px solid var(--gold-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className="type-h2" style={{ color: "#fff", marginBottom: 16 }}>Loan Request Submitted</h1>
            <p style={{ color: "var(--navy-text-mid)", fontSize: 17, lineHeight: 1.75, maxWidth: 520, margin: "0 auto 40px" }}>
              {generatedTerms ? (
                <>Thank you, {form.firstName}. Your <strong style={{ color: "#fff" }}>{generatedTerms.programName}</strong> term sheet has been sent to your email.</>
              ) : (
                <>Thank you, {form.firstName}. Our lending team will review your <strong style={{ color: "#fff" }}>{form.loanType}</strong> request and reach out within 24 hours.</>
              )}
            </p>
            <div style={{ maxWidth: 400, margin: "0 auto 40px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
              {generatedTerms && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "var(--navy-text-mid)", fontSize: 13 }}>Program</span>
                  <strong style={{ color: "var(--gold-muted)", fontSize: 14 }}>{generatedTerms.programName}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "var(--navy-text-mid)", fontSize: 13 }}>Loan Amount</span>
                <strong style={{ color: "#fff", fontSize: 14 }}>{generatedTerms ? "$" + generatedTerms.estimatedLoan.toLocaleString() : form.loanAmount}</strong>
              </div>
              {form.city && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px" }}>
                  <span style={{ color: "var(--navy-text-mid)", fontSize: 13 }}>Location</span>
                  <strong style={{ color: "#fff", fontSize: 14 }}>{form.city}{form.state ? `, ${form.state}` : ""}</strong>
                </div>
              )}
            </div>
            <Link href="/lending" className="btn-secondary" style={{ borderRadius: 8 }}>
              <ArrowLeft size={16} /> Back to Lending
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* ── Form ── */
  return (
    <main>
      {/* Hero header */}
      <section className="dark-zone hero-gradient" style={{ paddingTop: "clamp(140px, 18vw, 180px)", paddingBottom: "clamp(40px, 5vw, 60px)", position: "relative", overflow: "hidden" }}>
        <div className="navy-grid-pattern">{Array.from({ length: 14 }).map((_, i) => (<div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />))}</div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
            <SectionLabel light>Submit a Deal</SectionLabel>
          </div>
          <h1 className="type-hero" style={{ color: "#fff", maxWidth: 700, animation: "fadeUp 0.8s 0.1s ease both" }}>
            Apply for{" "}<em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>financing</em>
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75, color: "var(--navy-text-mid)", maxWidth: 520, marginTop: 24, animation: "fadeUp 0.8s 0.2s ease both" }}>
            Select your loan type, size your deal, and get estimated terms in minutes.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center", gap: 40, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gold-muted)", fontWeight: 500 }}><Shield size={14} /> No Credit Pull Required</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gold-muted)", fontWeight: 500 }}><Clock size={14} /> 24hr Turnaround</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--gold-muted)", fontWeight: 500 }}><Phone size={14} /> <a href="tel:+18133275180" style={{ color: "inherit", textDecoration: "none" }}>813.327.5180</a></span>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Progress */}
      <section className="light-zone" style={{ paddingTop: 40, paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ width: "100%", height: 3, background: "var(--border-light)", borderRadius: 3, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ height: "100%", background: "var(--gold)", borderRadius: 3, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)", width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, transition: "all 0.4s",
                  border: step > i + 1 ? "2px solid var(--gold)" : step === i + 1 ? "2px solid var(--gold)" : "2px solid var(--border)",
                  background: step > i + 1 ? "var(--gold)" : "transparent",
                  color: step > i + 1 ? "#fff" : step === i + 1 ? "var(--gold)" : "var(--text-light)",
                  boxShadow: step === i + 1 ? "0 0 0 4px rgba(160,138,78,0.15)" : "none",
                }}>
                  {step > i + 1 ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8l3 3 5-5" /></svg> : <span>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" as const, color: step === i + 1 ? "var(--gold)" : step > i + 1 ? "var(--text-mid)" : "var(--text-light)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form content */}
      <section className="light-zone" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 900 }} ref={formRef}>
          <div key={step} style={{ animation: "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards" }}>

            {/* Step 1 - Loan Type */}
            {step === 1 && (
              <div>
                {!loanCategory && (
                  <div style={{ animation: "fadeUp 0.35s ease" }}>
                    <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>Select Your Loan Program</h2>
                    <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 40 }}>Start by choosing a property type.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      {[
                        { id: "residential", label: "Residential", desc: "Single-family, fix & flip, rental properties, and new construction." },
                        { id: "commercial", label: "Commercial", desc: "Multifamily, CRE bridge, manufactured housing, and RV parks." },
                      ].map((cat) => (
                        <button key={cat.id} type="button" onClick={() => selectCategory(cat.id)} className="card" style={{ padding: "40px 28px", cursor: "pointer", textAlign: "left", border: "1px solid var(--border)", transition: "all 0.35s", background: "var(--white)" }}>
                          <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--text)", marginBottom: 8, letterSpacing: -0.3 }}>{cat.label}</div>
                          <p className="type-body-sm" style={{ color: "var(--text-mid)" }}>{cat.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loanCategory && (
                  <div style={{ animation: "fadeUp 0.35s ease" }}>
                    <button type="button" onClick={backToCategories} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-light)", fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 24, fontFamily: "inherit" }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>{loanCategory === "residential" ? "Residential" : "Commercial"} Programs</h2>
                    <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 40 }}>Choose the financing product that best matches your deal.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                      {(loanCategory === "residential" ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES).map((lt) => (
                        <button key={lt.id} type="button" onClick={() => selectLoanType(lt.id)} className="card" style={{ padding: "32px 24px", cursor: "pointer", textAlign: "left", border: "1px solid var(--border)", transition: "all 0.35s", background: "var(--white)" }}>
                          <div style={{ width: 40, height: 40, marginBottom: 16, color: "var(--gold)" }}>{LOAN_ICONS[lt.id]}</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8, letterSpacing: 0.2 }}>{lt.label}</div>
                          <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.55 }}>{lt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 - Deal Details */}
            {step === 2 && (
              <div>
                <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>Deal Details</h2>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 36 }}>
                  Tell us about the property and your financing needs.{hasAutoTerms ? " We\u2019ll generate your loan terms instantly." : ""}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Property Address</FieldLabel>
                    <input ref={addressInputRef} type="text" placeholder="Start typing an address..." defaultValue={form.propertyAddress} onChange={(e) => { setForm((prev) => ({ ...prev, propertyAddress: e.target.value })); setError(""); }} style={inputStyle} autoComplete="off" />
                  </div>
                  <div>
                    <FieldLabel required>Purchase Price</FieldLabel>
                    <input type="text" placeholder="$0" value={form.purchasePrice} onKeyDown={handleThousandsKeyDown("purchasePrice")} onPaste={handleThousandsPaste("purchasePrice")} onChange={() => {}} style={inputStyle} />
                    <span style={hintStyle}>Enter in thousands</span>
                  </div>
                  {showRehab && (
                    <div>
                      <FieldLabel>{rehabLabel}</FieldLabel>
                      <input type="text" placeholder="$0" value={form.rehabBudget} onKeyDown={handleThousandsKeyDown("rehabBudget")} onPaste={handleThousandsPaste("rehabBudget")} onChange={() => {}} style={inputStyle} />
                      <span style={hintStyle}>Enter in thousands</span>
                    </div>
                  )}
                </div>

                {/* Slider */}
                {parseCurrency(form.purchasePrice) >= 100000 && (
                  <div style={{ background: "rgba(160,138,78,0.06)", border: "1px solid rgba(160,138,78,0.2)", borderRadius: 12, padding: "28px 24px", margin: "20px 0" }}>
                    <FieldLabel required>Loan Amount Requested</FieldLabel>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 400, color: "var(--text)", lineHeight: 1.1, marginBottom: 8, letterSpacing: -1 }}>
                      ${sliderLoanAmount.toLocaleString("en-US")}
                    </div>
                    <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(160,138,78,0.15)", border: "1px solid rgba(160,138,78,0.3)", borderRadius: 6, color: "var(--gold)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                      {sliderPercent}% of Total Cost
                    </div>
                    <input
                      type="range"
                      min={DEFAULT_SLIDER.min}
                      max={DEFAULT_SLIDER.max}
                      step={1}
                      value={sliderPercent}
                      onChange={(e) => setSliderPercent(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--gold)", height: 6, cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-light)" }}>{DEFAULT_SLIDER.min}%</span>
                      <span style={{ fontSize: 11, color: "var(--text-light)" }}>{DEFAULT_SLIDER.max}%</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 16, marginBottom: 20 }}>
                      Total project cost: ${totalCost.toLocaleString("en-US")}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      <MetricPill value={`${ltc.toFixed(1)}%`} label="Loan-to-Cost" variant={ltc <= 75 ? "green" : ltc <= 85 ? "amber" : "red"} />
                      <MetricPill value={ltv !== null ? `${ltv.toFixed(1)}%` : "\u2014"} label="Loan-to-ARV" variant={ltv === null ? "default" : ltv <= 65 ? "green" : ltv <= 75 ? "amber" : "red"} />
                      <MetricPill value={`$${equityIn.toLocaleString("en-US")}`} label="Equity In" variant="default" />
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {!hasAutoTerms && (
                    <div>
                      <FieldLabel>{unitsLabel}</FieldLabel>
                      <input type="text" placeholder="e.g. 24" value={form.unitsOrLots} onChange={set("unitsOrLots")} style={inputStyle} />
                    </div>
                  )}
                  {hasAutoTerms && (
                    <div>
                      <FieldLabel required>{arvLabel}</FieldLabel>
                      <input type="text" placeholder="$0" value={form.afterRepairValue} onKeyDown={handleThousandsKeyDown("afterRepairValue")} onPaste={handleThousandsPaste("afterRepairValue")} onChange={() => {}} style={inputStyle} />
                      <span style={hintStyle}>Enter in thousands</span>
                    </div>
                  )}
                  <div>
                    <FieldLabel>Timeline to Close</FieldLabel>
                    <select value={form.timeline} onChange={set("timeline")} style={inputStyle}>
                      <option value="">Select Timeline</option>
                      {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {hasAutoTerms && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "36px 0 12px" }}>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: 2 }}>Borrower Profile</span>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-mid)", marginBottom: 20 }}>This determines your loan program and rate.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <FieldLabel required>Credit Score Range</FieldLabel>
                        <select value={form.creditScore} onChange={set("creditScore")} style={inputStyle}>
                          <option value="">Select Range</option>
                          {CREDIT_SCORE_RANGES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>Deals in Last 24 Months</FieldLabel>
                        <select value={form.dealsInLast24Months} onChange={set("dealsInLast24Months")} style={inputStyle}>
                          <option value="">Select Experience</option>
                          {DEALS_24_MONTHS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>Citizenship / Residency</FieldLabel>
                        <select value={form.citizenshipStatus} onChange={set("citizenshipStatus")} style={inputStyle}>
                          <option value="">Select Status</option>
                          {CITIZENSHIP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3 - Loan Terms */}
            {step === 3 && (
              <div>
                {hasAutoTerms && generatedTerms ? (
                  <>
                    <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>Your Estimated Loan Terms</h2>
                    <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 32 }}>Based on your deal and borrower profile, you qualify for our <strong>{generatedTerms.programName}</strong>.</p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 24px", background: "rgba(160,138,78,0.1)", border: "1px solid rgba(160,138,78,0.3)", borderRadius: 8, color: "var(--gold)", fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 28 }}>
                      {generatedTerms.programName}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                      <TermMetric value={`${generatedTerms.interestRate}%`} label="Interest Rate" note={generatedTerms.rateType} />
                      <TermMetric value={`${generatedTerms.originationPoints}%`} label="Origination" note={generatedTerms.originationFee ? `$${generatedTerms.originationFee.toLocaleString()}` : "\u2014"} />
                      <TermMetric value={`${generatedTerms.loanTermMonths} Mo`} label="Loan Term" note={isCommercial && generatedTerms.exitPoints > 0 ? `${generatedTerms.exitPoints} exit pts` : generatedTerms.termNote} />
                    </div>

                    {isCommercial && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 12, color: "var(--text-light)", textTransform: "uppercase" as const, letterSpacing: 1.5, fontWeight: 500, marginBottom: 12 }}>Select Loan Term</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {TERM_OPTIONS.map((opt) => (
                            <button key={opt.months} type="button" onClick={() => handleTermChange(opt.months)}
                              style={{ padding: "16px 12px", background: selectedTermMonths === opt.months ? "rgba(160,138,78,0.1)" : "var(--white)", border: selectedTermMonths === opt.months ? "2px solid var(--gold)" : "1px solid var(--border)", borderRadius: 8, cursor: "pointer", textAlign: "center", fontFamily: "inherit", transition: "all 0.3s" }}>
                              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: selectedTermMonths === opt.months ? "var(--gold)" : "var(--text-light)" }}>{opt.exitLabel}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
                      <div style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: 1.5, borderBottom: "1px solid var(--border-light)" }}>Estimated Loan Details</div>
                      <div>
                        {generatedTerms.maxLoan !== null && <DetailRow label="Maximum Loan Amount" value={`$${generatedTerms.maxLoan.toLocaleString()}`} />}
                        <DetailRow label="Estimated Loan Amount" value={`$${generatedTerms.estimatedLoan.toLocaleString()}`} highlight />
                        {generatedTerms.originationFee !== null && <DetailRow label={`Origination Fee (${generatedTerms.originationPoints}%)`} value={`$${generatedTerms.originationFee.toLocaleString()}`} />}
                        {generatedTerms.monthlyInterest !== null && <DetailRow label="Est. Monthly Interest" value={`$${generatedTerms.monthlyInterest.toLocaleString()}`} />}
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: "var(--text-light)", lineHeight: 1.6, fontStyle: "italic", marginTop: 12 }}>
                      These terms are estimates based on the information provided and are subject to full underwriting review, property appraisal, and final approval.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>Personalized Terms</h2>
                    <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 40 }}>Our lending team will prepare custom terms tailored to your deal.</p>
                    <div className="card" style={{ textAlign: "center", padding: "56px 40px", maxWidth: 560, margin: "0 auto" }}>
                      <div style={{ width: 48, height: 48, margin: "0 auto 24px", color: "var(--gold)" }}>
                        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="32" height="40" rx="2" /><path d="M16 14h16M16 22h16M16 30h10" /></svg>
                      </div>
                      <h3 className="type-h3" style={{ color: "var(--text)", marginBottom: 16 }}>Custom {form.loanType} Terms</h3>
                      <p className="type-body-sm" style={{ color: "var(--text-mid)", marginBottom: 24 }}>A member of our lending team will reach out with a personalized term sheet within <strong>24 hours</strong>.</p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
                        {["Competitive rates", "Flexible structures", "Fast closings"].map((f) => (
                          <span key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-mid)", fontWeight: 500 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--gold)" strokeWidth="1.5"><path d="M3 8l4 4 6-6" /></svg>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4 - Contact Info */}
            {step === 4 && (
              <div>
                <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 8 }}>Contact Information</h2>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 36 }}>
                  {generatedTerms ? "Enter your details to receive your term sheet via email." : "Let us know how to reach you."}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 40, alignItems: "start" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <FieldLabel required>First Name</FieldLabel>
                      <input type="text" placeholder="John" value={form.firstName} onChange={set("firstName")} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel required>Last Name</FieldLabel>
                      <input type="text" placeholder="Smith" value={form.lastName} onChange={set("lastName")} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <input type="email" placeholder="john@company.com" value={form.email} onChange={set("email")} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel required>Phone</FieldLabel>
                      <input type="tel" placeholder="(813) 327-5180" value={form.phone} onChange={set("phone")} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel>Company <span style={{ color: "var(--text-light)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Optional)</span></FieldLabel>
                      <input type="text" placeholder="Company Name" value={form.company} onChange={set("company")} style={inputStyle} />
                    </div>
                    {!hasAutoTerms && (
                      <div>
                        <FieldLabel required>Real Estate Experience</FieldLabel>
                        <select value={form.experienceLevel} onChange={set("experienceLevel")} style={inputStyle}>
                          <option value="">Select Experience Level</option>
                          {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Sidebar summary */}
                  <div className="card" style={{ padding: 0, position: "sticky", top: 100, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px", fontSize: 12, fontWeight: 600, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: 1.5, borderBottom: "1px solid var(--border-light)" }}>
                      {generatedTerms ? "Term Sheet Summary" : "Deal Summary"}
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      {generatedTerms ? (
                        <>
                          <DetailRow label="Program" value={generatedTerms.programName} highlight />
                          <DetailRow label="Est. Loan" value={`$${generatedTerms.estimatedLoan.toLocaleString()}`} highlight />
                          <DetailRow label="Rate" value={`${generatedTerms.interestRate}% ${generatedTerms.rateType}`} />
                          <DetailRow label="Points" value={`${generatedTerms.originationPoints}%`} />
                          <DetailRow label="Term" value={`${generatedTerms.loanTermMonths} Months`} />
                          {generatedTerms.monthlyInterest && <DetailRow label="Monthly Interest" value={`$${generatedTerms.monthlyInterest.toLocaleString()}`} />}
                        </>
                      ) : (
                        <>
                          <DetailRow label="Loan Program" value={form.loanType || "\u2014"} />
                          {form.loanAmount && <DetailRow label="Loan Amount" value={form.loanAmount} highlight />}
                          {form.purchasePrice && <DetailRow label="Purchase Price" value={form.purchasePrice} />}
                          {form.city && <DetailRow label="Location" value={`${form.city}${form.state ? `, ${form.state}` : ""}`} />}
                          {form.timeline && <DetailRow label="Timeline" value={form.timeline} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 8, color: "#dc2626", fontSize: 14, fontWeight: 500, marginTop: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              {error}
            </div>
          )}

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border-light)" }}>
            {step > 1 ? (
              <button type="button" onClick={goBack} className="btn-outline-light" style={{ height: 48, padding: "0 24px", borderRadius: 8 }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <Link href="/lending" className="btn-outline-light" style={{ height: 48, padding: "0 24px", borderRadius: 8, textDecoration: "none" }}>
                <ArrowLeft size={16} /> Back to Lending
              </Link>
            )}
            {step === 1 ? null : step < totalSteps ? (
              <button type="button" onClick={goNext} className="btn-primary-light" style={{ height: 48, padding: "0 32px", borderRadius: 8, fontSize: 13 }}>
                {step === 3 && generatedTerms ? "Get My Term Sheet" : "Continue"} <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary-light" style={{ height: 48, padding: "0 32px", borderRadius: 8, fontSize: 13, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting..." : generatedTerms ? "Submit & Email Term Sheet" : "Submit Loan Request"} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ── Sub-components ── */

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
      {children} {required && <span style={{ color: "var(--gold)" }}>*</span>}
    </label>
  );
}

function MetricPill({ value, label, variant }: { value: string; label: string; variant: "green" | "amber" | "red" | "default" }) {
  const colors = {
    green: { border: "rgba(74,222,128,0.3)", bg: "rgba(74,222,128,0.06)", text: "#4ade80" },
    amber: { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.06)", text: "#f59e0b" },
    red: { border: "rgba(239,68,68,0.3)", bg: "rgba(239,68,68,0.06)", text: "#ef4444" },
    default: { border: "var(--border)", bg: "var(--white)", text: "var(--text)" },
  };
  const c = colors[variant];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "16px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-light)", textTransform: "uppercase" as const, letterSpacing: 0.5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function TermMetric({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="card" style={{ padding: "28px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 400, color: "var(--gold)", lineHeight: 1.1, marginBottom: 8, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-light)" }}>{note}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid var(--border-light)" }}>
      <span style={{ fontSize: 12, color: "var(--text-light)", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{label}</span>
      <strong style={{ fontSize: highlight ? 16 : 14, color: highlight ? "var(--gold)" : "var(--text)", fontWeight: highlight ? 700 : 500, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{value}</strong>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--white)",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.3s, box-shadow 0.3s",
};

const hintStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-light)",
  marginTop: 6,
};
