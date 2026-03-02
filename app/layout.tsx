import type { Metadata } from "next";
import "@/app/globals/globals.css";

export const metadata: Metadata = {
  title: "Requity Group Portal",
  description:
    "Unified portal for borrowers, investors, and administrators at Requity Group.",
  icons: {
    icon: "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Diamond%20Favicon%20White.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
