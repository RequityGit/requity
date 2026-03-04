'use client';

export function LoanIndexes({ indexes }) {
  if (!indexes) return null;

  const { treasury5yr, treasury10yr, sofr30day, prime } = indexes;

  // Find the most recent date across all indexes
  const dates = [treasury5yr?.date, treasury10yr?.date, sofr30day?.date, prime?.date].filter(Boolean);
  const latestDate = dates.length > 0 ? dates.sort().pop() : null;

  const items = [
    { label: '5-Yr Treasury', value: treasury5yr?.value },
    { label: '10-Yr Treasury', value: treasury10yr?.value },
    { label: '30-Day SOFR', value: sofr30day?.value },
    { label: 'Prime Rate', value: prime?.value },
  ];

  const hasAny = items.some((item) => item.value != null);
  if (!hasAny) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <style>{indexStyles}</style>
      <div className="loan-indexes">
        <div className="loan-indexes-inner">
          <div className="loan-indexes-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Market Indexes
          </div>
          <div className="loan-indexes-rates">
            {items.map((item) => (
              <div key={item.label} className="loan-index-item">
                <span className="loan-index-name">{item.label}</span>
                <span className="loan-index-value">
                  {item.value != null ? `${item.value.toFixed(2)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
          {latestDate && (
            <div className="loan-indexes-date">As of {formatDate(latestDate)}</div>
          )}
        </div>
      </div>
    </>
  );
}

const indexStyles = `
  .loan-indexes {
    background: rgba(255,255,255,0.02);
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    margin-top: 24px;
    padding: 14px 0;
  }
  .loan-indexes-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 clamp(20px, 4vw, 40px);
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .loan-indexes-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.3);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .loan-indexes-label svg {
    color: var(--champagne);
    opacity: 0.5;
  }
  .loan-indexes-rates {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
  }
  .loan-index-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    transition: background 0.2s;
  }
  .loan-index-item:hover {
    background: rgba(255,255,255,0.05);
  }
  .loan-index-name {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    font-weight: 500;
    white-space: nowrap;
  }
  .loan-index-value {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--champagne);
    white-space: nowrap;
  }
  .loan-indexes-date {
    font-size: 11px;
    color: rgba(255,255,255,0.2);
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: auto;
  }
  @media (max-width: 968px) {
    .loan-indexes-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .loan-indexes-rates {
      width: 100%;
    }
    .loan-index-item {
      flex: 1;
      min-width: calc(50% - 4px);
      justify-content: space-between;
    }
    .loan-indexes-date {
      margin-left: 0;
    }
  }
  @media (max-width: 480px) {
    .loan-index-item {
      min-width: 100%;
    }
  }
`;
