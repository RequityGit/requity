'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [regions, setRegions] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function getRegions() {
      const { data } = await supabase
        .from('pm_regions')
        .select('name, slug')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setRegions(data);
    }
    getRegions();
  }, [supabase]);

  const navItems = [
    { label: 'About Us', href: '/about' },
    { label: 'For Sale', href: '/for-sale' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-slate-100 shadow-sm font-sans">
      <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
        
        {/* LEFT SIDE: LOGO + MENU ITEMS */}
        <div className="flex items-center gap-12">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group mr-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              TRG <span className="text-[#2563eb]">Living</span>
            </span>
          </Link>

          {/* MENU LINKS */}
          <div className="hidden md:flex items-center gap-8">
            {/* DYNAMIC DROPDOWN */}
            <div className="relative group py-4">
              <button className="text-base font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                Our Communities
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all p-2">
                {regions.map((region) => (
                  <Link 
                    key={region.slug}
                    href={`/#${region.slug}`}
                    className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    {region.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* STATIC LINKS */}
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="text-base font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: CTA BUTTON */}
        <Link 
          href="https://trgliving.appfolio.com/connect"
          target="_blank"
          className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
        >
          Resident Login
        </Link>

      </div>
    </nav>
  );
}