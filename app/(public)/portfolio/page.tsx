import Link from 'next/link';
import { findCollectionByName, getField, getImageUrl } from '../../lib/webflow';
import PortfolioClient from '@/app/(public)/portfolio/PortfolioClient';
import { LanguageToggle } from '@/components/public/LanguageToggle';

export const metadata = {
  title: 'Portfolio | Requity Group',
  description: 'Explore our portfolio of real estate investments across manufactured housing, multifamily, RV parks, and more.',
};

// Revalidate every 5 minutes
export const revalidate = 300;

// Try multiple collection name patterns to find the right one
const COLLECTION_NAMES = ['portfolio', 'properties', 'property', 'investments', 'deals', 'projects'];

async function getPortfolioData() {
  if (!process.env.WEBFLOW_API_TOKEN || !process.env.WEBFLOW_SITE_ID) {
    return { items: [], error: 'config' };
  }

  for (const name of COLLECTION_NAMES) {
    try {
      const result = await findCollectionByName(name);
      if (result && result.items.length > 0) {
        return { items: result.items, collection: result.collection, error: null };
      }
    } catch (e) {
      console.error(`Error fetching collection "${name}":`, e);
    }
  }

  return { items: [], error: 'not_found' };
}

function normalizeItem(item) {
  const fd = item.fieldData || {};
  const name = fd.name || fd.title || fd['property-name'] || fd['project-name'] || 'Untitled Property';
  const slug = fd.slug || item.slug || '';
  const location = fd.location || fd.city || fd.address || fd['property-location'] || fd['city-state'] || '';
  const state = fd.state || '';
  const fullLocation = state && location && !location.includes(state) ? `${location}, ${state}` : location;
  const imageField = fd['main-image'] || fd.image || fd['hero-image'] || fd.thumbnail ||
    fd['featured-image'] || fd['cover-image'] || fd.photo || fd['main-photo'] || null;
  const imageUrl = typeof imageField === 'string' ? imageField : imageField?.url || null;
  const propertyType = fd['property-type'] || fd.type || fd.category || fd['asset-class'] || '';
  const units = fd.units || fd['number-of-units'] || fd['unit-count'] || fd['total-units'] || '';
  const status = fd.status || fd['deal-status'] || fd['investment-status'] || '';
  const description = fd.description || fd.summary || fd['short-description'] || fd.excerpt || '';
  const acreage = fd.acreage || fd.acres || fd['lot-size'] || '';
  const yearAcquired = fd['year-acquired'] || fd.year || fd['acquisition-year'] || fd['date-acquired'] || '';

  return { id: item.id || item._id, name, slug, location: fullLocation, imageUrl, propertyType, units, status, description, acreage, yearAcquired };
}

export default async function PortfolioPage() {
  const { items, error } = await getPortfolioData();
  const properties = items.map(normalizeItem);
  const propertyTypes = [...new Set(properties.map((p) => p.propertyType).filter(Boolean))];

  return (
    <>
      <style>{pfPageStyles}</style>

      {/* ══════ DARK ZONE ══════ */}
      <div className="dark-zone">
        <div className="pf-hero">
          <nav className="scrolled">
            <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
            <ul className="nav-links" id="navLinks">
              <li><Link href="/invest">Invest</Link></li>
              <li><Link href="/lending">Borrow</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><a href="https://investors.appfolioim.com/trg/investor/login" className="nav-cta">Investor Login &rarr;</a></li>
            </ul>
            <div className="nav-right">
              <LanguageToggle />
            </div>
          </nav>
          <div className="pf-hero-body">
            <div className="section-eyebrow">Our Portfolio</div>
            <h1>Real Estate Investments<br />Across the <em>Southeast</em></h1>
            <p>A diversified portfolio of value-add properties including manufactured housing communities, multifamily, RV parks, and more.</p>
          </div>
        </div>
        <div style={{ height: 48, background: 'var(--navy-deep)' }} />
      </div>

      <div className="dark-to-light" />

      {/* ══════ LIGHT ZONE ══════ */}
      <div className="light-zone">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {error === 'config' ? (
            <div className="pf-empty">
              <p>Portfolio data will appear here once Webflow CMS is connected.</p>
              <p className="pf-empty-sub">Add WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID environment variables to enable.</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="pf-empty">
              <p>No portfolio items found in Webflow CMS.</p>
              <p className="pf-empty-sub">Check that your Webflow CMS has a collection named &quot;Portfolio&quot;, &quot;Properties&quot;, or &quot;Investments&quot;.</p>
            </div>
          ) : (
            <PortfolioClient properties={properties} propertyTypes={propertyTypes} />
          )}

          {/* CTA */}
          <div className="pf-cta">
            <div className="section-eyebrow section-eyebrow-dark">Get Started</div>
            <h2 className="section-title">Interested in Investing?</h2>
            <p className="section-desc" style={{ margin: '0 auto 36px', textAlign: 'center', maxWidth: 500 }}>Gain access to institutional-quality real estate investments with transparent reporting and consistent distributions.</p>
            <Link href="/request-access" className="btn-primary-light">
              Request Access
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>

          {/* Footer */}
          <footer>
            <div className="footer-grid">
              <div className="footer-brand">
                <Link href="/" className="nav-logo"><img src="/logo-light.svg" alt="Requity" /></Link>
                <p>A vertically integrated real estate investment company headquartered in Tampa, Florida.</p>
              </div>
              <div className="footer-col"><h4>Company</h4><Link href="/about">About</Link><Link href="/portfolio">Portfolio</Link><Link href="/insights">Insights</Link></div>
              <div className="footer-col"><h4>Invest</h4><Link href="/income-fund">Income Fund</Link><a href="https://investors.appfolioim.com/trg/investor/login">Investor Login</a><Link href="/request-access">Request Access</Link><Link href="/investor-faq">Investor FAQ</Link></div>
              <div className="footer-col"><h4>Lending</h4><Link href="/lending">Loan Programs</Link><Link href="/apply">Request a Quote</Link><Link href="/apply">Loan Application</Link><Link href="/borrower-faq">Borrower FAQ</Link></div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2026 Requity Group. All rights reserved. &nbsp;|&nbsp; 401 E Jackson St Ste 3300, Tampa, FL 33602 &nbsp;|&nbsp; 813.288.0636</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

const pfPageStyles = `
  .pf-hero {
    position: relative;
    min-height: 420px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(165deg, var(--navy-deep) 0%, var(--navy) 50%, var(--navy-deep) 100%);
  }
  .pf-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 60%, rgba(30,65,112,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .pf-hero > * { position: relative; z-index: 2; }
  .pf-hero nav { position: relative; }
  .pf-hero-body {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: clamp(60px, 8vw, 80px) clamp(20px, 4vw, 48px) clamp(40px, 6vw, 60px);
  }
  .pf-hero-body h1 {
    font-family: var(--font-display);
    font-size: clamp(36px, 5vw, 54px);
    font-weight: 500; color: #fff;
    line-height: 1.1; margin-bottom: 20px;
  }
  .pf-hero-body h1 em { font-style: italic; color: var(--champagne); font-weight: 400; }
  .pf-hero-body p {
    font-size: 16px; color: rgba(255,255,255,0.42);
    max-width: 520px; line-height: 1.7;
  }
  .pf-empty {
    text-align: center; padding: 80px 0;
  }
  .pf-empty p { font-size: 16px; color: var(--text-muted); }
  .pf-empty-sub { font-size: 14px; color: rgba(8,21,37,0.3); margin-top: 8px; }
  .pf-cta {
    text-align: center; padding: clamp(48px, 8vw, 80px) 0 0;
  }
  @media (max-width: 600px) {
    .pf-hero-body p { font-size: 15px; }
  }
  footer { margin-top: 64px; }
`;
