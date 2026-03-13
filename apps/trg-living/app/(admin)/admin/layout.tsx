import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navItems = [
        { label: 'Overview', href: '/admin' },
        { label: 'Regions', href: '/admin/regions' },
        { label: 'Communities', href: '/admin/communities' },
        { label: 'Blog Posts', href: '/admin/posts' },
    ];

    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-900">
            {/* Sidebar - V3 Compliant (No Navy/Gold) */}
            <aside className="w-64 border-r border-slate-200 flex flex-col fixed inset-y-0 bg-slate-50/50">
                <div className="p-6">
                    <h2 className="text-lg font-bold tracking-tight text-blue-600 uppercase">TRG Living</h2>
                    <p className="text-[10px] font-mono text-slate-400">ADMIN CONTROL CENTER</p>
                </div>
               <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200 transition-all"
                    >
                        {item.label}
                    </Link>
                ))} 
                </nav>

                <div className="p-6 border-t border-slate-200">
                    <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-tighter">
                        ← Exit to Site
                    </Link>  
                </div> 
            </aside>
            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-12">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}