'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

const LanguageContext = createContext<{ lang: Language; toggleLang: () => void }>({ lang: 'en', toggleLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('requity-lang');
    if (saved === 'es') setLang('es');
  }, []);

  const toggleLang = () => {
    const next = lang === 'en' ? 'es' : 'en';
    setLang(next);
    localStorage.setItem('requity-lang', next);
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
