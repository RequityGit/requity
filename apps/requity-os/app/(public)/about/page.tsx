// @ts-nocheck
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

export default function AboutPage() {
  const { lang } = useLanguage();
  const t = translations.about[lang];
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
      <style>{aboutPageStyles}</style>

      {/* ══════ DARK ZONE ══════ */}
      <div className="dark-zone">
        <div className="ab-hero">
          {/* Nav */}
          <nav className="scrolled">
            <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
            <ul className="nav-links" id="navLinks">
              <li><Link href="/invest">{nav.invest}</Link></li>
              <li><Link href="/lending">{nav.borrow}</Link></li>
              <li><Link href="/about" style={{ color: 'var(--champagne)' }}>{nav.about}</Link></li>
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
          <div className="ab-hero-body">
            <div className="ab-hero-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>{t.heroEyebrow}</div>
            <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>{t.heroTitle1}<br /><em>{t.heroTitleEm}</em> {t.heroTitle2}</h1>
            <p className="ab-hero-p" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
              {t.heroDesc}
            </p>
          </div>
        </div>

        <div style={{ height: 64, background: 'var(--navy-deep)' }} />
      </div>

      {/* Curved transition */}
      <div className="dark-to-light" />

      {/* ══════ LIGHT ZONE ══════ */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Mission */}
          <section className="ab-mission">
            <div className="ab-mission-content">
              <div className="reveal">
                <div className="section-eyebrow section-eyebrow-dark">{t.missionEyebrow}</div>
                <h2 className="section-title">{t.missionTitle1}<br /><em>{t.missionTitleEm}</em> {t.missionTitle2}</h2>
                <p className="section-desc">{t.missionDesc}</p>
              </div>
            </div>
            <div className="ab-stats-grid reveal reveal-delay-2">
              <div className="ab-stat-card">
                <div className="ab-stat-value">$150M+</div>
                <div className="ab-stat-label">{t.statAum}</div>
              </div>
              <div className="ab-stat-card">
                <div className="ab-stat-value">32</div>
                <div className="ab-stat-label">{t.statProperties}</div>
              </div>
              <div className="ab-stat-card">
                <div className="ab-stat-value">70+</div>
                <div className="ab-stat-label">{t.statLoans}</div>
              </div>
              <div className="ab-stat-card">
                <div className="ab-stat-value">3,000+</div>
                <div className="ab-stat-label">{t.statUnits}</div>
              </div>
            </div>
          </section>

          {/* Three Pillars */}
          <section className="ab-pillars">
            <div className="ab-pillars-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.pillarsEyebrow}</div>
              <h2 className="section-title">{t.pillarsTitle} <em>{t.pillarsTitleEm}</em></h2>
              <p className="section-desc">{t.pillarsDesc}</p>
            </div>
            <div className="ab-pillars-grid">
              <div className="card reveal reveal-delay-1">
                <div className="ab-pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ab-pillar-number">01</div>
                <h3>{t.pillarInvest}</h3>
                <p>{t.pillarInvestDesc}</p>
                <Link href="/income-fund" className="ab-pillar-link">{t.pillarInvestLink} <ArrowIcon /></Link>
              </div>
              <div className="card reveal reveal-delay-2">
                <div className="ab-pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ab-pillar-number">02</div>
                <h3>{t.pillarOperate}</h3>
                <p>{t.pillarOperateDesc}</p>
                <Link href="/portfolio" className="ab-pillar-link">{t.pillarOperateLink} <ArrowIcon /></Link>
              </div>
              <div className="card reveal reveal-delay-3">
                <div className="ab-pillar-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div className="ab-pillar-number">03</div>
                <h3>{t.pillarLend}</h3>
                <p>{t.pillarLendDesc}</p>
                <Link href="/lending" className="ab-pillar-link">{t.pillarLendLink} <ArrowIcon /></Link>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="ab-team">
            <div className="ab-team-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.teamEyebrow}</div>
              <h2 className="section-title">{t.teamTitle} <em>{t.teamTitleEm}</em></h2>
              <p className="section-desc">{t.teamDesc}</p>
            </div>
            <div className="ab-team-grid">
              <div className="card reveal reveal-delay-1">
                <div className="ab-team-photo">
                  <div className="ab-team-initials">DM</div>
                </div>
                <h3>{t.dylanName}</h3>
                <div className="ab-team-role">{t.dylanRole}</div>
                <p>{t.dylanBio}</p>
              </div>
              <div className="card reveal reveal-delay-2">
                <div className="ab-team-photo">
                  <div className="ab-team-initials">GK</div>
                </div>
                <h3>{t.grethelName}</h3>
                <div className="ab-team-role">{t.grethelRole}</div>
                <p>{t.grethelBio}</p>
              </div>
              <div className="card reveal reveal-delay-3">
                <div className="ab-team-photo">
                  <div className="ab-team-initials">JV</div>
                </div>
                <h3>{t.jetName}</h3>
                <div className="ab-team-role">{t.jetRole}</div>
                <p>{t.jetBio}</p>
              </div>
              <div className="card reveal reveal-delay-1">
                <div className="ab-team-photo">
                  <div className="ab-team-initials">LV</div>
                </div>
                <h3>{t.luisName}</h3>
                <div className="ab-team-role">{t.luisRole}</div>
                <p>{t.luisBio}</p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="ab-values">
            <div className="ab-values-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.valuesEyebrow}</div>
              <h2 className="section-title">{t.valuesTitle} <em>{t.valuesTitleEm}</em></h2>
            </div>
            <div className="ab-values-grid">
              <div className="card reveal reveal-delay-1">
                <div className="ab-value-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3>{t.transparency}</h3>
                <p>{t.transparencyDesc}</p>
              </div>
              <div className="card reveal reveal-delay-2">
                <div className="ab-value-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3>{t.integrity}</h3>
                <p>{t.integrityDesc}</p>
              </div>
              <div className="card reveal reveal-delay-3">
                <div className="ab-value-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3>{t.operationalExcellence}</h3>
                <p>{t.operationalExcellenceDesc}</p>
              </div>
              <div className="card reveal">
                <div className="ab-value-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h3>{t.communityImpact}</h3>
                <p>{t.communityImpactDesc}</p>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="ab-testimonials">
            <div className="ab-testimonials-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">{t.testimonialsEyebrow}</div>
              <h2 className="section-title">{t.testimonialsTitle} <em>{t.testimonialsTitleEm}</em></h2>
            </div>
            <div className="ab-testimonials-grid">
              <div className="test-card reveal reveal-delay-1">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;I have invested as an LP alongside Dylan and the Requity Group team across multiple asset classes over several geographic markets. Their reporting style and communication cadence is timely, consistent, and detailed, and I always feel well-informed on my investments.&rdquo;</div>
                <div className="author-name">Todd G.</div>
                <div className="author-role">Limited Partner</div>
              </div>
              <div className="test-card reveal reveal-delay-2">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;As a seasoned real estate investor with over 18 years of experience, I have worked with a wide variety of operators. What stands out about Dylan and the team at Requity is their detailed property-level reporting and consistent communication.&rdquo;</div>
                <div className="author-name">Ben E.</div>
                <div className="author-role">Limited Partner</div>
              </div>
              <div className="test-card reveal reveal-delay-3">
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
              <div className="test-card reveal reveal-delay-2">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;Dylan and his team at TRG have re-positioned Royal Valley over the past 3 years and turned it into a wonderful investment with great cash flow, along with increasing its market value by 40%.&rdquo;</div>
                <div className="author-name">Jeffrey C.</div>
                <div className="author-role">Limited Partner — 35 Years in CRE</div>
              </div>
              <div className="test-card reveal reveal-delay-3">
                <div className="big-q">&ldquo;</div>
                <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
                <div className="quote-text">&ldquo;My investments with the Requity Group have been my 2 favorite investments so far. Payouts have been on time, as discussed, and there has been zero headache at all. Dylan has been prompt and professional.&rdquo;</div>
                <div className="author-name">Chad M.</div>
                <div className="author-role">Limited Partner</div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="ab-cta">
            <div className="ab-cta-banner reveal">
              <div className="ab-cta-content">
                <div className="section-eyebrow">{t.ctaEyebrow}</div>
                <h2 className="section-title section-title-light">{t.ctaTitle} <em>{t.ctaTitleEm}</em></h2>
                <p className="section-desc section-desc-light" style={{ maxWidth: 520, margin: '0 auto 40px' }}>
                  {t.ctaDesc}
                </p>
                <div className="ab-cta-actions">
                  <Link href="/income-fund" className="btn-primary">
                    {t.ctaIncomeFund} <ArrowIcon />
                  </Link>
                  <Link href="/lending" className="btn-secondary">
                    {t.ctaLending} <ArrowIcon />
                  </Link>
                </div>
              </div>
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

const aboutPageStyles = `
  /* ── Hero ── */
  .ab-hero {
    position: relative;
    min-height: 520px;
    display: flex;
    flex-direction: column;
  }
  .ab-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg,
        rgba(8,21,37,0.5) 0%,
        rgba(8,21,37,0.15) 40%,
        rgba(8,21,37,0.7) 75%,
        var(--navy-deep) 100%),
      radial-gradient(ellipse at 70% 20%, rgba(198,169,98,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 20% 80%, rgba(30,65,112,0.12) 0%, transparent 50%);
    pointer-events: none;
  }
  .ab-hero > * { position: relative; z-index: 2; }
  .ab-hero nav { position: relative; }

  .ab-hero-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 84px 48px 60px;
  }
  .ab-hero-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--champagne);
    margin-bottom: 28px;
    display: flex; align-items: center; gap: 16px;
  }
  .ab-hero-eyebrow::before,
  .ab-hero-eyebrow::after {
    content: ''; width: 40px; height: 1px;
    background: linear-gradient(to right, transparent, rgba(212,197,169,0.4), transparent);
  }
  .ab-hero-body h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 62px);
    font-weight: 500; color: #fff;
    line-height: 1.08; letter-spacing: -0.01em;
    max-width: 800px; margin-bottom: 24px;
  }
  .ab-hero-body h1 em {
    font-style: italic; font-weight: 400; color: var(--champagne);
  }
  .ab-hero-p {
    font-size: 16px; font-weight: 400;
    color: rgba(255,255,255,0.42);
    max-width: 600px; line-height: 1.7;
  }
  @media (max-width: 968px) {
    .ab-hero-body { padding: 72px 32px 48px; }
  }
  @media (max-width: 600px) {
    .ab-hero-body { padding: 60px 20px 40px; }
    .ab-hero-p { font-size: 15px; }
  }

  /* ── Mission ── */
  .ab-mission {
    padding: 40px 0 0;
  }
  .ab-mission-content {
    margin-bottom: 48px;
  }
  .ab-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .ab-stat-card {
    background: var(--white);
    border: 1px solid rgba(8,21,37,0.06);
    border-radius: 16px;
    padding: 36px 28px;
    text-align: center;
    transition: all 0.3s;
  }
  .ab-stat-card:hover {
    border-color: rgba(14,34,64,0.12);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(8,21,37,0.07);
  }
  .ab-stat-value {
    font-family: var(--font-display);
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 600;
    color: var(--navy);
    line-height: 1;
    margin-bottom: 8px;
  }
  .ab-stat-card:nth-child(odd) .ab-stat-value {
    color: var(--champagne-dk);
  }
  .ab-stat-label {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 500;
  }
  @media (max-width: 768px) {
    .ab-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .ab-stats-grid { grid-template-columns: 1fr; }
  }

  /* ── Three Pillars ── */
  .ab-pillars {
    padding: clamp(48px, 8vw, 80px) 0 0;
  }
  .ab-pillars-header {
    margin-bottom: 48px;
  }
  .ab-pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .ab-pillars-grid .card {
    display: flex;
    flex-direction: column;
  }
  .ab-pillar-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(14,34,64,0.06);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px; color: var(--navy-mid);
  }
  .ab-pillar-number {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    color: var(--navy-muted);
    letter-spacing: 0.06em;
    margin-bottom: 12px;
  }
  .ab-pillars-grid .card h3 {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 12px;
  }
  .ab-pillars-grid .card p {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
    flex-grow: 1;
  }
  .ab-pillar-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--champagne-dk);
    text-decoration: none;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(8,21,37,0.06);
    transition: gap 0.3s;
  }
  .ab-pillar-link:hover { gap: 14px; color: var(--champagne); }
  @media (max-width: 968px) {
    .ab-pillars-grid { grid-template-columns: 1fr; }
  }

  /* ── Team ── */
  .ab-team {
    padding: clamp(48px, 8vw, 80px) 0 0;
  }
  .ab-team-header {
    margin-bottom: 48px;
  }
  .ab-team-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .ab-team-grid .card h3 {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 4px;
  }
  .ab-team-grid .card p {
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
  }
  .ab-team-photo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(14,34,64,0.08), rgba(14,34,64,0.04));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }
  .ab-team-initials {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 500;
    color: var(--navy-muted);
  }
  .ab-team-role {
    font-size: 11px;
    color: var(--champagne-dk);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 16px;
  }
  @media (max-width: 968px) {
    .ab-team-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .ab-team-grid { grid-template-columns: 1fr; }
  }

  /* ── Values ── */
  .ab-values {
    padding: clamp(48px, 8vw, 80px) 0 0;
  }
  .ab-values-header {
    text-align: center;
    margin-bottom: 48px;
  }
  .ab-values-header .section-title {
    max-width: 500px;
    margin: 0 auto 20px;
  }
  .ab-values-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .ab-value-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(14,34,64,0.06);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; color: var(--navy-mid);
  }
  .ab-values-grid .card h3 {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 10px;
  }
  .ab-values-grid .card p {
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
  }
  @media (max-width: 968px) {
    .ab-values-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .ab-values-grid { grid-template-columns: 1fr; }
  }

  /* ── Testimonials ── */
  .ab-testimonials {
    padding: clamp(48px, 8vw, 80px) 0 0;
  }
  .ab-testimonials-header {
    margin-bottom: 48px;
  }
  .ab-testimonials-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 968px) {
    .ab-testimonials-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .ab-testimonials-grid { grid-template-columns: 1fr; }
  }

  /* ── CTA ── */
  .ab-cta {
    padding: clamp(48px, 8vw, 80px) 0 0;
  }
  .ab-cta-banner {
    background: linear-gradient(135deg, var(--navy-deep), var(--navy));
    border-radius: 18px;
    padding: clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .ab-cta-banner::before {
    content: ''; position: absolute; right: -60px; top: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(30,65,112,0.18); pointer-events: none;
  }
  .ab-cta-banner::after {
    content: ''; position: absolute; left: 20%; bottom: -100px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(212,197,169,0.04); pointer-events: none;
  }
  .ab-cta-content {
    position: relative;
    z-index: 1;
  }
  .ab-cta-content .section-eyebrow { text-align: center; }
  .ab-cta-content .section-title { text-align: center; }
  .ab-cta-content .section-desc { text-align: center; }
  .ab-cta-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
  }
  @media (max-width: 600px) {
    .ab-cta-actions { flex-direction: column; width: 100%; }
    .ab-cta-actions .btn-primary,
    .ab-cta-actions .btn-secondary { width: 100%; justify-content: center; }
    .ab-cta-banner { border-radius: 14px; }
  }

  /* Footer spacing */
  footer { margin-top: 80px; }
`;
