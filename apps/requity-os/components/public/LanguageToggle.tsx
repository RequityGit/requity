'use client';

import { useLanguage } from '@/components/public/LanguageContext';

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
      <span className={lang === 'en' ? 'lang-active' : ''}>ENG</span>
      <span className="lang-divider">|</span>
      <span className={lang === 'es' ? 'lang-active' : ''}>ESP</span>
    </button>
  );
}
