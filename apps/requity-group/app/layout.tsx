import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { fetchSiteData } from "../lib/supabase";
import type { NavItem, CompanyInfo } from "../lib/types";
import StructuredData from "./components/StructuredData";
import { RetellWidget } from "./components/RetellWidget";

export const metadata: Metadata = {
  title: {
    default: "Requity Group | Real Estate Investment & Lending",
    template: "%s | Requity Group",
  },
  description:
    "Requity Group is a vertically integrated real estate firm that acquires, operates, and lends on value-add properties. $150M+ in assets under management.",
  metadataBase: new URL("https://requitygroup.com"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Requity Group",
    images: [
      {
        url: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Requity Group — Real Estate Investment & Lending",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Requity Group | Real Estate Investment & Lending",
    description:
      "A vertically integrated platform for acquiring, operating, and lending on value-add real estate across the United States.",
    images: [
      "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/og-default.jpg",
    ],
  },
};

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navItems: NavItem[] = [];
  let company: CompanyInfo | null = null;
  try {
    const [navResult, companyResult] = await Promise.all([
      fetchSiteData<NavItem>("site_navigation", {
        eq: ["is_published", true],
      }),
      fetchSiteData<CompanyInfo>("site_company_info", { order: null }),
    ]);
    navItems = Array.isArray(navResult) ? navResult : [];
    company = companyResult?.[0] ?? null;
  } catch (_) {
    // Render shell with empty nav/footer data so the app never goes blank
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Diamond%20Favicon%20White.svg"
          type="image/svg+xml"
        />
        {/* Google Analytics 4 — Replace G-XXXXXXXXXX with your GA4 Measurement ID */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <StructuredData />
        <Nav items={navItems} />
        {children}
        <Footer navItems={navItems} company={company} />
        <RetellWidget />
      </body>
    </html>
  );
}
