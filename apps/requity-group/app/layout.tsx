import type { Metadata } from "next";
import "./globals.css";
import "./globals/public.css";

export const metadata: Metadata = {
  title: "Requity Group",
  description: "Requity Group — Real Estate Investment & Lending",
  openGraph: {
    images: [
      {
        url: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg",
        alt: "Requity Group",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
