import '@/app/globals/public.css';
import { LanguageProvider } from '@/components/public/LanguageContext';

export const metadata = {
  title: 'Requity Group | Private Real Estate Investments',
  description:
    'Requity is a vertically integrated real estate investment company that applies operational expertise to small-cap real estate. Over $150M in AUM.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      {children}
    </LanguageProvider>
  );
}
