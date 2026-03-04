'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

const INVESTOR_FAQS = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is the Requity Income Fund?',
        a: 'The Requity Income Fund is a private real estate credit fund that provides accredited investors with access to a diversified portfolio of real estate debt and equity positions. The fund generates consistent monthly distributions backed by tangible real estate assets with conservative underwriting.',
      },
      {
        q: 'Who is eligible to invest?',
        a: 'The Requity Income Fund is available exclusively to accredited investors as defined by SEC Regulation D, Rule 506(c). An accredited investor generally includes individuals with a net worth exceeding $1 million (excluding primary residence) or annual income exceeding $200,000 ($300,000 jointly with a spouse) for the past two years.',
      },
      {
        q: 'How do I get started with investing?',
        a: 'Getting started is simple. Submit a request through our Request Access page, and our investor relations team will provide you with the fund offering documents, including the Private Placement Memorandum (PPM). After reviewing the materials, you can complete the subscription agreement and fund your investment through our secure portal.',
      },
      {
        q: 'Is there a minimum investment amount?',
        a: 'Yes, there is a minimum investment amount to participate in the Requity Income Fund. Please contact our investor relations team or submit a Request Access form to receive detailed information about the current minimum investment requirements and fund terms.',
      },
    ],
  },
  {
    category: 'Returns & Distributions',
    questions: [
      {
        q: 'How often are distributions paid?',
        a: 'Distributions are paid monthly and deposited directly into your bank account. Our distributions have been paid on time, every month, since the fund\u2019s inception.',
      },
      {
        q: 'What kind of returns can I expect?',
        a: 'The fund targets competitive risk-adjusted returns generated through a diversified portfolio of real estate debt and equity positions. Specific target returns are detailed in the Private Placement Memorandum. Past performance is not indicative of future results, and all investments carry risk, including potential loss of principal.',
      },
      {
        q: 'How are distributions calculated?',
        a: 'Distributions are calculated based on the fund\u2019s net income from its portfolio of real estate loans and equity positions, allocated proportionally to each investor\u2019s capital account balance. The fund\u2019s income is generated primarily through interest payments on loans and cash flow from equity positions.',
      },
      {
        q: 'Are distributions reinvested or paid out?',
        a: 'By default, distributions are paid out directly to your designated bank account each month. If you prefer to reinvest your distributions to compound your returns, please discuss this option with our investor relations team.',
      },
    ],
  },
  {
    category: 'Fund Structure & Strategy',
    questions: [
      {
        q: 'What is the fund\u2019s legal structure?',
        a: 'The Requity Income Fund is structured as a Regulation D, Rule 506(c) private placement offering. This structure is designed for accredited investors and allows the fund to operate with the flexibility needed to pursue attractive real estate credit opportunities.',
      },
      {
        q: 'What types of assets does the fund invest in?',
        a: 'The fund deploys capital across a diversified mix of real estate debt and equity positions, focusing on asset types where our operational expertise provides an information advantage. This includes bridge loans, manufactured housing communities, RV parks and campgrounds, and multifamily residential properties.',
      },
      {
        q: 'How is my investment secured?',
        a: 'Every dollar in the fund is backed by tangible real estate assets. Loans are secured by the underlying properties with conservative loan-to-value ratios. Our vertically integrated model means we have deep knowledge of the assets backing each investment, providing an additional layer of risk management.',
      },
      {
        q: 'How does Requity manage risk?',
        a: 'Risk management is at the core of our approach. We maintain conservative loan-to-value ratios, diversify across multiple loans, property types, and geographic markets, and leverage our operational expertise to underwrite deals more thoroughly. Our hands-on experience as real estate operators gives us insight that purely financial lenders lack.',
      },
    ],
  },
  {
    category: 'Reporting & Transparency',
    questions: [
      {
        q: 'What reporting will I receive as an investor?',
        a: 'Investors receive detailed monthly and quarterly reports covering fund performance, portfolio composition, and individual loan-level details. Reports are accessible through the AppFolio Investment Manager portal. Our commitment to transparency means you always know exactly where your capital is deployed.',
      },
      {
        q: 'How do I access my investor portal?',
        a: 'All investors have access to the AppFolio Investment Manager portal, which provides real-time visibility into your investment, distribution history, tax documents, and fund reporting. You can log in through the Investor Login link on our website.',
      },
      {
        q: 'Is the fund independently audited?',
        a: 'Yes, the Requity Income Fund undergoes third-party audits to ensure transparency and accuracy in financial reporting. The fund also utilizes a third-party fund administrator to independently track and verify all investor capital accounts and distributions.',
      },
      {
        q: 'Will I receive tax documents?',
        a: 'Yes, investors receive a Schedule K-1 annually, which reports your share of the fund\u2019s income, gains, losses, and deductions for the tax year. K-1s are made available through the investor portal. We recommend consulting with a qualified tax advisor regarding the tax implications of your investment.',
      },
    ],
  },
  {
    category: 'Liquidity & Redemptions',
    questions: [
      {
        q: 'Can I redeem my investment at any time?',
        a: 'The fund has specific redemption provisions outlined in the Private Placement Memorandum. While the fund is designed as a longer-term investment, there are provisions for capital redemption subject to certain terms and notice periods. Please review the PPM or contact our investor relations team for specific details.',
      },
      {
        q: 'How is the fund different from a REIT?',
        a: 'Unlike publicly traded REITs, the Requity Income Fund is a private placement offering that provides direct access to a curated portfolio of real estate credit and equity positions. Benefits include reduced market volatility (since it\u2019s not subject to public market fluctuations), more concentrated and hands-on management, and the ability to leverage our operational expertise for superior underwriting.',
      },
      {
        q: 'What happens to my investment if market conditions change?',
        a: 'Our fund is designed with downside protection in mind. Conservative loan-to-value ratios, diversification across asset types and geographies, and our hands-on operational approach provide multiple layers of protection. Our team has successfully navigated various market conditions, and our asset-backed approach provides stability even in uncertain environments.',
      },
    ],
  },
];

export default function InvestorFaqPage() {
  const { lang } = useLanguage();
  const t = translations.investorFaq[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

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

  const toggleItem = (key) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = activeCategory === 'all'
    ? INVESTOR_FAQS
    : INVESTOR_FAQS.filter(c => c.category === activeCategory);

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <style>{faqPageStyles}</style>

      {/* DARK ZONE */}
      <div className="dark-zone">
        <div className="fq-hero">
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

          <div className="fq-hero-body">
            <div className="fq-hero-eyebrow" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.2s forwards' }}>{t.heroEyebrow}</div>
            <h1 style={{ opacity: 0, animation: 'fadeUp 0.8s 0.4s forwards' }}>{t.heroTitle}<br /><em>{t.heroTitleEm}</em></h1>
            <p className="fq-hero-p" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
              {t.heroDesc}
            </p>
            <div className="fq-hero-actions" style={{ opacity: 0, animation: 'fadeUp 0.8s 0.8s forwards' }}>
              <Link href="/request-access" className="btn-primary">Request Access <ArrowIcon /></Link>
              <Link href="/borrower-faq" className="btn-secondary">Borrower FAQs <ArrowIcon /></Link>
            </div>
          </div>
        </div>
        <div style={{ height: 64, background: 'var(--navy-deep)' }} />
      </div>

      <div className="dark-to-light" />

      {/* LIGHT ZONE */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Category Filter */}
          <section className="fq-filters reveal">
            <button
              className={`fq-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Questions
            </button>
            {INVESTOR_FAQS.map(cat => (
              <button
                key={cat.category}
                className={`fq-filter-btn ${activeCategory === cat.category ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.category)}
              >
                {cat.category}
              </button>
            ))}
          </section>

          {/* FAQ Sections */}
          <section className="fq-content">
            {filteredFaqs.map((section) => (
              <div key={section.category} className="fq-section reveal">
                <h2 className="fq-section-title">{section.category}</h2>
                <div className="fq-items">
                  {section.questions.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={key} className={`fq-item ${isOpen ? 'open' : ''}`}>
                        <button className="fq-question" onClick={() => toggleItem(key)}>
                          <span>{item.q}</span>
                          <svg className="fq-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <div className="fq-answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* CTA */}
          <section className="fq-cta">
            <div className="fq-cta-banner reveal">
              <div className="fq-cta-eyebrow">Still Have Questions?</div>
              <h2>Our Team Is <em>Here to Help</em></h2>
              <p>Connect with our investor relations team to discuss the Requity Income Fund and learn how it fits into your portfolio.</p>
              <div className="fq-cta-actions">
                <Link href="/request-access" className="btn-primary" style={{ borderRadius: 8 }}>
                  Request Access <ArrowIcon />
                </Link>
                <a href="mailto:invest@requitygroup.com" className="btn-secondary">
                  Email Our Team <ArrowIcon />
                </a>
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

const faqPageStyles = `
  /* Hero */
  .fq-hero {
    position: relative;
    min-height: 520px;
    display: flex;
    flex-direction: column;
  }
  .fq-hero::before {
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
  .fq-hero > * { position: relative; z-index: 2; }
  .fq-hero nav { position: relative; }

  .fq-hero-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 84px 48px 60px;
  }
  .fq-hero-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--champagne);
    margin-bottom: 28px;
    display: flex; align-items: center; gap: 16px;
  }
  .fq-hero-eyebrow::before,
  .fq-hero-eyebrow::after {
    content: ''; width: 40px; height: 1px;
    background: linear-gradient(to right, transparent, rgba(212,197,169,0.4), transparent);
  }
  .fq-hero-body h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 5vw, 62px);
    font-weight: 500; color: #fff;
    line-height: 1.08; letter-spacing: -0.01em;
    max-width: 800px; margin-bottom: 24px;
  }
  .fq-hero-body h1 em {
    font-style: italic; font-weight: 400; color: var(--champagne);
  }
  .fq-hero-p {
    font-size: 16px; font-weight: 400;
    color: rgba(255,255,255,0.42);
    max-width: 600px; line-height: 1.7;
    margin-bottom: 36px;
  }
  .fq-hero-actions {
    display: flex; gap: 16px; align-items: center;
  }
  @media (max-width: 968px) {
    .fq-hero-body { padding: 72px 32px 48px; }
  }
  @media (max-width: 600px) {
    .fq-hero-body { padding: 60px 20px 40px; }
    .fq-hero-p { font-size: 15px; }
    .fq-hero-actions { flex-direction: column; width: 100%; }
    .fq-hero-actions .btn-primary,
    .fq-hero-actions .btn-secondary { width: 100%; justify-content: center; }
  }

  /* Category Filters */
  .fq-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 40px 0 48px;
  }
  .fq-filter-btn {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: 100px;
    border: 1px solid rgba(8,21,37,0.1);
    background: var(--white);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.25s;
  }
  .fq-filter-btn:hover {
    border-color: rgba(8,21,37,0.2);
    color: var(--text-dark);
  }
  .fq-filter-btn.active {
    background: var(--navy);
    border-color: var(--navy);
    color: #fff;
  }

  /* FAQ Content */
  .fq-content {
    padding: 0 0 64px;
  }
  .fq-section {
    margin-bottom: 48px;
  }
  .fq-section:last-child {
    margin-bottom: 0;
  }
  .fq-section-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 500;
    color: var(--text-dark);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(8,21,37,0.08);
  }
  .fq-items {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .fq-item {
    border-bottom: 1px solid rgba(8,21,37,0.06);
  }
  .fq-item:last-child {
    border-bottom: none;
  }
  .fq-question {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 20px 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-dark);
    transition: color 0.25s;
  }
  .fq-question:hover {
    color: var(--navy-muted);
  }
  .fq-chevron {
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .fq-item.open .fq-chevron {
    transform: rotate(180deg);
  }
  .fq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 0 0 0 0;
  }
  .fq-item.open .fq-answer {
    max-height: 400px;
    padding: 0 0 24px 0;
  }
  .fq-answer p {
    font-size: 15px;
    line-height: 1.75;
    color: var(--text-muted);
    max-width: 800px;
  }

  /* CTA */
  .fq-cta {
    padding: 0 0 64px;
  }
  .fq-cta-banner {
    background: linear-gradient(135deg, var(--navy-deep), var(--navy));
    border-radius: 18px;
    padding: clamp(36px, 6vw, 64px);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .fq-cta-banner::before {
    content: ''; position: absolute; right: -60px; top: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: rgba(30,65,112,0.2); pointer-events: none;
  }
  .fq-cta-banner::after {
    content: ''; position: absolute; left: 30%; bottom: -100px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(212,197,169,0.04); pointer-events: none;
  }
  .fq-cta-banner > * { position: relative; z-index: 1; }
  .fq-cta-eyebrow {
    font-family: var(--font-body); font-size: 11px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--champagne); margin-bottom: 20px;
  }
  .fq-cta-banner h2 {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 44px);
    font-weight: 500; color: #fff;
    line-height: 1.12; margin-bottom: 20px;
  }
  .fq-cta-banner h2 em { font-style: italic; color: var(--champagne); font-weight: 400; }
  .fq-cta-banner p {
    font-size: 15px; color: rgba(255,255,255,0.4);
    line-height: 1.7; max-width: 560px;
    margin: 0 auto 40px;
  }
  .fq-cta-actions {
    display: flex; gap: 16px; justify-content: center; align-items: center;
  }
  @media (max-width: 600px) {
    .fq-cta-banner { border-radius: 14px; }
    .fq-cta-actions { flex-direction: column; width: 100%; }
    .fq-cta-actions .btn-primary,
    .fq-cta-actions .btn-secondary { width: 100%; justify-content: center; }
  }

  /* Footer spacing */
  footer { margin-top: 80px; }
`;
