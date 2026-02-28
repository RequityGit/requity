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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
