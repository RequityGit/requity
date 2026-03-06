// @ts-nocheck
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

export default function HomePage() {
  const { lang } = useLanguage();
  const t = translations.home[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];

  useEffect(() => {
    const navbar = document.querySelector('nav');
    const handleScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);

    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    mobileToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));
    navLinks?.querySelectorAll('a').forEach(l =>
      l.addEventListener('click', () => navLinks?.classList.remove('open'))
    );

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

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <style>{homeStyles}</style>

      {/* ══════ DARK ZONE ══════ */}
      <div className="dark-zone">
        <div className="hp-hero">
          {/* Nav */}
          <nav>
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

          {/* Hero content */}
          <div className="hp-hero-body">
            <div className="hp-hero-eyebrow">{t.heroEyebrow}</div>
            <h1>{t.heroTitle1} <em>{t.heroTitleEm}</em> {t.heroTitle2}</h1>
            <p className="hp-hero-p">{t.heroDesc}</p>
            <div className="hp-hero-btns">
              <Link href="/request-access" className="btn-primary">{t.requestAccess} <ArrowIcon /></Link>
              <Link href="/apply" className="btn-primary">{t.requestLoan} <ArrowIcon /></Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar" style={{ margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="stat-cell"><div className="stat-num champagne">$150M+</div><div className="stat-lbl">{t.statAum}</div></div>
          <div className="stat-cell"><div className="stat-num">32</div><div className="stat-lbl">{t.statProperties}</div></div>
          <div className="stat-cell"><div className="stat-num">70+</div><div className="stat-lbl">{t.statLoans}</div></div>
          <div className="stat-cell"><div className="stat-num champagne">$70M+</div><div className="stat-lbl">{t.statCapital}</div></div>
        </div>

        <div style={{ height: 64, background: 'var(--navy-deep)' }} />
      </div>

      {/* Curved transition */}
      <div className="dark-to-light" />

      {/* ══════ LIGHT ZONE ══════ */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* What We Do */}
          <section className="hp-wwd">
            <div className="hp-wwd-header">
              <h2 className="reveal">{t.wwdTitle1}<br />{t.wwdTitle2} <em>{t.wwdTitleEm}</em> {t.wwdTitle3}</h2>
              <p className="reveal reveal-delay-1">{t.wwdDesc}</p>
            </div>
            <div className="hp-card-grid">
              <div className="card reveal reveal-delay-1">
                <div className="hp-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3>{t.cardInvest}</h3>
                <p>{t.cardInvestDesc}</p>
                <div className="hp-metric-row">
                  <span className="hp-metric-num">32</span>
                  <span className="hp-metric-lbl">{t.cardPropertiesAcquired}</span>
                </div>
              </div>
              <div className="card reveal reveal-delay-2">
                <div className="hp-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3>{t.cardOperate}</h3>
                <p>{t.cardOperateDesc}</p>
                <div className="hp-metric-row">
                  <span className="hp-metric-num accent">$150M+</span>
                  <span className="hp-metric-lbl">{t.cardUnderManagement}</span>
                </div>
              </div>
              <div className="card reveal reveal-delay-3">
                <div className="hp-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                </div>
                <h3>{t.cardLend}</h3>
                <p>{t.cardLendDesc}</p>
                <div className="hp-metric-row">
                  <span className="hp-metric-num">70+</span>
                  <span className="hp-metric-lbl">{t.cardLoansOriginated}</span>
                </div>
              </div>
            </div>

            {/* Lending CTA */}
            <div className="lending-cta-banner reveal" style={{ marginTop: 24 }}>
              <div>
                <h3>{t.bridgeTitle1} <em>{t.bridgeTitleEm}</em></h3>
                <p>{t.bridgeDesc}</p>
              </div>
              <Link href="/apply" className="btn-primary" style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>{t.requestQuote} <ArrowIcon /></Link>
            </div>
          </section>

          {/* Testimonials */}
          <div className="hp-testimonials">
            <div className="test-card reveal">
              <div className="big-q">&ldquo;</div>
              <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
              <div className="quote-text">{t.testimonial1}</div>
              <div className="author-name">{t.testimonial1Author}</div>
              <div className="author-role">{t.testimonial1Role}</div>
            </div>
            <div className="test-card reveal reveal-delay-1">
              <div className="big-q">&ldquo;</div>
              <div className="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
              <div className="quote-text">{t.testimonial2}</div>
              <div className="author-name">{t.testimonial2Author}</div>
              <div className="author-role">{t.testimonial2Role}</div>
            </div>
          </div>

          {/* Values */}
          <div className="hp-values">
            <div className="value-item reveal reveal-delay-1">
              <div className="value-num">01</div>
              <h4>{t.value1Title}</h4>
              <p>{t.value1Desc}</p>
            </div>
            <div className="value-item reveal reveal-delay-2">
              <div className="value-num">02</div>
              <h4>{t.value2Title}</h4>
              <p>{t.value2Desc}</p>
            </div>
            <div className="value-item reveal reveal-delay-3">
              <div className="value-num">03</div>
              <h4>{t.value3Title}</h4>
              <p>{t.value3Desc}</p>
            </div>
          </div>

          {/* Insights */}
          <div className="hp-insights">
            <div className="hp-insights-header reveal">
              <h2>{t.recentInsights}</h2>
              <Link href="/insights">{t.seeAll} &rarr;</Link>
            </div>
            <div className="hp-insights-grid">
              <div className="hp-insight-card reveal reveal-delay-1">
                <div className="hp-insight-img"><div className="hp-play-icon">&#9654;</div></div>
                <div className="hp-insight-body">
                  <div className="hp-insight-tag">{t.insight1Tag}</div>
                  <h3>{t.insight1Title}</h3>
                  <p>{t.insight1Desc}</p>
                </div>
              </div>
              <div className="hp-insight-card reveal reveal-delay-2">
                <div className="hp-insight-img" style={{ background: 'linear-gradient(135deg, var(--navy-mid), var(--navy-light))' }}><div className="hp-play-icon">&#9654;</div></div>
                <div className="hp-insight-body">
                  <div className="hp-insight-tag">{t.insight2Tag}</div>
                  <h3>{t.insight2Title}</h3>
                  <p>{t.insight2Desc}</p>
                </div>
              </div>
              <div className="hp-insight-card reveal reveal-delay-3">
                <div className="hp-insight-img" style={{ background: 'linear-gradient(135deg, var(--navy-light), var(--navy-muted))' }}><div className="hp-play-icon">&#9654;</div></div>
                <div className="hp-insight-body">
                  <div className="hp-insight-tag">{t.insight3Tag}</div>
                  <h3>{t.insight3Title}</h3>
                  <p>{t.insight3Desc}</p>
                </div>
              </div>
            </div>
          </div>

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

const homeStyles = `
  /* ── Hero ── */
  .hp-hero {
    position: relative;
    min-height: 640px;
    display: flex;
    flex-direction: column;
  }
  .hp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url('https://requitygroup.com/wp-content/uploads/2024/11/royal_valley_jacksonville_nc-1024x421.webp');
    background-size: cover;
    background-position: center 30%;
    opacity: 0.14;
    filter: saturate(0.2);
  }
  .hp-hero::after {
    content: '';
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg,
        rgba(8,21,37,0.6) 0%,
        rgba(8,21,37,0.2) 35%,
        rgba(8,21,37,0.75) 72%,
        var(--navy-deep) 100%),
      radial-gradient(ellipse at 25% 60%, rgba(30,65,112,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 30%, rgba(212,197,169,0.05) 0%, transparent 40%);
  }
  .hp-hero > * { position: relative; z-index: 2; }
  .hp-hero nav { position: relative; }

  .hp-hero-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 84px 48px 76px;
    animation: fadeUp 0.8s ease both;
  }
  .hp-hero-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--champagne);
    margin-bottom: 28px;
    display: flex; align-items: center; gap: 16px;
  }
  .hp-hero-eyebrow::before,
  .hp-hero-eyebrow::after {
    content: ''; width: 40px; height: 1px;
    background: linear-gradient(to right, transparent, rgba(212,197,169,0.4), transparent);
  }
  .hp-hero-body h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 62px);
    font-weight: 500; color: #fff;
    line-height: 1.08; letter-spacing: -0.01em;
    max-width: 780px; margin-bottom: 24px;
  }
  .hp-hero-body h1 em {
    font-style: italic; font-weight: 400; color: var(--champagne);
  }
  .hp-hero-p {
    font-size: 16px; font-weight: 400;
    color: rgba(255,255,255,0.42);
    max-width: 500px; line-height: 1.7; margin-bottom: 36px;
  }
  .hp-hero-btns { display: flex; gap: 16px; align-items: center; }
  @media (max-width: 968px) {
    .hp-hero-body { padding: 72px 32px 60px; }
  }
  @media (max-width: 600px) {
    .hp-hero-body { padding: 60px 20px; }
    .hp-hero-btns { flex-direction: column; width: 100%; }
    .hp-hero-btns .btn-primary,
    .hp-hero-btns .btn-secondary { width: 100%; justify-content: center; }
    .hp-hero-p { font-size: 15px; }
  }

  /* ── What We Do ── */
  .hp-wwd { padding: 40px 0 64px; }
  .hp-wwd-header {
    display: grid; grid-template-columns: 0.45fr 0.55fr;
    gap: 48px; align-items: end; margin-bottom: 48px;
  }
  .hp-wwd-header h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 40px);
    font-weight: 500; color: var(--text-dark); line-height: 1.12;
  }
  .hp-wwd-header h2 em { font-style: italic; color: var(--champagne-dk); font-weight: 400; }
  .hp-wwd-header p {
    font-size: 15px; color: var(--text-muted);
    line-height: 1.7; max-width: 460px;
  }
  .hp-card-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .hp-card-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(14,34,64,0.06);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px; color: var(--navy-mid);
  }
  .card h3 {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 600;
    color: var(--text-dark); margin-bottom: 10px;
  }
  .card p {
    font-size: 14px; color: var(--text-muted);
    line-height: 1.65; margin-bottom: 28px;
  }
  .hp-metric-row {
    padding-top: 20px; border-top: 1px solid rgba(8,21,37,0.06);
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .hp-metric-num {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 600; color: var(--navy); line-height: 1;
  }
  .hp-metric-num.accent { color: var(--navy-light); }
  .hp-metric-lbl {
    font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba(8,21,37,0.3); font-weight: 500;
  }
  @media (max-width: 900px) {
    .hp-wwd-header { grid-template-columns: 1fr; gap: 20px; }
    .hp-card-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .hp-wwd { padding: 24px 0 48px; }
  }

  /* ── Testimonials ── */
  .hp-testimonials {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin-top: 56px;
  }
  @media (max-width: 900px) { .hp-testimonials { grid-template-columns: 1fr; margin-top: 40px; } }

  /* ── Values ── */
  .hp-values {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 56px;
  }
  @media (max-width: 900px) { .hp-values { grid-template-columns: 1fr; margin-top: 40px; } }

  /* ── Insights ── */
  .hp-insights { margin-top: 56px; }
  .hp-insights-header {
    display: flex; justify-content: space-between;
    align-items: baseline; margin-bottom: 28px;
  }
  .hp-insights-header h2 {
    font-family: var(--font-display);
    font-size: 30px; font-weight: 500; color: var(--text-dark);
  }
  .hp-insights-header a {
    font-size: 13px; color: var(--navy-muted);
    text-decoration: none; font-weight: 600; transition: color 0.2s;
  }
  .hp-insights-header a:hover { color: var(--navy); }
  .hp-insights-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .hp-insight-card {
    background: var(--white); border: 1px solid rgba(8,21,37,0.06);
    border-radius: 14px; overflow: hidden; transition: all 0.3s;
    text-decoration: none; color: inherit;
  }
  .hp-insight-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(8,21,37,0.07);
  }
  .hp-insight-img {
    height: 160px;
    background: linear-gradient(135deg, var(--navy), var(--navy-mid));
    display: flex; align-items: center; justify-content: center;
  }
  .hp-play-icon {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 14px;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .hp-insight-body { padding: 24px; }
  .hp-insight-tag {
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--navy-muted); margin-bottom: 10px;
  }
  .hp-insight-body h3 {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 600;
    color: var(--text-dark); line-height: 1.3; margin-bottom: 8px;
  }
  .hp-insight-body p {
    font-size: 13px; color: var(--text-muted); line-height: 1.55;
  }
  @media (max-width: 900px) { .hp-insights-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .hp-insights-grid { grid-template-columns: 1fr; } }

  /* Footer spacing */
  footer { margin-top: 64px; }
`;
