'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };
    
    const navItems = [
        { label: 'Overview', href: '/admin' },
        { label: 'Regions', href: '/admin/regions' },
        { label: 'Communities', href: '/admin/communities' },
        { label: 'Blog Posts', href: '/admin/posts' },
        { label: 'Media Library', href: '/admin/media' },
        { label: 'Leads', href: '/admin/leads' },
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 flex flex-col fixed inset-y-0 bg-slate-50/50 shadow-sm">
                <div className="p-8">
                    <h2 className="text-xl font-black tracking-tighter text-blue-600 uppercase italic">TRG Admin</h2>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">ADMIN CONTROL PANEL</p>
                </div>
               <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                    isActive 
                                    ? 'bg-white border-slate-200 text-blue-600 shadow-sm' 
                                    : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-white/50'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-slate-200 space-y-4">
                    <Link 
                        href="/" 
                        className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest block text-center">
                        View Website →
                    </Link>                    
                    <button 
                        onClick={handleSignOut}
                        className="w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-100"
                    >
                        🔒 Sign Out
                    </button>
                </div> 
            </aside>
            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-12 bg-white">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}