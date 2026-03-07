'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

const INSIGHTS = [
  {
    id: 'decoding-syndication-legal-docs',
    title: 'Decoding: Real Estate Syndication Legal Documents',
    date: 'August 2023',
    category: 'Education',
    image: 'https://requitygroup.com/wp-content/uploads/2023/08/0993e7b6-f899-4080-aec3-5c9c0328319d-1024x576.jpg',
    excerpt: 'A comprehensive breakdown of the key legal documents involved in real estate syndication — from private placement memorandums to subscription agreements — and what investors should look for.',
  },
  {
    id: 'hiring-best-practices',
    title: 'Hiring Best Practices',
    date: 'August 2023',
    category: 'Operations',
    image: 'https://requitygroup.com/wp-content/uploads/2023/08/hiringbestpractices-1024x576.jpeg',
    excerpt: 'How to avoid hiring bias and use experiential interview questions to uncover problem-solving skills, resilience, and cultural fit when building your real estate operations team.',
  },
  {
    id: 'acquisitions-best-practices',
    title: 'Acquisitions Best Practices with Troy Trecroce',
    date: 'August 2023',
    category: 'Acquisitions',
    image: 'https://requitygroup.com/wp-content/uploads/2023/08/thumbnail-1-version-2-2-1024x576.png',
    excerpt: 'Troy Trecroce joins Requity Insights to discuss best practices for sourcing, underwriting, and closing off-market real estate acquisitions in competitive markets.',
  },
  {
    id: 'seasonal-rv-campgrounds',
    title: 'Why Seasonal RV Campgrounds Are a Hidden Gem',
    date: 'July 2023',
    category: 'Asset Class',
    image: 'https://requitygroup.com/wp-content/uploads/2024/07/210-Conner-Heights-Rd-Pigeon-Forge-TN-76_1280x600-1024x475.webp',
    excerpt: 'Seasonal RV campgrounds are one of the least understood gems in real estate. Unlike transient campgrounds, seasonal parks feature owners who pay 12 months up front — creating predictable, recession-resistant cash flow.',
  },
  {
    id: 'seller-financing-rv-parks',
    title: 'Seller Financing for RV Parks & Campgrounds',
    date: 'June 2023',
    category: 'Acquisitions',
    image: 'https://requitygroup.com/wp-content/uploads/2024/11/royal_valley_jacksonville_nc-1024x421.webp',
    excerpt: 'How seller financing allows sellers to monetize their property with tax advantages and cash flow benefits — and why understanding the seller\'s circumstances creates mutually beneficial deal structures.',
  },
  {
    id: 'manufactured-housing-opportunity',
    title: 'The Manufactured Housing Opportunity',
    date: 'May 2023',
    category: 'Asset Class',
    image: 'https://requitygroup.com/wp-content/uploads/2024/07/large-4026-Spring-Place-Rd-SE-Cleveland-TN-7_1280x600-1024x475.webp',
    excerpt: 'Manufactured housing communities represent one of the most resilient asset classes in commercial real estate. We explore why this affordable housing niche continues to outperform.',
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(INSIGHTS.map(i => i.category)))];

export default function InsightsPage() {
  const { lang } = useLanguage();
  const t = translations.insights[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];
  const [activeCategory, setActiveCategory] = useState('All');

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

  useEffect(() => {
    const reveals = document.querySelectorAll('.in-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    reveals.forEach(el => {
      el.classList.remove('visible');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [activeCategory]);

  const filteredInsights = activeCategory === 'All'
    ? INSIGHTS
    : INSIGHTS.filter(i => i.category === activeCategory);

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <style>{insightsPageStyles}</style>

      {/* ══════ DARK ZONE ══════ */}
      <div className="dark-zone">

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
            <button className="mobile-toggle" id="mobileToggle" aria-label="Menu"><span></span><span></span><span></span></button>
          </div>
        </nav>

        {/* Hero */}
        <section className="in-hero">
          <div className="container">
            <div className="in-hero-content">
              <div className="section-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>{t.heroEyebrow}</div>
              <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>{t.heroTitle} &amp;<br /><em>{t.heroTitleEm}</em></h1>
              <p className="in-hero-desc" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
                {t.heroDesc}
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* Curved transition */}
      <div className="dark-to-light" />

      {/* ══════ LIGHT ZONE ══════ */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Featured Article */}
          <section className="in-featured">
            <div className="in-featured-card reveal">
              <div className="in-featured-image">
                <img src={INSIGHTS[0].image} alt={INSIGHTS[0].title} loading="lazy" />
              </div>
              <div className="in-featured-content">
                <div className="in-featured-meta">
                  <span className="in-category-badge">{INSIGHTS[0].category}</span>
                  <span className="in-date">{INSIGHTS[0].date}</span>
                </div>
                <h2>{INSIGHTS[0].title}</h2>
                <p>{INSIGHTS[0].excerpt}</p>
                <span className="in-read-more">Read Article <ArrowIcon /></span>
              </div>
            </div>
          </section>

          {/* Articles Grid */}
          <section className="in-articles">
            <div className="in-articles-header reveal">
              <div className="section-eyebrow section-eyebrow-dark">All Articles</div>
              <h2 className="section-title">Browse by Topic</h2>
            </div>
            <div className="in-filters reveal">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`in-filter-btn${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="in-articles-grid">
              {filteredInsights.map((insight, i) => (
                <div key={insight.id} className={`in-card reveal${i < 3 ? ` reveal-delay-${i + 1}` : ''}`}>
                  <div className="in-card-image">
                    <img src={insight.image} alt={insight.title} loading="lazy" />
                  </div>
                  <div className="in-card-body">
                    <div className="in-card-meta">
                      <span className="in-category-badge">{insight.category}</span>
                      <span className="in-date">{insight.date}</span>
                    </div>
                    <h3>{insight.title}</h3>
                    <p>{insight.excerpt}</p>
                    <span className="in-read-more">Read Article <ArrowIcon /></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="in-newsletter">
            <div className="in-newsletter-banner lending-cta-banner reveal">
              <div>
                <h3>Stay <em>Informed</em></h3>
                <p>Market updates, asset class deep dives, and investment perspectives — delivered directly from our team.</p>
              </div>
              <Link href="/#invest" className="btn-primary" style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>Join Our Investor List <ArrowIcon /></Link>
            </div>
          </section>

          {/* CTA */}
          <section className="in-cta">
            <div className="in-cta-inner reveal">
              <div className="section-eyebrow section-eyebrow-dark">Get Started</div>
              <h2 className="section-title" style={{ textAlign: 'center' }}>Ready to Invest?</h2>
              <p className="section-desc" style={{ maxWidth: 560, margin: '0 auto 40px', textAlign: 'center' }}>
                Join our community of sophisticated investors earning consistent, asset-backed returns through the Requity Income Fund.
              </p>
              <div style={{ textAlign: 'center' }}>
                <Link href="/income-fund" className="btn-primary-light">
                  Explore the Income Fund <ArrowIcon />
                </Link>
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

const insightsPageStyles = `
  /* ── Hero ── */
  .in-hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  .in-hero::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -15%;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(198,169,98,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .in-hero-content {
    max-width: 800px;
    padding: clamp(100px, 15vw, 160px) 0 clamp(48px, 8vw, 80px);
  }
  .in-hero h1 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 62px);
    font-weight: 400;
    line-height: 1.1;
    color: #fff;
    margin-bottom: 28px;
  }
  .in-hero h1 em {
    font-style: italic;
    color: var(--champagne);
  }
  .in-hero-desc {
    font-size: clamp(15px, 2vw, 18px);
    line-height: 1.75;
    color: rgba(255,255,255,0.55);
    max-width: 640px;
    font-weight: 400;
  }

  /* ── Featured Article (light zone) ── */
  .in-featured {
    padding: 40px 0 60px;
  }
  .in-featured-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    background: var(--white);
    border: 1px solid rgba(8,21,37,0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .in-featured-card:hover {
    border-color: rgba(14,34,64,0.12);
    box-shadow: 0 16px 48px rgba(8,21,37,0.08);
    transform: translateY(-3px);
  }
  .in-featured-image {
    overflow: hidden;
  }
  .in-featured-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .in-featured-card:hover .in-featured-image img {
    transform: scale(1.05);
  }
  .in-featured-content {
    padding: clamp(24px, 4vw, 48px) clamp(20px, 4vw, 44px);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .in-featured-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .in-category-badge {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--champagne-dk);
    padding: 5px 12px;
    border: 1px solid rgba(176,149,69,0.25);
    border-radius: 4px;
    font-weight: 600;
    background: rgba(198,169,98,0.06);
  }
  .in-date {
    font-size: 13px;
    color: var(--text-muted);
  }
  .in-featured-content h2 {
    font-family: var(--font-display);
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 500;
    line-height: 1.25;
    margin-bottom: 16px;
    color: var(--text-dark);
  }
  .in-featured-content p {
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
    margin-bottom: 28px;
  }
  .in-read-more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--champagne-dk);
    transition: gap 0.3s;
    cursor: pointer;
  }
  .in-read-more:hover { gap: 14px; }
  @media (max-width: 968px) {
    .in-featured-card { grid-template-columns: 1fr; }
    .in-featured-image { aspect-ratio: 16/9; }
    .in-featured-content { padding: 32px 28px; }
  }

  /* ── Articles (light zone) ── */
  .in-articles {
    padding: 40px 0 60px;
  }
  .in-articles-header {
    margin-bottom: 28px;
  }
  .in-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }
  .in-filter-btn {
    padding: 10px 24px;
    min-height: 44px;
    background: transparent;
    border: 1px solid rgba(8,21,37,0.1);
    border-radius: 6px;
    color: var(--text-muted);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.25s;
  }
  .in-filter-btn:hover {
    border-color: rgba(176,149,69,0.35);
    color: var(--champagne-dk);
    background: rgba(198,169,98,0.04);
  }
  .in-filter-btn.active {
    background: var(--champagne);
    border-color: var(--champagne);
    color: var(--navy-deep);
    font-weight: 600;
  }
  .in-articles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }
  .in-card {
    background: var(--white);
    border: 1px solid rgba(8,21,37,0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
  }
  .in-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, var(--navy-mid), var(--champagne));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
  }
  .in-card:hover::after { transform: scaleX(1); }
  .in-card:hover {
    border-color: rgba(14,34,64,0.12);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(8,21,37,0.07);
  }
  .in-card-image {
    overflow: hidden;
    aspect-ratio: 16/9;
  }
  .in-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .in-card:hover .in-card-image img {
    transform: scale(1.06);
  }
  .in-card-body {
    padding: 28px 28px 32px;
  }
  .in-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .in-card-body h3 {
    font-family: var(--font-display);
    font-size: 21px;
    font-weight: 500;
    line-height: 1.3;
    margin-bottom: 10px;
    color: var(--text-dark);
    transition: color 0.3s;
  }
  .in-card:hover .in-card-body h3 {
    color: var(--navy-muted);
  }
  .in-card-body p {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-muted);
    font-weight: 400;
    margin-bottom: 20px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  @media (max-width: 968px) {
    .in-articles-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .in-articles-grid { grid-template-columns: 1fr; }
    .in-card-body { padding: 24px; }
  }

  /* ── Newsletter CTA (dark rounded banner) ── */
  .in-newsletter {
    padding: 20px 0 60px;
  }

  /* ── CTA Section ── */
  .in-cta {
    padding: 40px 0 60px;
  }
  .in-cta-inner {
    text-align: center;
  }
  .in-cta-inner .section-eyebrow {
    text-align: center;
  }

  /* ── Footer spacing ── */
  footer { margin-top: 0; }
`;
