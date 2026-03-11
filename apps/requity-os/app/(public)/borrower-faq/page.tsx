'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/public/LanguageContext';
import { LanguageToggle } from '@/components/public/LanguageToggle';
import translations from '@/lib/translations';

const BORROWER_FAQS = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What types of loans does Requity offer?',
        a: 'We offer seven loan programs tailored to different real estate investment strategies: CRE Bridge loans, Manufactured Housing financing, RV Park loans, Multifamily financing, Fix & Flip loans, DSCR Rental loans, and New Construction financing. Each program is designed to meet the specific needs of experienced real estate operators.',
      },
      {
        q: 'How do I apply for a loan?',
        a: 'You can submit a loan request through our online application on the Apply page. Simply provide your deal details \u2014 no credit pull and no commitment required. Our team will review your request and issue a term sheet typically within 24 hours.',
      },
      {
        q: 'What are the minimum qualifications to borrow?',
        a: 'We work with experienced real estate operators and investors. While specific requirements vary by loan program, we generally look for borrowers with relevant real estate experience, a demonstrated track record, and a viable business plan for the property. We underwrite the deal holistically, considering both the asset and the borrower.',
      },
      {
        q: 'What geographic areas do you lend in?',
        a: 'We provide financing nationwide across the United States. Our portfolio spans multiple states and markets, with particular depth in the Southeast. However, we evaluate each deal on its merits regardless of location.',
      },
    ],
  },
  {
    category: 'Loan Terms & Pricing',
    questions: [
      {
        q: 'What are your typical interest rates?',
        a: 'Interest rates vary depending on the loan program, property type, leverage, borrower experience, and market conditions. We offer competitive market-rate pricing and structure each deal individually. Submit a loan request to receive a term sheet with specific pricing for your deal.',
      },
      {
        q: 'What is the maximum loan-to-value (LTV) ratio?',
        a: 'Maximum LTV varies by program. Bridge loans are available up to 80% LTV, and Fix & Flip loans can go up to 90% of the purchase price with 100% of rehab costs financed. Specific LTV parameters for each loan program are available on our Lending page or through a term sheet for your specific deal.',
      },
      {
        q: 'What are the typical loan terms?',
        a: 'Loan terms are tailored to each program and deal. Bridge loans typically range from 12 to 24 months with interest-only payments. Fix & Flip loans are generally 6 to 12 months. DSCR Rental loans offer longer-term options including 30-year fixed rates. We structure terms to match your business plan.',
      },
      {
        q: 'Are there origination fees or points?',
        a: 'Yes, like most private lenders, we charge origination fees that vary by loan program, deal size, and complexity. All fees are clearly outlined in the term sheet before you commit, so there are no surprises at closing. We believe in transparent pricing.',
      },
      {
        q: 'Is there a prepayment penalty?',
        a: 'Prepayment provisions vary by loan program. Many of our short-term bridge and fix & flip loans offer flexible prepayment options. Specific prepayment terms will be outlined in your term sheet and loan documents. Our goal is to structure terms that align with your business plan.',
      },
    ],
  },
  {
    category: 'Process & Timeline',
    questions: [
      {
        q: 'How fast can you close a loan?',
        a: 'We can close loans in as little as 10 days from term sheet acceptance. Our average closing time is 14 days. Because we make all lending decisions in-house \u2014 no committees, no bureaucracy \u2014 we can move quickly with certainty.',
      },
      {
        q: 'What does the loan process look like?',
        a: 'The process is straightforward: (1) Submit your deal through our loan request form, (2) Receive a term sheet within 24 hours, (3) We conduct property-level due diligence and prepare loan documents, (4) Close and fund \u2014 most deals close within 10\u201314 days of term sheet acceptance.',
      },
      {
        q: 'What documents do I need to provide?',
        a: 'Documentation requirements vary by loan program. Generally, you will need property information (address, purchase price, rehab budget if applicable), a business plan or executive summary, borrower experience and track record, and entity documentation. For DSCR loans, we focus on property cash flow rather than personal income, so no tax returns are required.',
      },
      {
        q: 'Do you require an appraisal?',
        a: 'Appraisal requirements depend on the loan program and deal size. In many cases, we can work with a broker price opinion (BPO) or internal valuation to expedite the process. For larger loans or certain programs, a full appraisal may be required. Our team will outline specific requirements early in the process so there are no delays.',
      },
    ],
  },
  {
    category: 'Loan Structure',
    questions: [
      {
        q: 'Do you require personal guarantees?',
        a: 'Most of our loan programs do require a personal guarantee or recourse from the borrower. Specific guarantee requirements are outlined in the term sheet. We can discuss the guarantee structure for your specific deal during the initial conversation with our lending team.',
      },
      {
        q: 'Can I borrow through an LLC or entity?',
        a: 'Yes, we encourage borrowers to hold properties and loans through a legal entity such as an LLC. This is standard practice in commercial real estate lending and is the typical structure for our loan programs.',
      },
      {
        q: 'Do you provide construction or rehab draw funding?',
        a: 'Yes. For Fix & Flip and New Construction loans, we offer draw-based rehab and construction financing. Funds are disbursed based on completed work, verified through inspections. This allows you to finance up to 100% of rehab costs on eligible programs.',
      },
      {
        q: 'Can I refinance an existing loan with Requity?',
        a: 'Absolutely. We regularly provide refinance capital for borrowers looking to exit higher-rate or shorter-term debt. Whether you need to refinance from another private lender or transition to a longer-term DSCR loan, we can structure a solution that fits your needs.',
      },
      {
        q: 'Do you provide financing for portfolios of properties?',
        a: 'Yes, we can structure loans for portfolios of properties, which can offer efficiencies in closing costs and timeline. If you have multiple properties or a portfolio acquisition, reach out to our lending team to discuss a tailored structure.',
      },
    ],
  },
  {
    category: 'Working With Requity',
    questions: [
      {
        q: 'What makes Requity different from other private lenders?',
        a: 'We\u2019re not just lenders \u2014 we\u2019re operators. Our team has direct experience acquiring, operating, and managing real estate across manufactured housing, RV parks, multifamily, and more. This operational expertise means we understand the nuances of your deal, can move quickly with confidence, and provide certainty of close that purely financial lenders cannot match.',
      },
      {
        q: 'Who will I be working with during the loan process?',
        a: 'You will work directly with our lending team \u2014 the decision-makers \u2014 from day one. There are no loan officers or middlemen. You get direct access to the people who evaluate, approve, and fund your loan. This means faster communication, fewer bottlenecks, and a smoother experience.',
      },
      {
        q: 'Can I use Requity for repeat deals?',
        a: 'Absolutely. Many of our borrowers are repeat clients who come back for deal after deal. We value long-term relationships and streamline the process for returning borrowers. Once we know your track record and approach, subsequent loans can close even faster.',
      },
      {
        q: 'How do I get a quick indication of terms for my deal?',
        a: 'The fastest way is to submit a loan request through our online application. You can also call our lending team directly at 813.327.5180 to discuss your deal and get a quick verbal indication of terms. There is no obligation and no credit pull required.',
      },
    ],
  },
];

export default function BorrowerFaqPage() {
  const { lang } = useLanguage();
  const t = translations.borrowerFaq[lang];
  const nav = translations.nav[lang];
  const f = translations.footer[lang];
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
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

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = activeCategory === 'all'
    ? BORROWER_FAQS
    : BORROWER_FAQS.filter(c => c.category === activeCategory);

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
              <Link href="/apply" className="btn-primary">Apply for a Loan <ArrowIcon /></Link>
              <Link href="/investor-faq" className="btn-secondary">Investor FAQs <ArrowIcon /></Link>
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
            {BORROWER_FAQS.map(cat => (
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
              <div className="fq-cta-eyebrow">Ready to Get Started?</div>
              <h2>Have a Deal? <em>Let&apos;s Talk.</em></h2>
              <p>Our lending team is available to discuss your project and provide a quick indication of terms. No obligation, no credit pull.</p>
              <div className="fq-cta-actions">
                <Link href="/apply" className="btn-primary" style={{ borderRadius: 8 }}>
                  Submit Loan Request <ArrowIcon />
                </Link>
                <a href="tel:+18133275180" className="btn-secondary">
                  Call 813.327.5180
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
