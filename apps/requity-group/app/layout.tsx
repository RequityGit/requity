import type { Metadata } from "next";
import "./globals.css";
import "./globals/public.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { fetchSiteData } from "../lib/supabase";
import type { NavItem, CompanyInfo } from "../lib/types";

export const metadata: Metadata = {
  title: {
    default: "Requity Group",
    template: "%s | Requity Group",
  },
  description:
    "Requity Group — A vertically integrated real estate investment company. Investing, operating, and lending in value-add real estate.",
  openGraph: {
    images: [
      {
        url: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg",
        alt: "Requity Group",
      },
    ],
  },
};

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navItems, companyData] = await Promise.all([
    fetchSiteData<NavItem>("site_navigation", {
      eq: ["is_published", true],
    }),
    fetchSiteData<CompanyInfo>("site_company_info"),
  ]);

  const company = companyData[0] ?? null;

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
      </head>
      <body>
        <Nav items={navItems} />
        {children}
        <Footer navItems={navItems} company={company} />
      </body>
    </html>
  );
}
