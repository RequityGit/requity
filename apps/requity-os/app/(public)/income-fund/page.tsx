// @ts-nocheck
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

export default function IncomeFundPage() {
  const { lang } = useLanguage();
  const t = translations.incomeFund[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];

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

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <style>{fundPageStyles}</style>

      {/* ══════ DARK ZONE ══════ */}
      <div className="dark-zone">
        <div className="if-hero">
          {/* Navigation */}
          <nav className="scrolled">
            <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
            <ul className="nav-links" id="navLinks">
              <li><Link href="/invest" style={{ color: 'var(--champagne)' }}>{nav.invest}</Link></li>
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

          {/* Hero content */}
          <div className="if-hero-body">
            <div className="if-hero-grid">
              <div className="if-hero-content">
                <div className="if-hero-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>{t.heroEyebrow}</div>
                <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>{t.heroTitle1}<br />{t.heroTitle2} <em>{t.heroTitleEm}</em></h1>
                <p className="if-hero-desc" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
                  {t.heroDesc}
                </p>
                <div className="if-hero-actions" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.8s forwards' }}>
                  <a href="#invest" className="btn-primary">{t.requestInfo} <ArrowIcon /></a>
                  <a href="https://investors.appfolioim.com/trg/investor/login" className="btn-secondary">{t.investorLogin}</a>
                </div>
              </div>
              <div className="if-hero-card" style={{ opacity: 0, animation: 'fadeIn 1s 0.6s forwards' }}>
                <div className="if-fund-card">
                  <div className="if-fund-card-label">{t.fundLabel}</div>
                  <div className="if-fund-card-title">{t.fundTitle}</div>
                  <p className="if-fund-card-desc">{t.fundDesc}</p>
                  <div className="if-card-stats-grid">
                    <div className="if-card-stat">
                      <div className="if-card-stat-value">$70M+</div>
                      <div className="if-card-stat-label">Capital Raised</div>
                    </div>
                    <div className="if-card-stat">
                      <div className="if-card-stat-value">Monthly</div>
                      <div className="if-card-stat-label">Distributions</div>
                    </div>
                    <div className="if-card-stat">
                      <div className="if-card-stat-value">32</div>
                      <div className="if-card-stat-label">Properties</div>
                    </div>
                    <div className="if-card-stat">
                      <div className="if-card-stat-value">$150M+</div>
                      <div className="if-card-stat-label">AUM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar" style={{ margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="stat-cell"><div className="stat-num champagne">$70M+</div><div className="stat-lbl">Investor Capital Raised</div></div>
          <div className="stat-cell"><div className="stat-num">Monthly</div><div className="stat-lbl">Distribution Frequency</div></div>
          <div className="stat-cell"><div className="stat-num">32</div><div className="stat-lbl">Properties in Portfolio</div></div>
          <div className="stat-cell"><div className="stat-num champagne">$150M+</div><div className="stat-lbl">Assets Under Management</div></div>
        </div>

        <div style={{ height: 64, background: 'var(--navy-deep)' }} />
      </div>

      {/* Curved transition */}
      <div className="dark-to-light" />

      {/* ══════ LIGHT ZONE ══════ */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Key Benefits */}
          <section className="if-benefits">
            <div className="if-benefits-header reveal">
              <h2>Built for <em>Income-Focused</em> Investors</h2>
              <p>Our fund is designed to deliver reliable monthly cash flow while maintaining the safety and security of real asset backing.</p>
            </div>
            <div className="if-benefits-grid">
              <div className="card if-benefit-card reveal reveal-delay-1">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <h3>Monthly Distributions</h3>
                <p>Receive consistent monthly cash flow deposited directly to your account. Our distributions have been paid on time, every month, since inception.</p>
              </div>
              <div className="card if-benefit-card reveal reveal-delay-2">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3>Asset-Backed Security</h3>
                <p>Every dollar in the fund is secured by tangible real estate assets with conservative loan-to-value ratios. Your capital is protected by real property.</p>
              </div>
              <div className="card if-benefit-card reveal reveal-delay-3">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3>Proven Track Record</h3>
                <p>Over $70M in investor capital raised and deployed across 70+ loans with consistent performance through all market conditions.</p>
              </div>
              <div className="card if-benefit-card reveal reveal-delay-1">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <h3>Investor-First Approach</h3>
                <p>Transparent reporting, consistent communication, and detailed property-level updates. You always know exactly where your money is working.</p>
              </div>
              <div className="card if-benefit-card reveal reveal-delay-2">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                </div>
                <h3>Operational Expertise</h3>
                <p>We don&apos;t just lend — we operate. Our deep real estate expertise means smarter underwriting, better asset selection, and superior risk management.</p>
              </div>
              <div className="card if-benefit-card reveal reveal-delay-3">
                <div className="if-benefit-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <h3>Diversified Portfolio</h3>
                <p>Capital deployed across multiple loans, property types, and geographic markets — reducing concentration risk and enhancing stability.</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="if-process">
            <div className="if-process-header reveal">
              <h2>Simple, <em>Transparent</em> Investing</h2>
            </div>
            <div className="if-process-grid">
              <div className="card if-process-step reveal reveal-delay-1">
                <div className="if-process-number">01</div>
                <h3>Request Information</h3>
                <p>Submit your interest and our investor relations team will provide you with the fund offering documents and answer any questions.</p>
              </div>
              <div className="card if-process-step reveal reveal-delay-2">
                <div className="if-process-number">02</div>
                <h3>Review &amp; Subscribe</h3>
                <p>Review the private placement memorandum, complete the subscription agreement, and fund your investment through our secure portal.</p>
              </div>
              <div className="card if-process-step reveal reveal-delay-3">
                <div className="if-process-number">03</div>
                <h3>Earn Monthly Income</h3>
                <p>Begin receiving monthly distributions deposited directly to your account, with full transparency into fund performance and portfolio activity.</p>
              </div>
            </div>
          </section>

          {/* Portfolio Composition */}
          <section className="if-composition">
            <div className="if-composition-grid">
              <div className="reveal">
                <div className="if-comp-eyebrow">Fund Composition</div>
                <h2 className="if-comp-title">Where Your Capital Works</h2>
                <p className="if-comp-desc">The Income Fund deploys capital across a diversified mix of real estate debt and equity positions, focusing on asset types where our operational expertise provides an information advantage.</p>
                <div className="if-asset-list">
                  <div className="if-asset-item">
                    <div className="if-asset-dot"></div>
                    <div>
                      <h4>Bridge Loans</h4>
                      <p>Short-term financing to real estate operators for acquisitions and renovations, secured by the underlying property.</p>
                    </div>
                  </div>
                  <div className="if-asset-item">
                    <div className="if-asset-dot"></div>
                    <div>
                      <h4>Manufactured Housing</h4>
                      <p>Debt and equity positions in manufactured housing communities — a resilient, affordable housing asset class.</p>
                    </div>
                  </div>
                  <div className="if-asset-item">
                    <div className="if-asset-dot"></div>
                    <div>
                      <h4>RV Parks &amp; Campgrounds</h4>
                      <p>Investments in outdoor hospitality properties benefiting from long-term secular demand growth.</p>
                    </div>
                  </div>
                  <div className="if-asset-item">
                    <div className="if-asset-dot"></div>
                    <div>
                      <h4>Multifamily Residential</h4>
                      <p>Apartment and multifamily positions in high-growth Southeast markets with strong fundamentals.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="reveal reveal-delay-2">
                <div className="if-composition-card card">
                  <h3>Fund Highlights</h3>
                  <div className="if-highlight-row">
                    <span>Structure</span>
                    <strong>Reg D 506(c) Fund</strong>
                  </div>
                  <div className="if-highlight-row">
                    <span>Investor Type</span>
                    <strong>Accredited Investors</strong>
                  </div>
                  <div className="if-highlight-row">
                    <span>Distributions</span>
                    <strong>Monthly</strong>
                  </div>
                  <div className="if-highlight-row">
                    <span>Reporting</span>
                    <strong>Monthly + Quarterly</strong>
                  </div>
                  <div className="if-highlight-row">
                    <span>Investor Portal</span>
                    <strong>AppFolio Investment Manager</strong>
                  </div>
                  <div className="if-highlight-row">
                    <span>Fund Admin</span>
                    <strong>Third-Party Audited</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <div className="if-testimonials">
            <div className="if-testimonials-header reveal">
              <h2>What Our <em>Investors</em> Say</h2>
            </div>
            <div className="if-testimonials-grid">
              <div className="test-card reveal">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;I have invested as an LP alongside Dylan and the Requity Group team across multiple asset classes over several geographic markets. Their reporting style and communication cadence is timely, consistent, and detailed, and I always feel well-informed on my investments.&rdquo;</div>
                <div className="author-name">Todd G.</div>
                <div className="author-role">Limited Partner</div>
              </div>
              <div className="test-card reveal reveal-delay-1">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;As a seasoned real estate investor with over 18 years of experience, I have worked with a wide variety of operators. What stands out about Dylan and the team at Requity is their detailed property-level reporting and consistent communication.&rdquo;</div>
                <div className="author-name">Ben E.</div>
                <div className="author-role">Limited Partner</div>
              </div>
            </div>
            <div className="if-testimonials-grid" style={{ marginTop: 20 }}>
              <div className="test-card reveal">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;This group is one of the only that have consistently overdelivered — sometimes substantially — on their projections. Their team is highly responsive and provides clear and consistent investor updates.&rdquo;</div>
                <div className="author-name">Marshall F.</div>
                <div className="author-role">Limited Partner</div>
              </div>
              <div className="test-card reveal reveal-delay-1">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;I&apos;ve invested in 22 private real estate syndications with 18 different sponsors over the last 6 years. Dylan Marma and the team at TRG have earned the spot of my very favorite syndication sponsor.&rdquo;</div>
                <div className="author-name">Russell R.</div>
                <div className="author-role">Limited Partner</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <section className="if-cta" id="invest">
            <div className="if-cta-banner reveal">
              <div className="if-cta-eyebrow">Get Started</div>
              <h2>Ready to Earn <em>Monthly Income?</em></h2>
              <p>Join our community of sophisticated investors earning consistent, asset-backed returns. Request information today and our team will be in touch.</p>
              <Link href="/request-access" className="btn-primary" style={{ borderRadius: 8 }}>
                Request Access <ArrowIcon />
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

      {/* Disclaimer */}
      <div className="if-disclaimer">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <p>This page is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities. Offers are made only to accredited investors through the fund&apos;s private placement memorandum. Past performance is not indicative of future results. All investments involve risk, including the potential loss of principal.</p>
        </div>
      </div>
    </>
  );
}

const fundPageStyles = `
  /* ── Hero ── */
  .if-hero {
    position: relative;
    min-height: 640px;
    display: flex;
    flex-direction: column;
  }
  .if-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 70% 20%, rgba(198,169,98,0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 25% 60%, rgba(30,65,112,0.15) 0%, transparent 50%);
    pointer-events: none;
  }
  .if-hero > * { position: relative; z-index: 2; }
  .if-hero nav { position: relative; }

  .if-hero-body {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 120px 48px 80px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  .if-hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(40px, 6vw, 80px);
    align-items: center;
    width: 100%;
  }
  .if-hero-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--champagne);
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 16px;
  }
  .if-hero-eyebrow::before {
    content: ''; width: 40px; height: 1px;
    background: linear-gradient(to right, transparent, rgba(212,197,169,0.4));
  }
  .if-hero h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 58px);
    font-weight: 500; color: #fff;
    line-height: 1.08; letter-spacing: -0.01em;
    margin-bottom: 24px;
  }
  .if-hero h1 em {
    font-style: italic; font-weight: 400; color: var(--champagne);
  }
  .if-hero-desc {
    font-size: 16px; font-weight: 400;
    color: rgba(255,255,255,0.42);
    max-width: 500px; line-height: 1.7; margin-bottom: 36px;
  }
  .if-hero-actions {
    display: flex; gap: 16px; align-items: center;
  }
  @media (max-width: 968px) {
    .if-hero-body { padding: 100px 24px 60px; }
    .if-hero-grid { grid-template-columns: 1fr; gap: 40px; }
    .if-hero-actions { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 600px) {
    .if-hero-body { padding: 80px 20px 48px; }
    .if-hero-desc { font-size: 15px; }
    .if-hero-actions { width: 100%; }
    .if-hero-actions .btn-primary,
    .if-hero-actions .btn-secondary { width: 100%; justify-content: center; }
  }

  /* Hero Fund Card */
  .if-fund-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: clamp(24px, 4vw, 44px);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }
  .if-fund-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(to right, var(--navy-muted), var(--champagne));
  }
  .if-fund-card-label {
    font-family: var(--font-body);
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.15em;
    color: var(--champagne);
    margin-bottom: 16px;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .if-fund-card-label::before {
    content: '';
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--champagne);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .if-fund-card-title {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 500;
    color: #fff; margin-bottom: 12px;
  }
  .if-fund-card-desc {
    font-size: 14px; color: rgba(255,255,255,0.4);
    line-height: 1.65; margin-bottom: 28px;
  }
  .if-card-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .if-card-stat-value {
    font-family: var(--font-display);
    font-size: 26px; font-weight: 500;
    color: var(--champagne);
    margin-bottom: 4px;
  }
  .if-card-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
  @media (max-width: 968px) {
    .if-fund-card { padding: 32px; }
  }

  /* ── Benefits (light zone) ── */
  .if-benefits {
    padding: 40px 0 64px;
  }
  .if-benefits-header {
    display: grid; grid-template-columns: 0.45fr 0.55fr;
    gap: 48px; align-items: end; margin-bottom: 48px;
  }
  .if-benefits-header h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 40px);
    font-weight: 500; color: var(--text-dark); line-height: 1.12;
  }
  .if-benefits-header h2 em { font-style: italic; color: var(--champagne-dk); font-weight: 400; }
  .if-benefits-header p {
    font-size: 15px; color: var(--text-muted);
    line-height: 1.7; max-width: 460px;
  }
  .if-benefits-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .if-benefit-card {
    padding: 36px 32px;
  }
  .if-benefit-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(14,34,64,0.06);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px; color: var(--navy-mid);
  }
  .if-benefit-card h3 {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 10px;
  }
  .if-benefit-card p {
    font-size: 14px; color: var(--text-muted);
    line-height: 1.65;
  }
  @media (max-width: 968px) {
    .if-benefits-header { grid-template-columns: 1fr; gap: 20px; }
    .if-benefits-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .if-benefits-grid { grid-template-columns: 1fr; }
  }

  /* ── How It Works (light zone) ── */
  .if-process {
    padding: 0 0 64px;
  }
  .if-process-header {
    text-align: center;
    margin-bottom: 48px;
  }
  .if-process-header h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 40px);
    font-weight: 500; color: var(--text-dark); line-height: 1.12;
  }
  .if-process-header h2 em { font-style: italic; color: var(--champagne-dk); font-weight: 400; }
  .if-process-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .if-process-step {
    text-align: center;
    padding: 40px 32px;
  }
  .if-process-number {
    font-family: var(--font-display);
    font-size: 48px; font-weight: 600;
    color: rgba(14,34,64,0.08);
    line-height: 1; margin-bottom: 20px;
  }
  .if-process-step h3 {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 12px;
  }
  .if-process-step p {
    font-size: 14px; color: var(--text-muted);
    line-height: 1.65;
  }
  @media (max-width: 768px) {
    .if-process-grid { grid-template-columns: 1fr; }
  }

  /* ── Fund Composition (light zone) ── */
  .if-composition {
    padding: 0 0 64px;
  }
  .if-composition-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: start;
  }
  .if-comp-eyebrow {
    font-family: var(--font-body); font-size: 11px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--navy-muted); margin-bottom: 20px;
  }
  .if-comp-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: 500; color: var(--text-dark);
    line-height: 1.15; margin-bottom: 16px;
  }
  .if-comp-desc {
    font-size: 15px; color: var(--text-muted);
    line-height: 1.7; max-width: 500px;
  }
  .if-asset-list {
    display: flex; flex-direction: column;
    gap: 24px; margin-top: 36px;
  }
  .if-asset-item {
    display: flex; gap: 16px; align-items: flex-start;
  }
  .if-asset-dot {
    width: 10px; height: 10px; min-width: 10px;
    border-radius: 50%;
    background: var(--champagne-dk);
    margin-top: 6px;
  }
  .if-asset-item h4 {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 4px;
  }
  .if-asset-item p {
    font-size: 14px; color: var(--text-muted);
    line-height: 1.6;
  }
  .if-composition-card {
    position: sticky;
    top: 100px;
    padding: 0 !important;
    overflow: hidden;
  }
  .if-composition-card h3 {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600;
    color: var(--text-dark);
    padding: 28px 32px;
    border-bottom: 1px solid rgba(8,21,37,0.06);
  }
  .if-highlight-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    border-bottom: 1px solid rgba(8,21,37,0.04);
    transition: background 0.2s;
  }
  .if-highlight-row:last-child { border-bottom: none; }
  .if-highlight-row:hover { background: rgba(8,21,37,0.015); }
  .if-highlight-row span {
    font-size: 14px; color: var(--text-muted);
  }
  .if-highlight-row strong {
    font-size: 14px; color: var(--text-dark);
    font-weight: 600;
  }
  @media (max-width: 968px) {
    .if-composition-grid { grid-template-columns: 1fr; }
    .if-composition-card { position: static; }
  }

  /* ── Testimonials (light zone) ── */
  .if-testimonials {
    padding: 0 0 64px;
  }
  .if-testimonials-header {
    margin-bottom: 32px;
  }
  .if-testimonials-header h2 {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: 500; color: var(--text-dark); line-height: 1.12;
  }
  .if-testimonials-header h2 em { font-style: italic; color: var(--champagne-dk); font-weight: 400; }
  .if-testimonials-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 900px) {
    .if-testimonials-grid { grid-template-columns: 1fr; }
  }

  /* ── CTA Banner (light zone, dark card) ── */
  .if-cta {
    padding: 0 0 64px;
  }
  .if-cta-banner {
    background: linear-gradient(135deg, var(--navy-deep), var(--navy));
    border-radius: 18px; padding: clamp(36px, 6vw, 64px);
    text-align: center;
    position: relative; overflow: hidden;
  }
  .if-cta-banner::before {
    content: ''; position: absolute; right: -60px; top: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(30,65,112,0.2); pointer-events: none;
  }
  .if-cta-banner::after {
    content: ''; position: absolute; left: 30%; bottom: -100px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(212,197,169,0.04); pointer-events: none;
  }
  .if-cta-banner > * { position: relative; z-index: 1; }
  .if-cta-eyebrow {
    font-family: var(--font-body); font-size: 11px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--champagne); margin-bottom: 20px;
  }
  .if-cta-banner h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 44px);
    font-weight: 500; color: #fff;
    line-height: 1.12; margin-bottom: 20px;
  }
  .if-cta-banner h2 em { font-style: italic; color: var(--champagne); font-weight: 400; }
  .if-cta-banner p {
    font-size: 15px; color: rgba(255,255,255,0.4);
    line-height: 1.7; max-width: 560px;
    margin: 0 auto 40px;
  }

  /* ── Disclaimer ── */
  .if-disclaimer {
    background: var(--cream);
    padding: 0 0 32px;
  }
  .if-disclaimer p {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.7;
    max-width: 800px;
    opacity: 0.6;
  }
  @media (max-width: 600px) {
    .if-cta-banner { border-radius: 14px; }
  }

  /* Footer spacing */
  footer { margin-top: 0; }
`;
