"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LOAN_TYPES,
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
import { ArrowRight, ArrowLeft, Check, MapPin, DollarSign, User, FileText, Sparkles } from "lucide-react";

/* ── Helpers (unchanged) ── */
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

/* ── Loan Type SVG Icons ── */
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
  const [screen, setScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [generatedTerms, setGeneratedTerms] = useState<CalculatedTerms | null>(null);
  const [selectedTermMonths, setSelectedTermMonths] = useState(12);
  const [animateIn, setAnimateIn] = useState(true);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<unknown>(null);

  const [form, setForm] = useState<Record<string, string>>({
    loanType: "", propertyAddress: "", city: "", state: "",
    purchasePrice: "", loanAmount: "", unitsOrLots: "",
    rehabBudget: "", afterRepairValue: "", timeline: "",
    creditScore: "", dealsInLast24Months: "", citizenshipStatus: "",
    firstName: "", lastName: "", email: "", phone: "", company: "", experienceLevel: "",
    statedNetWorth: "", statedLiquidity: "",
  });

  const [sliderPercent, setSliderPercent] = useState(75);
  const [thousandsRaw, setThousandsRaw] = useState<Record<string, string>>({
    purchasePrice: "", rehabBudget: "", afterRepairValue: "",
  });

  /* ── Derived ── */
  const hasAutoTerms = !!LOAN_PROGRAMS[form.loanType];
  const isCommercial = COMMERCIAL_TERM_TYPES.includes(form.loanType);
  const showRehab = ["Fix & Flip", "New Construction", "CRE Bridge"].includes(form.loanType);
  const rehabLabel = form.loanType === "New Construction" ? "Construction Budget" : form.loanType === "Fix & Flip" ? "Rehab Budget" : "Rehab / Renovation Budget";
  const arvLabel = (LOAN_PROGRAMS[form.loanType]?.arvLabel as string | undefined) || "After Repair Value (ARV)";
  const totalCost = parseCurrency(form.purchasePrice) + parseCurrency(form.rehabBudget);
  const sliderLoanAmount = totalCost > 0 ? Math.round((totalCost * sliderPercent) / 100) : 0;
  const arvNum = parseCurrency(form.afterRepairValue);
  const ltc = totalCost > 0 ? (sliderLoanAmount / totalCost) * 100 : 0;
  const ltv = arvNum > 0 ? (sliderLoanAmount / arvNum) * 100 : null;
  const equityIn = totalCost - sliderLoanAmount;

  const screens = ["loanType", "address", "dealSizing", ...(hasAutoTerms ? ["borrowerProfile"] : []), "terms", "contact"];
  const totalScreens = screens.length;
  const currentScreenId = screens[screen] || "loanType";
  const progressPercent = Math.round(((screen + 1) / totalScreens) * 100);

  /* ── Thousands input (preserved) ── */
  const handleThousandsKeyDown = (field: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const raw = thousandsRaw[field] || "";
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const newRaw = raw + e.key;
      const cleaned = String(parseInt(newRaw));
      setThousandsRaw((prev) => ({ ...prev, [field]: cleaned }));
      setForm((prev) => ({ ...prev, [field]: formatCurrencyInput(String(parseInt(cleaned) * 1000)) }));
      setError("");
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const newRaw = raw.slice(0, -1);
      setThousandsRaw((prev) => ({ ...prev, [field]: newRaw }));
      setForm((prev) => ({ ...prev, [field]: newRaw ? formatCurrencyInput(String(parseInt(newRaw) * 1000)) : "" }));
      setError("");
    }
  };

  const handleThousandsPaste = (field: string) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) {
      const cleaned = String(parseInt(digits));
      setThousandsRaw((prev) => ({ ...prev, [field]: cleaned }));
      setForm((prev) => ({ ...prev, [field]: formatCurrencyInput(String(parseInt(cleaned) * 1000)) }));
      setError("");
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (field === "phone") value = formatPhone(value);
    if (field === "loanAmount") value = formatCurrencyInput(value);
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  /* ── Google Places (preserved) ── */
  const initAutocomplete = useCallback(() => {
    if (!addressInputRef.current || !(window as any).google?.maps?.places) return;
    if (autocompleteRef.current) return;
    const ac = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"], componentRestrictions: { country: "us" }, fields: ["address_components", "formatted_address"],
    });
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
        setForm((prev) => ({ ...prev, propertyAddress: street || display || prev.propertyAddress, city: city || prev.city, state: st || prev.state }));
        setTimeout(() => advance(), 400);
      }
    });
    autocompleteRef.current = ac;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((window as any).google?.maps?.places) { initAutocomplete(); return; }
    fetch("/api/maps-config").then((r) => r.json()).then(({ key }) => {
      if (!key) return;
      const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existing) { existing.addEventListener("load", () => initAutocomplete(), { once: true }); return; }
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      s.async = true; s.defer = true;
      s.onload = () => initAutocomplete();
      document.head.appendChild(s);
    }).catch(() => {});
  }, [initAutocomplete]);

  useEffect(() => {
    if (currentScreenId === "address") {
      const t = setTimeout(() => { initAutocomplete(); addressInputRef.current?.focus(); }, 350);
      return () => clearTimeout(t);
    }
    if (autocompleteRef.current && (window as any).google?.maps?.event) {
      (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }
    autocompleteRef.current = null;
    document.querySelectorAll(".pac-container").forEach((el) => el.remove());
  }, [screen, initAutocomplete, currentScreenId]);

  /* ── Slider sync ── */
  useEffect(() => {
    const tc = parseCurrency(form.purchasePrice) + parseCurrency(form.rehabBudget);
    if (tc > 0) {
      const amount = Math.round((tc * sliderPercent) / 100);
      setForm((prev) => ({ ...prev, loanAmount: formatCurrencyInput(String(amount)) }));
    } else {
      setForm((prev) => ({ ...prev, loanAmount: "" }));
    }
  }, [form.purchasePrice, form.rehabBudget, sliderPercent]);

  /* ── Navigation ── */
  function advance() {
    if (currentScreenId === "address" && addressInputRef.current) {
      const domValue = addressInputRef.current.value;
      if (domValue && domValue !== form.propertyAddress) setForm((prev) => ({ ...prev, propertyAddress: domValue }));
    }
    const err = validateScreen();
    if (err) { setError(err); return; }

    // Generate terms when advancing past relevant screens
    if ((currentScreenId === "dealSizing" || currentScreenId === "borrowerProfile") && hasAutoTerms) {
      let program;
      if (COMMERCIAL_TERM_TYPES.includes(form.loanType)) {
        program = findProgramForTerm(form, selectedTermMonths);
      } else {
        program = qualifyForProgram(form);
      }
      if (program) setGeneratedTerms(calculateTerms(form, program as Record<string, unknown>));
    }

    setDirection(1);
    setAnimateIn(false);
    setTimeout(() => { setScreen((s) => Math.min(s + 1, totalScreens - 1)); setAnimateIn(true); }, 50);
  }

  function goBack() {
    setDirection(-1);
    setAnimateIn(false);
    setTimeout(() => { setScreen((s) => Math.max(s - 1, 0)); setAnimateIn(true); }, 50);
    setError("");
  }

  function validateScreen() {
    if (currentScreenId === "loanType" && !form.loanType) return "Select a loan type to continue.";
    if (currentScreenId === "dealSizing") {
      if (!form.purchasePrice) return "Enter the purchase price.";
      if (!form.loanAmount) return "Set the loan amount.";
      if (hasAutoTerms && !form.afterRepairValue) return "Enter the after repair value.";
    }
    if (currentScreenId === "borrowerProfile") {
      if (!form.creditScore) return "Select your credit score range.";
      if (!form.dealsInLast24Months) return "Select your deal experience.";
      if (!form.citizenshipStatus) return "Select your citizenship status.";
    }
    if (currentScreenId === "contact") {
      if (!form.firstName) return "Enter your first name.";
      if (!form.lastName) return "Enter your last name.";
      if (!form.email) return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
      if (!form.phone || form.phone.replace(/\D/g, "").length < 10) return "Enter a valid phone number.";
      if (!hasAutoTerms && !form.experienceLevel) return "Select your experience level.";
    }
    return "";
  }

  function handleTermChange(months: number) {
    setSelectedTermMonths(months);
    if (hasAutoTerms && isCommercial) {
      const program = findProgramForTerm(form, months);
      if (program) setGeneratedTerms(calculateTerms(form, program));
    }
  }

  async function handleSubmit() {
    const err = validateScreen();
    if (err) { setError(err); return; }
    setSubmitting(true); setError("");
    try {
      const payload = { ...form, generatedTerms: generatedTerms || null };
      const res = await fetch("/api/loan-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setSubmitting(false); }
  }

  /* ── Keyboard ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" && currentScreenId !== "loanType" && currentScreenId !== "address") {
        e.preventDefault();
        if (currentScreenId === "contact") handleSubmit();
        else advance();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  /* ═══ RENDER ═══ */

  if (submitted) {
    return (
      <main className="apply-fullscreen dark-zone hero-gradient">
        <div className="navy-grid-pattern">{Array.from({ length: 14 }).map((_, i) => (<div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />))}</div>
        <div className="apply-screen-inner" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="apply-success-check"><Check size={32} strokeWidth={2.5} /></div>
          <h1 className="type-h2" style={{ color: "#fff", marginBottom: 16 }}>Deal Submitted</h1>
          <p style={{ color: "var(--navy-text-mid)", fontSize: 17, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 40px" }}>
            {generatedTerms
              ? <>Your <strong style={{ color: "#fff" }}>{generatedTerms.programName}</strong> term sheet has been sent to <strong style={{ color: "#fff" }}>{form.email}</strong>.</>
              : <>Our lending team will review your <strong style={{ color: "#fff" }}>{form.loanType}</strong> request and reach out within 24 hours.</>}
          </p>
          <div style={{ maxWidth: 380, margin: "0 auto 40px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
            {generatedTerms && <div className="apply-success-row"><span>Program</span><strong style={{ color: "var(--gold-muted)" }}>{generatedTerms.programName}</strong></div>}
            <div className="apply-success-row"><span>Loan Amount</span><strong>{generatedTerms ? "$" + generatedTerms.estimatedLoan.toLocaleString() : form.loanAmount}</strong></div>
            {form.city && <div className="apply-success-row" style={{ borderBottom: "none" }}><span>Location</span><strong>{form.city}{form.state ? `, ${form.state}` : ""}</strong></div>}
          </div>
          <Link href="/lending" className="btn-secondary" style={{ borderRadius: 8 }}><ArrowLeft size={16} /> Back to Lending</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Fixed progress bar */}
      <div className="apply-progress-bar"><div className="apply-progress-fill" style={{ width: `${progressPercent}%` }} /></div>

      {/* Step nav */}
      <div className="apply-step-nav">
        <div className="apply-nav-left">
          {screen > 0 ? (
            <button type="button" onClick={goBack} className="apply-back-btn"><ArrowLeft size={16} /> Back</button>
          ) : (
            <Link href="/lending" className="apply-back-btn"><ArrowLeft size={16} /> Lending</Link>
          )}
        </div>
        <div className="apply-step-dots">
          {screens.map((s, i) => (
            <div key={s} className={`apply-step-dot${i === screen ? " active" : ""}${i < screen ? " done" : ""}`} />
          ))}
        </div>
        <div className="apply-nav-right">
          <span className="apply-progress-pct">{progressPercent}%</span>
        </div>
      </div>

      <main className="apply-fullscreen light-zone">
        {error && <div className="apply-error">{error}</div>}

        <div className={`apply-screen-inner ${animateIn ? "apply-slide-in" : "apply-slide-out"}`} key={screen}>

          {/* Screen: Loan Type */}
          {currentScreenId === "loanType" && (
            <div className="apply-screen-content">
              <div className="apply-screen-header">
                <h1 className="apply-screen-title">What are you financing?</h1>
              </div>
              <div className="apply-screen-label" style={{ marginBottom: 12 }}>Commercial</div>
              <div className="apply-type-grid">
                {COMMERCIAL_TYPES.map((lt) => (
                  <button key={lt.id} type="button"
                    className={`apply-type-card${form.loanType === lt.id ? " selected" : ""}`}
                    onClick={() => { setForm((prev) => ({ ...prev, loanType: lt.id })); setError(""); setTimeout(() => advance(), 200); }}>
                    <div className="apply-type-icon">{LOAN_ICONS[lt.id]}</div>
                    <div className="apply-type-name">{lt.label}</div>
                  </button>
                ))}
              </div>
              <div className="apply-screen-label" style={{ marginBottom: 12, marginTop: 28 }}>Residential</div>
              <div className="apply-type-grid">
                {RESIDENTIAL_TYPES.map((lt) => (
                  <button key={lt.id} type="button"
                    className={`apply-type-card${form.loanType === lt.id ? " selected" : ""}`}
                    onClick={() => { setForm((prev) => ({ ...prev, loanType: lt.id })); setError(""); setTimeout(() => advance(), 200); }}>
                    <div className="apply-type-icon">{LOAN_ICONS[lt.id]}</div>
                    <div className="apply-type-name">{lt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Screen: Address */}
          {currentScreenId === "address" && (
            <div className="apply-screen-content apply-screen-centered">
              <div className="apply-screen-header">
                <h1 className="apply-screen-title">Where is the property?</h1>
              </div>
              <div className="apply-address-wrap">
                <MapPin size={20} className="apply-address-icon" />
                <input ref={addressInputRef} type="text" className="apply-address-input" placeholder="Enter property address..." defaultValue={form.propertyAddress} onChange={(e) => { setForm((prev) => ({ ...prev, propertyAddress: e.target.value })); setError(""); }} autoComplete="off" autoFocus />
              </div>
              <button type="button" onClick={advance} className="apply-continue-btn" style={{ marginTop: 24 }}>Continue <ArrowRight size={16} /></button>
              <p className="apply-hint">Press Enter to skip if address is not known yet</p>
            </div>
          )}

          {/* Screen: Deal Sizing */}
          {currentScreenId === "dealSizing" && (
            <div className="apply-screen-content">
              <div className="apply-screen-header">
                <h1 className="apply-screen-title">Size your deal</h1>
              </div>
              <div className="apply-deal-grid">
                <div>
                  <label className="apply-field-label">Purchase Price <span className="apply-required">*</span></label>
                  <input type="text" placeholder="$0" value={form.purchasePrice} onKeyDown={handleThousandsKeyDown("purchasePrice")} onPaste={handleThousandsPaste("purchasePrice")} onChange={() => {}} className="apply-input" />
                  <span className="apply-field-hint">Enter in thousands (e.g. 500 = $500,000)</span>
                </div>
                {showRehab && (
                  <div>
                    <label className="apply-field-label">{rehabLabel}</label>
                    <input type="text" placeholder="$0" value={form.rehabBudget} onKeyDown={handleThousandsKeyDown("rehabBudget")} onPaste={handleThousandsPaste("rehabBudget")} onChange={() => {}} className="apply-input" />
                    <span className="apply-field-hint">Enter in thousands</span>
                  </div>
                )}
                {hasAutoTerms && (
                  <div>
                    <label className="apply-field-label">{arvLabel} <span className="apply-required">*</span></label>
                    <input type="text" placeholder="$0" value={form.afterRepairValue} onKeyDown={handleThousandsKeyDown("afterRepairValue")} onPaste={handleThousandsPaste("afterRepairValue")} onChange={() => {}} className="apply-input" />
                    <span className="apply-field-hint">Enter in thousands</span>
                  </div>
                )}
                <div>
                  <label className="apply-field-label">Timeline to Close</label>
                  <select value={form.timeline} onChange={set("timeline")} className="apply-input">
                    <option value="">Select Timeline</option>
                    {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {parseCurrency(form.purchasePrice) >= 100000 && (
                <div className="apply-slider-zone">
                  <label className="apply-field-label">Loan Amount <span className="apply-required">*</span></label>
                  <div className="apply-slider-amount">${sliderLoanAmount.toLocaleString("en-US")}</div>
                  <div className="apply-slider-pct-badge">{sliderPercent}% of Total Cost</div>
                  <input type="range" min={DEFAULT_SLIDER.min} max={DEFAULT_SLIDER.max} step={1} value={sliderPercent} onChange={(e) => setSliderPercent(Number(e.target.value))} className="apply-slider" />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span className="apply-field-hint">{DEFAULT_SLIDER.min}%</span>
                    <span className="apply-field-hint">{DEFAULT_SLIDER.max}%</span>
                  </div>
                  <div className="apply-metrics-row">
                    <div className={`apply-metric ${ltc <= 75 ? "green" : ltc <= 85 ? "amber" : "red"}`}>
                      <span className="apply-metric-value">{ltc.toFixed(1)}%</span>
                      <span className="apply-metric-label">LTC</span>
                    </div>
                    <div className={`apply-metric ${ltv === null ? "" : ltv <= 65 ? "green" : ltv <= 75 ? "amber" : "red"}`}>
                      <span className="apply-metric-value">{ltv !== null ? `${ltv.toFixed(1)}%` : "\u2014"}</span>
                      <span className="apply-metric-label">LTV</span>
                    </div>
                    <div className="apply-metric">
                      <span className="apply-metric-value">${equityIn.toLocaleString("en-US")}</span>
                      <span className="apply-metric-label">Equity In</span>
                    </div>
                  </div>
                </div>
              )}
              <button type="button" onClick={advance} className="apply-continue-btn" style={{ marginTop: 24 }}>Continue <ArrowRight size={16} /></button>
            </div>
          )}

          {/* Screen: Borrower Profile (conditional) */}
          {currentScreenId === "borrowerProfile" && (
            <div className="apply-screen-content apply-screen-centered">
              <div className="apply-screen-header">
                <h1 className="apply-screen-title">Your borrower profile</h1>
                <p className="apply-screen-subtitle">This determines your loan program and rate.</p>
              </div>
              <div className="apply-pills-section">
                <label className="apply-field-label">Credit Score Range <span className="apply-required">*</span></label>
                <div className="apply-pill-group">
                  {CREDIT_SCORE_RANGES.map((c) => (
                    <button key={c} type="button" className={`apply-pill${form.creditScore === c ? " selected" : ""}`}
                      onClick={() => { setForm((prev) => ({ ...prev, creditScore: c })); setError(""); }}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="apply-pills-section">
                <label className="apply-field-label">Deals in Last 24 Months <span className="apply-required">*</span></label>
                <div className="apply-pill-group">
                  {DEALS_24_MONTHS.map((d) => (
                    <button key={d} type="button" className={`apply-pill${form.dealsInLast24Months === d ? " selected" : ""}`}
                      onClick={() => { setForm((prev) => ({ ...prev, dealsInLast24Months: d })); setError(""); }}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="apply-pills-section">
                <label className="apply-field-label">Citizenship / Residency <span className="apply-required">*</span></label>
                <div className="apply-pill-group">
                  {CITIZENSHIP_OPTIONS.map((c) => (
                    <button key={c} type="button" className={`apply-pill${form.citizenshipStatus === c ? " selected" : ""}`}
                      onClick={() => { setForm((prev) => ({ ...prev, citizenshipStatus: c })); setError(""); }}>{c}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={advance} className="apply-continue-btn" style={{ marginTop: 32 }}>See My Terms <ArrowRight size={16} /></button>
            </div>
          )}

          {/* Screen: Terms */}
          {currentScreenId === "terms" && (
            <div className="apply-screen-content apply-screen-centered">
              {hasAutoTerms && generatedTerms ? (
                <>
                  <div className="apply-screen-header">
                    <div className="apply-terms-badge">{generatedTerms.programName}</div>
                    <h1 className="apply-screen-title">Your estimated terms</h1>
                  </div>
                  <div className="apply-terms-hero">
                    <div className="apply-term-big"><span className="apply-term-big-value">{generatedTerms.interestRate}%</span><span className="apply-term-big-label">Rate ({generatedTerms.rateType})</span></div>
                    <div className="apply-term-big"><span className="apply-term-big-value">{generatedTerms.originationPoints}%</span><span className="apply-term-big-label">Origination</span></div>
                    <div className="apply-term-big"><span className="apply-term-big-value">{generatedTerms.loanTermMonths} Mo</span><span className="apply-term-big-label">Loan Term</span></div>
                  </div>
                  {isCommercial && (
                    <div style={{ marginBottom: 24 }}>
                      <div className="apply-field-label" style={{ marginBottom: 12 }}>Select Loan Term</div>
                      <div className="apply-term-options">
                        {TERM_OPTIONS.map((opt) => (
                          <button key={opt.months} type="button" onClick={() => handleTermChange(opt.months)}
                            className={`apply-term-opt${selectedTermMonths === opt.months ? " selected" : ""}`}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: selectedTermMonths === opt.months ? "var(--gold)" : "var(--text-light)" }}>{opt.exitLabel}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="apply-terms-detail">
                    {generatedTerms.estimatedLoan > 0 && <div className="apply-terms-row"><span>Estimated Loan</span><strong>${generatedTerms.estimatedLoan.toLocaleString()}</strong></div>}
                    {generatedTerms.maxLoan !== null && generatedTerms.maxLoan > 0 && <div className="apply-terms-row"><span>Max Loan</span><strong>${generatedTerms.maxLoan.toLocaleString()}</strong></div>}
                    {generatedTerms.originationFee !== null && <div className="apply-terms-row"><span>Origination Fee</span><strong>${generatedTerms.originationFee.toLocaleString()}</strong></div>}
                    {generatedTerms.monthlyInterest !== null && <div className="apply-terms-row"><span>Monthly Interest</span><strong>${generatedTerms.monthlyInterest.toLocaleString()}</strong></div>}
                  </div>
                  <p className="apply-hint" style={{ marginTop: 16 }}>Estimates subject to full underwriting and approval.</p>
                </>
              ) : (
                <>
                  <div className="apply-screen-header">
                    <h1 className="apply-screen-title">Personalized {form.loanType} terms</h1>
                    <p className="apply-screen-subtitle">Our lending team will prepare custom terms within 24 hours.</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
                    {["Competitive rates", "Flexible structures", "Fast closings"].map((f) => (
                      <span key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-mid)", fontWeight: 500 }}>
                        <Check size={14} style={{ color: "var(--gold)" }} />{f}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <button type="button" onClick={advance} className="apply-continue-btn" style={{ marginTop: 32 }}>
                {generatedTerms ? "Lock These Terms" : "Continue"} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Screen: Contact */}
          {currentScreenId === "contact" && (
            <div className="apply-screen-content">
              <div className="apply-screen-header">
                <h1 className="apply-screen-title">Almost there</h1>
                <p className="apply-screen-subtitle">{generatedTerms ? "Enter your details to receive your term sheet." : "Let us know how to reach you."}</p>
              </div>
              <div className="apply-deal-grid" style={{ maxWidth: 520 }}>
                <div><label className="apply-field-label">First Name <span className="apply-required">*</span></label><input type="text" placeholder="John" value={form.firstName} onChange={set("firstName")} className="apply-input" autoFocus /></div>
                <div><label className="apply-field-label">Last Name <span className="apply-required">*</span></label><input type="text" placeholder="Smith" value={form.lastName} onChange={set("lastName")} className="apply-input" /></div>
                <div><label className="apply-field-label">Email <span className="apply-required">*</span></label><input type="email" placeholder="john@company.com" value={form.email} onChange={set("email")} className="apply-input" /></div>
                <div><label className="apply-field-label">Phone <span className="apply-required">*</span></label><input type="tel" placeholder="(813) 327-5180" value={form.phone} onChange={set("phone")} className="apply-input" /></div>
                <div><label className="apply-field-label">Company <span style={{ color: "var(--text-light)", fontWeight: 400 }}>(Optional)</span></label><input type="text" placeholder="Company Name" value={form.company} onChange={set("company")} className="apply-input" /></div>
                {!hasAutoTerms && (
                  <div><label className="apply-field-label">Experience <span className="apply-required">*</span></label><select value={form.experienceLevel} onChange={set("experienceLevel")} className="apply-input"><option value="">Select Level</option>{EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
                )}
                <div>
                  <label className="apply-field-label">Stated Net Worth</label>
                  <select value={form.statedNetWorth} onChange={set("statedNetWorth")} className="apply-input">
                    <option value="">Select Range</option>
                    <option value="Under $250K">Under $250K</option>
                    <option value="$250K - $500K">$250K - $500K</option>
                    <option value="$500K - $1M">$500K - $1M</option>
                    <option value="$1M - $2.5M">$1M - $2.5M</option>
                    <option value="$2.5M - $5M">$2.5M - $5M</option>
                    <option value="$5M - $10M">$5M - $10M</option>
                    <option value="$10M+">$10M+</option>
                  </select>
                </div>
                <div>
                  <label className="apply-field-label">Stated Liquidity</label>
                  <select value={form.statedLiquidity} onChange={set("statedLiquidity")} className="apply-input">
                    <option value="">Select Range</option>
                    <option value="Under $50K">Under $50K</option>
                    <option value="$50K - $100K">$50K - $100K</option>
                    <option value="$100K - $250K">$100K - $250K</option>
                    <option value="$250K - $500K">$250K - $500K</option>
                    <option value="$500K - $1M">$500K - $1M</option>
                    <option value="$1M - $2.5M">$1M - $2.5M</option>
                    <option value="$2.5M+">$2.5M+</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={handleSubmit} disabled={submitting} className="apply-submit-btn" style={{ marginTop: 32 }}>
                {submitting ? "Submitting..." : generatedTerms ? "Get My Term Sheet" : "Submit My Deal"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
