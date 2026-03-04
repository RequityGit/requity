'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import { LoanIndexes } from '@/components/public/LoanIndexes';
import translations from '@/lib/translations';

const LOAN_PROGRAMS = [
  {
    id: 'cre-bridge',
    name: 'CRE Bridge',
    desc: 'Short-term bridge financing for commercial real estate acquisitions, refinances, and value-add repositioning.',
    features: ['Up to 80% LTV', '12–24 month terms', 'Interest-only payments', 'Close in 2–3 weeks'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 40h32" />
        <path d="M10 40V22l14-10 14 10v18" />
        <path d="M20 40v-10h8v10" />
        <rect x="18" y="24" width="5" height="5" />
        <rect x="27" y="24" width="5" height="5" />
      </svg>
    ),
  },
  {
    id: 'manufactured-housing',
    name: 'Manufactured Housing',
    desc: 'Financing for manufactured housing communities and mobile home park acquisitions with flexible structures.',
    features: ['Acquisition & refinance', 'Value-add rehab capital', 'Experienced MH operators', 'Nationwide coverage'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="20" width="36" height="18" rx="2" />
        <path d="M6 28h36" />
        <path d="M12 20v-5h8v5" />
        <circle cx="14" cy="38" r="3" />
        <circle cx="34" cy="38" r="3" />
        <path d="M24 28v10" />
      </svg>
    ),
  },
  {
    id: 'rv-park',
    name: 'RV Park',
    desc: 'Capital for RV parks, campgrounds, and outdoor hospitality properties. Acquisition and improvement financing.',
    features: ['Park acquisitions', 'Infrastructure improvements', 'Expansion financing', 'Seasonal cash flow'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 36l14-22 14 22" />
        <path d="M16 36l8-12 8 12" />
        <path d="M24 14V9" />
        <path d="M6 36h36" />
        <path d="M22 36v-5h4v5" />
      </svg>
    ),
  },
  {
    id: 'multifamily',
    name: 'Multifamily',
    desc: 'Bridge and transitional financing for apartment buildings and multifamily residential properties of all sizes.',
    features: ['5+ unit properties', 'Value-add renovations', 'Lease-up financing', 'Flexible prepayment'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="10" width="32" height="30" />
        <path d="M8 20h32" />
        <path d="M8 30h32" />
        <path d="M20 10v30" />
        <path d="M32 10v30" />
        <path d="M22 40v-5h4v5" />
      </svg>
    ),
  },
  {
    id: 'fix-flip',
    name: 'Fix & Flip',
    desc: 'Short-term loans for residential property renovation and resale. Fast closings for competitive markets.',
    features: ['Up to 90% of purchase', '100% rehab financing', '6–12 month terms', 'Draw-based rehab'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 8l16 14H8L24 8z" />
        <rect x="12" y="22" width="24" height="18" />
        <rect x="20" y="28" width="8" height="12" />
        <path d="M36 16l5-5M41 11l-4 1 3 3-1 4" />
      </svg>
    ),
  },
  {
    id: 'dscr-rental',
    name: 'DSCR Rental',
    desc: 'Long-term rental property loans based on property cash flow — not personal income. Ideal for portfolio landlords.',
    features: ['No tax returns needed', 'Cash-flow qualified', '30-year fixed available', 'Unlimited properties'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="8" width="28" height="32" rx="2" />
        <path d="M18 18h12" />
        <path d="M18 26h12" />
        <path d="M18 34h8" />
        <path d="M24 8V4" />
        <circle cx="36" cy="36" r="7" fill="#0a0f1a" />
        <path d="M36 32v8M33 36h6" />
      </svg>
    ),
  },
  {
    id: 'new-construction',
    name: 'New Construction',
    desc: 'Ground-up construction financing for residential and commercial projects. Full-stack capital solutions.',
    features: ['Ground-up financing', 'Draw schedule based', 'Horizontal development', 'Spec & pre-sold'],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 40V18h20v22" />
        <path d="M12 40h28" />
        <path d="M22 26h10" />
        <path d="M22 34h10" />
        <path d="M28 18V8l-10 10" />
        <path d="M8 40l5-12" />
        <path d="M10 28v12" />
      </svg>
    ),
  },
];

export default function LendingClient({ testimonials = [], loanIndexes = null }) {
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

  const { lang } = useLanguage();
  const t = translations.lending[lang];
  const lp = translations.loanPrograms[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <style>{lendingStyles}</style>

      {/* DARK ZONE */}
      <div className="dark-zone">

        {/* Navigation */}
        <nav className="scrolled">
          <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
          <ul className="nav-links" id="navLinks">
            <li><Link href="/invest">{nav.invest}</Link></li>
            <li><Link href="/lending" style={{ color: 'var(--champagne)' }}>{nav.borrow}</Link></li>
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
        <section className="ld-hero">
          <div className="container">
            <div className="ld-hero-grid">
              <div className="ld-hero-content">
                <div className="section-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>{t.heroEyebrow}</div>
                <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>{t.heroTitle1}<br />{t.heroTitle2} <em>{t.heroTitleEm}</em></h1>
                <p className="ld-hero-desc" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
                  {t.heroDesc}
                </p>
                <div className="ld-hero-actions" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.8s forwards' }}>
                  <Link href="/apply" className="btn-primary">{t.requestLoan} <ArrowIcon /></Link>
                  <a href="tel:+18133275180" className="btn-secondary">{t.callUs}</a>
                </div>
              </div>
              <div className="ld-hero-stats" style={{ opacity: 0, animation: 'fadeIn 1s 0.6s forwards' }}>
                <div className="ld-stats-card">
                  <h3>{t.lendingTrackRecord}</h3>
                  <div className="ld-stat-row">
                    <div className="ld-stat"><div className="ld-stat-number">70+</div><div className="ld-stat-label">{t.loansOriginated}</div></div>
                    <div className="ld-stat"><div className="ld-stat-number">$150M+</div><div className="ld-stat-label">{t.capitalDeployed}</div></div>
                    <div className="ld-stat"><div className="ld-stat-number">14 Day</div><div className="ld-stat-label">{t.avgCloseTime}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <div className="stats-bar" style={{ margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="stat-cell"><div className="stat-num champagne">70+</div><div className="stat-lbl">{t.statLoans}</div></div>
          <div className="stat-cell"><div className="stat-num">$150M+</div><div className="stat-lbl">{t.statCapital}</div></div>
          <div className="stat-cell"><div className="stat-num">14 Day</div><div className="stat-lbl">{t.statClose}</div></div>
          <div className="stat-cell"><div className="stat-num champagne">7</div><div className="stat-lbl">{t.statPrograms}</div></div>
        </div>

        <LoanIndexes indexes={loanIndexes} />

        <div style={{ height: 32, background: 'var(--navy-deep)' }} />
      </div>

      {/* Curved transition */}
      <div className="dark-to-light" />

      {/* LIGHT ZONE */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Loan Programs */}
          <section className="ld-programs">
            <div className="ld-programs-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.programsEyebrow}</div>
              <h2 className="section-title">{t.programsTitle}</h2>
              <p className="section-desc">{t.programsDesc}</p>
            </div>
            <div className="ld-programs-grid">
              {LOAN_PROGRAMS.map((program, i) => (
                <Link
                  key={program.id}
                  href={`/apply?type=${encodeURIComponent(program.name)}`}
                  className={`ld-program-card card reveal ${i < 3 ? `reveal-delay-${i + 1}` : ''}`}
                >
                  <div className="ld-program-icon">{program.icon}</div>
                  <h3>{lp[program.id]?.name || program.name}</h3>
                  <p>{lp[program.id]?.desc || program.desc}</p>
                  <ul className="ld-program-features">
                    {(lp[program.id]?.features || program.features).map((feat) => (
                      <li key={feat}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8l3 3 5-5" /></svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <div className="ld-program-cta">
                    {t.applyNow} <ArrowIcon />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Why Requity */}
          <section className="ld-why">
            <div className="ld-why-grid">
              <div className="reveal">
                <div className="section-eyebrow section-eyebrow-dark">{t.whyEyebrow}</div>
                <h2 className="section-title">{t.whyTitle1}<br />{t.whyTitle2} <em>{t.whyTitleEm}</em></h2>
                <p className="section-desc">{t.whyDesc}</p>
              </div>
              <div className="ld-why-features reveal reveal-delay-2">
                <div className="ld-why-feature">
                  <div className="ld-why-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <h4>{t.fastExecution}</h4>
                    <p>{t.fastExecutionDesc}</p>
                  </div>
                </div>
                <div className="ld-why-feature">
                  <div className="ld-why-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4>{t.certaintyOfClose}</h4>
                    <p>{t.certaintyOfCloseDesc}</p>
                  </div>
                </div>
                <div className="ld-why-feature">
                  <div className="ld-why-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h4>{t.operatorMentality}</h4>
                    <p>{t.operatorMentalityDesc}</p>
                  </div>
                </div>
                <div className="ld-why-feature">
                  <div className="ld-why-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h4>{t.directCommunication}</h4>
                    <p>{t.directCommunicationDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Borrower Testimonials */}
          {testimonials.length > 0 && (
            <section className="ld-testimonials">
              <div className="ld-testimonials-header reveal">
                <div className="section-eyebrow section-eyebrow-dark">Borrower Feedback</div>
                <h2 className="section-title">What Our Borrowers <em>Say</em></h2>
              </div>
              <div className="ld-testimonials-grid">
                {testimonials.map((item, i) => (
                  <div key={item.id} className={`ld-test-card card reveal ${i < 3 ? `reveal-delay-${i + 1}` : ''}`}>
                    <div className="ld-test-quote">&ldquo;</div>
                    <div className="ld-test-stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                    <p className="ld-test-text">&ldquo;{item.quote}&rdquo;</p>
                    <div className="ld-test-author">
                      <div className="ld-test-name">{item.name}</div>
                      {item.role && <div className="ld-test-role">{item.role}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Process */}
          <section className="ld-process">
            <div className="ld-process-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.processEyebrow}</div>
              <h2 className="section-title">{t.processTitle} <em>{t.processTitleEm}</em></h2>
            </div>
            <div className="ld-process-steps">
              <div className="ld-process-step card reveal reveal-delay-1">
                <div className="ld-step-number">01</div>
                <h3>{t.step1Title}</h3>
                <p>{t.step1Desc}</p>
              </div>
              <div className="ld-process-step card reveal reveal-delay-2">
                <div className="ld-step-number">02</div>
                <h3>{t.step2Title}</h3>
                <p>{t.step2Desc}</p>
              </div>
              <div className="ld-process-step card reveal reveal-delay-3">
                <div className="ld-step-number">03</div>
                <h3>{t.step3Title}</h3>
                <p>{t.step3Desc}</p>
              </div>
              <div className="ld-process-step card reveal">
                <div className="ld-step-number">04</div>
                <h3>{t.step4Title}</h3>
                <p>{t.step4Desc}</p>
              </div>
            </div>
          </section>

          {/* Contact Banner */}
          <section className="ld-contact">
            <div className="lending-cta-banner reveal">
              <div className="ld-contact-content">
                <h3>{t.contactTitle1} <em>{t.contactTitleEm}</em></h3>
                <p>{t.contactDesc}</p>
              </div>
              <div className="ld-contact-actions">
                <Link href="/apply" className="btn-primary" style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>{t.submitLoanRequest} <ArrowIcon /></Link>
                <a href="tel:+18133275180" className="ld-phone-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                  813.327.5180
                </a>
              </div>
            </div>
          </section>

          {/* CTA for Investors */}
          <section className="ld-cta">
            <div className="ld-cta-inner reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.investorsEyebrow}</div>
              <h2 className="section-title" style={{ textAlign: 'center' }}>{t.investorsTitle}</h2>
              <p className="section-desc" style={{ maxWidth: 560, margin: '0 auto 40px', textAlign: 'center' }}>
                {t.investorsDesc}
              </p>
              <Link href="/income-fund" className="btn-primary-light">
                {t.learnAboutFund} <ArrowIcon />
              </Link>
            </div>
          </section>

          {/* Footer */}
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
    </>
  );
}

const lendingStyles = `
  /* ── Hero ── */
  .ld-hero {
    min-height: 580px;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding: 0;
  }
  .ld-hero::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -15%;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(198,169,98,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .ld-hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(40px, 6vw, 80px);
    align-items: center;
    padding: 140px 0 80px;
  }
  .ld-hero h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 62px);
    font-weight: 500;
    line-height: 1.08;
    color: #fff;
    margin-bottom: 28px;
  }
  .ld-hero h1 em {
    font-style: italic;
    font-weight: 400;
    color: var(--champagne);
  }
  .ld-hero-desc {
    font-size: 16px;
    line-height: 1.75;
    color: rgba(255,255,255,0.42);
    max-width: 520px;
    margin-bottom: 40px;
    font-weight: 400;
  }
  .ld-hero-actions {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  @media (max-width: 968px) {
    .ld-hero-grid { grid-template-columns: 1fr; gap: 40px; padding: 120px 0 60px; }
    .ld-hero-actions { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 600px) {
    .ld-hero-grid { padding: 100px 0 48px; }
    .ld-hero-desc { font-size: 15px; }
    .ld-hero-actions { width: 100%; }
    .ld-hero-actions .btn-primary,
    .ld-hero-actions .btn-secondary { width: 100%; justify-content: center; }
  }

  /* ── Hero Stats Card ── */
  .ld-stats-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    padding: 48px;
  }
  .ld-stats-card h3 {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 400;
    margin-bottom: 40px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.5px;
  }
  .ld-stat-row {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .ld-stat {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .ld-stat:last-child { border-bottom: none; padding-bottom: 0; }
  .ld-stat-number {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 600;
    color: var(--champagne);
    line-height: 1;
  }
  .ld-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: right;
    font-weight: 500;
  }
  @media (max-width: 968px) {
    .ld-stats-card { padding: 32px; }
    .ld-stat-number { font-size: 36px; }
  }

  /* ── Loan Programs (light zone) ── */
  .ld-programs {
    padding: 40px 0 64px;
  }
  .ld-programs-header { margin-bottom: 48px; }
  .ld-programs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  .ld-program-card {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
  }
  .ld-program-icon {
    width: 48px;
    height: 48px;
    color: var(--navy-mid);
    margin-bottom: 24px;
    opacity: 0.6;
    transition: opacity 0.3s;
  }
  .ld-program-card:hover .ld-program-icon { opacity: 1; }
  .ld-program-card h3 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 10px;
  }
  .ld-program-card > p {
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-muted);
    margin-bottom: 24px;
  }
  .ld-program-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 28px;
    flex-grow: 1;
  }
  .ld-program-features li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 400;
  }
  .ld-program-features svg { color: var(--champagne-dk); flex-shrink: 0; }
  .ld-program-cta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--navy-muted);
    padding-top: 20px;
    border-top: 1px solid rgba(8,21,37,0.06);
    transition: gap 0.3s, color 0.3s;
  }
  .ld-program-card:hover .ld-program-cta { gap: 14px; color: var(--champagne-dk); }
  @media (max-width: 768px) {
    .ld-programs-grid { grid-template-columns: 1fr; }
  }

  /* ── Why Requity (light zone) ── */
  .ld-why {
    padding: 64px 0;
  }
  .ld-why-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(40px, 6vw, 80px);
    align-items: start;
  }
  .ld-why-features {
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .ld-why-feature {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .ld-why-icon {
    width: 52px;
    height: 52px;
    min-width: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(14,34,64,0.06);
    color: var(--navy-mid);
    transition: all 0.3s;
  }
  .ld-why-feature:hover .ld-why-icon {
    background: rgba(14,34,64,0.1);
    color: var(--navy-light);
  }
  .ld-why-feature h4 {
    font-size: 17px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 8px;
  }
  .ld-why-feature p {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.65;
    font-weight: 400;
  }
  @media (max-width: 968px) {
    .ld-why-grid { grid-template-columns: 1fr; gap: 48px; }
  }

  /* ── Borrower Testimonials (light zone) ── */
  .ld-testimonials {
    padding: 64px 0;
  }
  .ld-testimonials-header {
    margin-bottom: 48px;
  }
  .ld-testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  .ld-test-card {
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .ld-test-quote {
    font-family: var(--font-display);
    font-size: 64px;
    line-height: 1;
    color: var(--champagne);
    opacity: 0.2;
    position: absolute;
    top: 20px;
    right: 28px;
    pointer-events: none;
  }
  .ld-test-stars {
    color: var(--champagne);
    font-size: 16px;
    letter-spacing: 2px;
    margin-bottom: 16px;
  }
  .ld-test-text {
    font-size: 14px;
    line-height: 1.75;
    color: var(--text-muted);
    font-weight: 400;
    margin-bottom: 24px;
    flex-grow: 1;
  }
  .ld-test-author {
    padding-top: 20px;
    border-top: 1px solid rgba(8,21,37,0.06);
  }
  .ld-test-name {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 4px;
  }
  .ld-test-role {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
  @media (max-width: 768px) {
    .ld-testimonials-grid { grid-template-columns: 1fr; }
  }

  /* ── Process (light zone) ── */
  .ld-process {
    padding: 64px 0;
  }
  .ld-process-header {
    text-align: center;
    margin-bottom: 48px;
  }
  .ld-process-header .section-title {
    max-width: 500px;
    margin: 0 auto 20px;
  }
  .ld-process-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .ld-process-step {
    text-align: left;
  }
  .ld-step-number {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 600;
    color: rgba(14,34,64,0.08);
    line-height: 1;
    margin-bottom: 20px;
  }
  .ld-process-step h3 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 10px;
  }
  .ld-process-step p {
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
  }
  @media (max-width: 968px) {
    .ld-process-steps { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .ld-process-steps { grid-template-columns: 1fr; }
  }

  /* ── Contact Banner ── */
  .ld-contact {
    padding: 24px 0 64px;
  }
  .ld-contact-content h3 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 8px;
  }
  .ld-contact-content h3 em {
    font-style: italic;
    color: var(--champagne);
    font-weight: 400;
  }
  .ld-contact-content p {
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    line-height: 1.6;
    max-width: 440px;
  }
  .ld-contact-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    flex-shrink: 0;
  }
  .ld-phone-link {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--champagne);
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    transition: opacity 0.3s;
  }
  .ld-phone-link:hover { opacity: 0.8; }
  @media (max-width: 768px) {
    .ld-contact-content p { max-width: none; }
    .ld-contact-actions { width: 100%; }
    .ld-contact-actions .btn-primary { width: 100%; justify-content: center; }
  }

  /* ── CTA Section (light zone) ── */
  .ld-cta {
    padding: 48px 0 64px;
  }
  .ld-cta-inner {
    text-align: center;
  }

  /* ── Footer spacing ── */
  footer { margin-top: 0; }
`;
