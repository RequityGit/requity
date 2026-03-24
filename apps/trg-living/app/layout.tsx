import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/Navigation';

// Setup Inter font to match Camden's high-end geometric style
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TRG Living | Premium Manufactured Housing Communities",
  description: "Find a new place to call home with TRG Living's professionally managed residential communities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
        {/* The Header now persists across every page (Home, Community Details, Posts) */}
        <Navigation />
        
        {children}

        <footer className="bg-slate-900 text-slate-400 p-8 text-center text-xs font-medium">
                © {new Date().getFullYear()} TRG Living. All rights reserved.
        </footer>
      </body>
    </html>
  );
}