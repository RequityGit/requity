import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRG Living",
  description: "TRG Living — Premium Residential Living",
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
