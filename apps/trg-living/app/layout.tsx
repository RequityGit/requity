import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import standard Enterprise font
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

        {/* 💡 Future Slot for the Footer we saw in the Camden screenshot */}
      </body>
    </html>
  );
}