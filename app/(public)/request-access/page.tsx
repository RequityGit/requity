// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

export default function RequestAccessPage() {
  const { lang } = useLanguage();
  const t = translations.requestAccess[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];
  // Step: 'form' → 'profile' → 'complete'
  const [step, setStep] = useState('form');

  // Step 1: Basic contact info
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Step 2: Investor profile
  const [profile, setProfile] = useState({
    accreditedStatus: '',
    targetInvestment: '',
    privateOfferExperience: '',
    investmentInterests: [],
    state: '',
    investmentTimeline: '',
    entityType: '',
    referralSource: '',
    additionalInfo: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    reveals.forEach(el => observer.observe(el));

    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    mobileToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));
    navLinks?.querySelectorAll('a').forEach(l =>
      l.addEventListener('click', () => navLinks?.classList.remove('open'))
    );

    return () => observer.disconnect();
  }, []);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const setProf = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  function toggleInterest(value) {
    setProfile(prev => ({
      ...prev,
      investmentInterests: prev.investmentInterests.includes(value)
        ? prev.investmentInterests.filter(v => v !== value)
        : [...prev.investmentInterests, value],
    }));
    if (error) setError('');
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function handlePhoneChange(e) {
    const formatted = formatPhone(e.target.value);
    setForm(prev => ({ ...prev, phone: formatted }));
    if (error) setError('');
  }

  function validateForm() {
    if (!form.firstName.trim()) return 'Please enter your first name.';
    if (!form.lastName.trim()) return 'Please enter your last name.';
    if (!form.email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) return 'Please enter a valid phone number.';
    return null;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setError('');
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/investor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStep('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/investor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          ...profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStep('complete');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const investmentInterestOptions = [
    { value: 'Individual Equity Offerings', label: 'Individual Equity Offerings' },
    { value: 'Individual Debt Offerings', label: 'Individual Debt Offerings' },
    { value: 'Debt Fund', label: 'Debt Fund' },
    { value: 'Equity Fund', label: 'Equity Fund' },
  ];

  // ─── Hero content per step ───
  const heroContent = {
    form: {
      eyebrow: t.heroEyebrow,
      heading: <>{t.heroTitle}<br /><em>{t.heroTitleEm}</em></>,
      desc: t.heroDesc,
    },
    profile: {
      eyebrow: 'Investor Profile',
      heading: <>Thank You for<br /><em>Opting In</em></>,
      desc: null,
    },
    complete: {
      eyebrow: 'All Set',
      heading: <>You&apos;re All Set,<br /><em>{form.firstName}</em></>,
      desc: 'Our investor relations team will be in touch shortly with the offering documents and next steps.',
    },
  };

  const hero = heroContent[step];

  return (
    <>
      <style>{requestAccessStyles}</style>

      <div className="ra-page">
        {/* Navigation */}
        <nav className="scrolled">
          <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
          <ul className="nav-links" id="navLinks">
            <li><Link href="/invest">{nav.invest}</Link></li>
            <li><Link href="/lending">{nav.borrow}</Link></li>
            <li><Link href="/about">{nav.about}</Link></li>
            <li><a href="https://investors.appfolioim.com/trg/investor/login" className="nav-cta">{nav.investorLogin} &rarr;</a></li>
          </ul>
          <div className="nav-right">
            <LanguageToggle />
            <button className="mobile-toggle" id="mobileToggle" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div className="ra-hero">
          <div className="ra-hero-body">
            <div className="ra-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>
              <span className="ra-eyebrow-line"></span>
              {hero.eyebrow}
              <span className="ra-eyebrow-line"></span>
            </div>
            <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>
              {hero.heading}
            </h1>
            {hero.desc && (
              <p className="ra-hero-desc" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
                {hero.desc}
              </p>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="ra-form-section">
          <div className="ra-form-container">

            {/* ─── Step 1: Basic Contact Form ─── */}
            {step === 'form' && (
              <form onSubmit={handleFormSubmit} style={{ animation: 'fadeUp 0.6s ease forwards' }}>
                <div className="ra-form-grid">
                  <div className="ra-form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" placeholder="John" value={form.firstName} onChange={set('firstName')} />
                  </div>
                  <div className="ra-form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" placeholder="Smith" value={form.lastName} onChange={set('lastName')} />
                  </div>
                  <div className="ra-form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} />
                  </div>
                  <div className="ra-form-group">
                    <label>Phone <span className="required">*</span></label>
                    <input type="tel" placeholder="(813) 555-0100" value={form.phone} onChange={handlePhoneChange} />
                  </div>
                </div>

                {error && (
                  <div className="ra-error">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="#fca5a5" strokeWidth="1.5" />
                      <path d="M8 5v3.5M8 10.5v.5" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="ra-submit" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner"></span> Submitting...</>
                  ) : (
                    <>Request Access <ArrowIcon /></>
                  )}
                </button>

                <p className="ra-disclaimer-inline">
                  By submitting, you acknowledge this is an expression of interest only and does not constitute a commitment to invest. Offers are made only to accredited investors through the fund&apos;s private placement memorandum.
                </p>
              </form>
            )}

            {/* ─── Step 2: Thank You + Investor Profile ─── */}
            {step === 'profile' && (
              <div style={{ animation: 'fadeUp 0.6s ease forwards' }}>
                {/* Thank You Message */}
                <div className="ra-thankyou">
                  <div className="ra-thankyou-icon">
                    <svg viewBox="0 0 48 48" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="24" cy="24" r="20" stroke="var(--champagne)" />
                      <path d="M15 24l6 6 12-12" stroke="var(--champagne)" />
                    </svg>
                  </div>
                  <p className="ra-thankyou-text">
                    Thank you for your interest, {form.firstName}! We will follow up with an email with more information about our company. In the meantime, filling out the information below will help us tailor investment opportunities specifically to you.
                  </p>
                  <div className="ra-thankyou-confirm">&#9993; Confirmation sent to {form.email}</div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit} className="ra-profile-form">
                  <div className="ra-form-grid">
                    {/* Accredited Investor Status */}
                    <div className="ra-form-group full">
                      <label>Accredited Investor Status</label>
                      <select value={profile.accreditedStatus} onChange={setProf('accreditedStatus')}>
                        <option value="">Select your status</option>
                        <option value="Yes — Individual Net Worth">Yes — Individual Net Worth ($1M+ excluding primary residence)</option>
                        <option value="Yes — Individual Income">Yes — Individual Income ($200K+ or $300K+ joint)</option>
                        <option value="Yes — Entity">Yes — Entity ($5M+ in assets)</option>
                        <option value="No">No</option>
                        <option value="Not Sure">Not Sure</option>
                      </select>
                    </div>

                    {/* Target Investment Amount */}
                    <div className="ra-form-group">
                      <label>Target Investment Per Opportunity</label>
                      <select value={profile.targetInvestment} onChange={setProf('targetInvestment')}>
                        <option value="">Select amount</option>
                        <option value="$25,000 – $50,000">$25,000 – $50,000</option>
                        <option value="$50,000 – $100,000">$50,000 – $100,000</option>
                        <option value="$100,000 – $250,000">$100,000 – $250,000</option>
                        <option value="$250,000 – $500,000">$250,000 – $500,000</option>
                        <option value="$500,000 – $1,000,000">$500,000 – $1,000,000</option>
                        <option value="$1,000,000+">$1,000,000+</option>
                      </select>
                    </div>

                    {/* Private Offer Experience */}
                    <div className="ra-form-group">
                      <label>Private Offer Experience</label>
                      <select value={profile.privateOfferExperience} onChange={setProf('privateOfferExperience')}>
                        <option value="">Select experience level</option>
                        <option value="No prior experience">No prior experience</option>
                        <option value="1-2 investments">1–2 investments</option>
                        <option value="3-5 investments">3–5 investments</option>
                        <option value="6-10 investments">6–10 investments</option>
                        <option value="10+ investments">10+ investments</option>
                      </select>
                    </div>

                    {/* Investment Interests — Multi-Select */}
                    <div className="ra-form-group full">
                      <label>Investment Interests <span className="optional">(select all that apply)</span></label>
                      <div className="ra-checkbox-grid">
                        {investmentInterestOptions.map(opt => (
                          <label
                            key={opt.value}
                            className={`ra-checkbox-card${profile.investmentInterests.includes(opt.value) ? ' selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={profile.investmentInterests.includes(opt.value)}
                              onChange={() => toggleInterest(opt.value)}
                            />
                            <span className="ra-checkbox-check">
                              <svg viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="ra-checkbox-label">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* State */}
                    <div className="ra-form-group">
                      <label>State</label>
                      <select value={profile.state} onChange={setProf('state')}>
                        <option value="">Select your state</option>
                        {US_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Investment Timeline */}
                    <div className="ra-form-group">
                      <label>Investment Timeline</label>
                      <select value={profile.investmentTimeline} onChange={setProf('investmentTimeline')}>
                        <option value="">Select timeline</option>
                        <option value="Immediately">Immediately</option>
                        <option value="1-3 months">1–3 months</option>
                        <option value="3-6 months">3–6 months</option>
                        <option value="6-12 months">6–12 months</option>
                        <option value="Just exploring">Just exploring</option>
                      </select>
                    </div>

                    {/* Entity Type */}
                    <div className="ra-form-group">
                      <label>How Will You Invest?</label>
                      <select value={profile.entityType} onChange={setProf('entityType')}>
                        <option value="">Select entity type</option>
                        <option value="Individual">Individual</option>
                        <option value="Joint">Joint Account</option>
                        <option value="LLC">LLC</option>
                        <option value="Trust">Trust</option>
                        <option value="IRA / Self-Directed IRA">IRA / Self-Directed IRA</option>
                        <option value="Other Entity">Other Entity</option>
                      </select>
                    </div>

                    {/* How Did You Hear About Us */}
                    <div className="ra-form-group">
                      <label>How Did You Hear About Us?</label>
                      <input type="text" placeholder="Referral, podcast, Google..." value={profile.referralSource} onChange={setProf('referralSource')} />
                    </div>

                    {/* Additional Information */}
                    <div className="ra-form-group full">
                      <label>Additional Information</label>
                      <textarea
                        placeholder="Any questions, preferences, or details you'd like to share..."
                        value={profile.additionalInfo}
                        onChange={setProf('additionalInfo')}
                        rows={4}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="ra-error">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#fca5a5" strokeWidth="1.5" />
                        <path d="M8 5v3.5M8 10.5v.5" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="ra-profile-actions">
                    <button type="submit" className="ra-submit" disabled={submitting}>
                      {submitting ? (
                        <><span className="spinner"></span> Submitting...</>
                      ) : (
                        <>Submit Profile <ArrowIcon /></>
                      )}
                    </button>
                    <button
                      type="button"
                      className="ra-skip"
                      onClick={() => { setStep('complete'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      Skip for now
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── Step 3: Complete ─── */}
            {step === 'complete' && (
              <div className="ra-success" style={{ animation: 'fadeUp 0.6s ease forwards' }}>
                <div className="ra-success-icon">
                  <svg viewBox="0 0 48 48" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="24" cy="24" r="20" stroke="var(--champagne)" />
                    <path d="M15 24l6 6 12-12" stroke="var(--champagne)" />
                  </svg>
                </div>
                <h2>Thank You, {form.firstName}</h2>
                <p>Our investor relations team will reach out within 1&ndash;2 business days with the offering documents and next steps. We look forward to connecting with you.</p>
                <div className="ra-success-confirm">&#9993; A confirmation has been sent to {form.email}</div>
                <Link href="/" className="ra-btn-home">Back to Home <ArrowIcon /></Link>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="ra-disclaimer">
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <p>This page is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities. Offers are made only to accredited investors through the fund&apos;s private placement memorandum. Past performance is not indicative of future results. All investments involve risk, including the potential loss of principal.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="ra-footer-wrap">
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
            <footer>
              <div className="footer-grid">
                <div className="footer-brand">
                  <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
                  <p>{f.brand}</p>
                </div>
                <div className="footer-col"><h4>{f.company}</h4><Link href="/about">{f.about}</Link><Link href="/portfolio">{f.portfolio}</Link><Link href="/insights">{f.insights}</Link></div>
                <div className="footer-col"><h4>{f.invest}</h4><Link href="/income-fund">{f.incomeFund}</Link><a href="https://investors.appfolioim.com/trg/investor/login">{f.investorLogin}</a><Link href="/request-access">{f.requestAccess}</Link><Link href="/investor-faq">{f.investorFaq}</Link></div>
                <div className="footer-col"><h4>{f.lending}</h4><Link href="/lending">{f.loanPrograms}</Link><Link href="/apply">{f.requestQuote}</Link><Link href="/apply">{f.loanApplication}</Link><Link href="/borrower-faq">{f.borrowerFaq}</Link></div>
              </div>
              <div className="footer-bottom">
                <p>{f.copyright} &nbsp;|&nbsp; {f.address} &nbsp;|&nbsp; {f.phone}</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}

const requestAccessStyles = `
  /* ── Page ── */
  .ra-page {
    min-height: 100vh;
    background: var(--navy-deep);
    font-family: var(--font-body);
    color: #fff;
  }
  .ra-page nav { position: relative; }

  /* ── Hero ── */
  .ra-hero {
    position: relative;
    overflow: hidden;
    padding: clamp(100px, 12vw, 140px) 0 clamp(40px, 6vw, 60px);
    text-align: center;
  }
  .ra-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 70% 20%, rgba(198,169,98,0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 25% 60%, rgba(30,65,112,0.15) 0%, transparent 50%);
    pointer-events: none;
  }
  .ra-hero-body {
    max-width: 700px;
    margin: 0 auto;
    padding: 0 32px;
    position: relative;
    z-index: 2;
  }
  .ra-eyebrow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--champagne);
    margin-bottom: 24px;
  }
  .ra-eyebrow-line {
    display: inline-block;
    width: 32px;
    height: 1px;
    background: rgba(198,169,98,0.4);
  }
  .ra-hero h1 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    color: #fff;
    line-height: 1.08;
    margin-bottom: 20px;
  }
  .ra-hero h1 em {
    font-style: italic;
    font-weight: 400;
    color: var(--champagne);
  }
  .ra-hero-desc {
    font-size: 16px;
    color: rgba(255,255,255,0.42);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Form Section ── */
  .ra-form-section {
    position: relative;
    padding-bottom: 80px;
  }
  .ra-form-section::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(30,65,112,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .ra-form-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 32px;
    position: relative;
    z-index: 2;
  }

  /* ── Form Grid ── */
  .ra-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .ra-form-group.full { grid-column: 1 / -1; }
  .ra-form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .required { color: var(--champagne); }
  .optional { color: rgba(255,255,255,0.3); font-weight: 400; text-transform: none; letter-spacing: 0; }

  .ra-form-group input,
  .ra-form-group select,
  .ra-form-group textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    font-family: var(--font-body);
    font-size: 15px;
    padding: 14px 16px;
    transition: all 0.3s;
    outline: none;
    border-radius: 0;
    -webkit-appearance: none;
  }
  .ra-form-group textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }
  .ra-form-group select {
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }
  .ra-form-group input::placeholder,
  .ra-form-group textarea::placeholder { color: rgba(255,255,255,0.2); }
  .ra-form-group input:focus,
  .ra-form-group select:focus,
  .ra-form-group textarea:focus {
    border-color: var(--champagne);
    background: rgba(198,169,98,0.04);
    box-shadow: 0 0 0 3px rgba(198,169,98,0.1);
  }
  .ra-form-group select option {
    background: var(--navy-deep);
    color: #fff;
  }

  /* ── Checkbox Cards (Multi-Select) ── */
  .ra-checkbox-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .ra-checkbox-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
  }
  .ra-checkbox-card:hover {
    border-color: rgba(198,169,98,0.3);
    background: rgba(198,169,98,0.04);
  }
  .ra-checkbox-card.selected {
    border-color: var(--champagne);
    background: rgba(198,169,98,0.08);
  }
  .ra-checkbox-card input { display: none; }
  .ra-checkbox-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.2);
    transition: all 0.3s;
    color: transparent;
  }
  .ra-checkbox-check svg { width: 14px; height: 14px; }
  .ra-checkbox-card.selected .ra-checkbox-check {
    border-color: var(--champagne);
    background: var(--champagne);
    color: var(--navy-deep);
  }
  .ra-checkbox-label {
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    font-weight: 500;
  }
  .ra-checkbox-card.selected .ra-checkbox-label {
    color: #fff;
  }

  /* ── Thank You Note ── */
  .ra-thankyou {
    text-align: center;
    padding: 12px 20px 16px;
    margin-bottom: 24px;
  }
  .ra-thankyou-icon {
    width: 28px;
    height: 28px;
    margin: 0 auto 8px;
  }
  .ra-thankyou-icon svg { width: 100%; height: 100%; }
  .ra-thankyou-text {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
    max-width: 480px;
    margin: 0 auto 6px;
  }
  .ra-thankyou-confirm {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
  }

  /* ── Profile Form ── */
  .ra-profile-form {
    padding-top: 8px;
  }
  .ra-profile-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 32px;
  }
  .ra-skip {
    background: none;
    border: none;
    color: rgba(255,255,255,0.35);
    font-family: var(--font-body);
    font-size: 14px;
    cursor: pointer;
    padding: 8px 16px;
    transition: color 0.3s;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .ra-skip:hover { color: rgba(255,255,255,0.6); }

  /* ── Error ── */
  .ra-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.25);
    color: #fca5a5;
    font-size: 14px;
    font-weight: 500;
    margin-top: 20px;
    animation: shake 0.4s ease;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  /* ── Submit Button ── */
  .ra-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    margin-top: 32px;
    padding: 18px 36px;
    background: var(--champagne);
    color: #fff;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
  }
  .ra-submit:hover {
    background: var(--champagne-lt);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(198,169,98,0.3);
  }
  .ra-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .ra-submit svg { transition: transform 0.3s; }
  .ra-submit:hover svg { transform: translateX(3px); }

  /* ── Spinner ── */
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Disclaimer (inline under form) ── */
  .ra-disclaimer-inline {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    line-height: 1.6;
    margin-top: 20px;
    text-align: center;
  }

  /* ── Success State ── */
  .ra-success {
    max-width: 520px;
    margin: 20px auto 0;
    text-align: center;
    padding: 56px 40px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ra-success-icon { width: 56px; height: 56px; margin: 0 auto 28px; }
  .ra-success-icon svg { width: 100%; height: 100%; }
  .ra-success h2 {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 400;
    margin-bottom: 16px;
  }
  .ra-success p {
    font-size: 15px;
    color: rgba(255,255,255,0.6);
    line-height: 1.65;
    margin-bottom: 32px;
  }
  .ra-success-confirm {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    margin-bottom: 32px;
  }
  .ra-btn-home {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: rgba(255,255,255,0.06);
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s;
  }
  .ra-btn-home:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

  /* ── Disclaimer ── */
  .ra-disclaimer {
    background: var(--navy-deep);
    border-top: 1px solid rgba(255,255,255,0.04);
    padding: 32px 0;
  }
  .ra-disclaimer p {
    font-size: 11px;
    color: rgba(255,255,255,0.2);
    line-height: 1.7;
    text-align: center;
  }

  /* ── Footer Wrap ── */
  .ra-footer-wrap {
    background: var(--cream);
    padding: 80px 0;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .ra-form-grid { grid-template-columns: 1fr; }
    .ra-checkbox-grid { grid-template-columns: 1fr; }
    .ra-hero { padding: clamp(80px, 10vw, 120px) 0 clamp(32px, 5vw, 48px); }
    .ra-hero-body { padding: 0 24px; }
    .ra-form-container { padding: 0 24px; }
    .ra-success { padding: 40px 24px; }
    .ra-success h2 { font-size: 28px; }
    .ra-thankyou { padding: 32px 24px; }
    .ra-footer-wrap { padding: 60px 0; }
  }
  @media (max-width: 600px) {
    .ra-hero-desc { font-size: 15px; }
    .ra-eyebrow-line { width: 20px; }
    .ra-disclaimer { padding: 24px 0; }
    .ra-disclaimer div { padding: 0 24px !important; }
    .ra-footer-wrap div { padding: 0 24px !important; }
  }
`;
