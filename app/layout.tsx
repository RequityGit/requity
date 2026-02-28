import type { Metadata } from "next";
import "@/app/globals/globals.css";

export const metadata: Metadata = {
  title: "Requity Group Portal",
  description:
    "Unified portal for borrowers, investors, and administrators at Requity Group.",
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-navy-deep text-surface-white">
        {children}
      </body>
    </html>
  );
}
