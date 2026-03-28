'use client';
import Link from 'next/link';

const navItems = [
  { label: 'About', href: '/about' },
  { label: 'For Sale', href: '/for-sale' },
  { label: 'Contact', href: '/contact' },
];

interface NavProps {
    mhcRegions: any[];
    cgRegions: any[];
}

export default function Navigation({ mhcRegions = [], cgRegions = [] }: NavProps) {
  return (
    <nav className="sticky top-0 z-[100] bg-white border-b border-slate-100 shadow-sm font-sans">
      <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group mr-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-black text-xl">T</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              TRG <span className="text-[#2563eb]">Living</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {/* DROPDOWN: MHC */}
            <div className="relative group py-4">
              <button className="text-m font-semibold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1 outline-none">
                Mobile Home Communities
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute top-full left-0 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all p-2">
                {mhcRegions.map((region) => (
                  <Link key={`mhc-${region.slug}`} href={`/#${region.slug}`} className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    {region.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* DROPDOWN: CAMPGROUNDS */}
            <div className="relative group py-4">
              <button className="text-m font-semibold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1 outline-none">
                Campgrounds
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute top-full left-0 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all p-2">
                {cgRegions.map((region) => (
                  <Link key={`cg-${region.slug}`} href={`/#${region.slug}`} className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    {region.name}
                  </Link>
                ))}
                {cgRegions.length === 0 && (
                    <p className="p-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Coming Soon</p>
                )}
              </div>
            </div>

            {/* STATIC LINKS */}
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-m font-semibold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1 outline-none">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link href="https://trgliving.appfolio.com/connect" target="_blank" className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg">
          Resident Login
        </Link>
      </div>
    </nav>
  );
}