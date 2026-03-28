'use client';

import Link from 'next/link';

export default function MediaTabs({ currentView }: { currentView: string }) {
    return (
        <div className="flex gap-6 mt-6">
            <Link
                href="/admin/media"
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${
                    currentView === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                }`}           
            >
                All Assets
            </Link>
            <Link
                href="/admin/media?view=unused"
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${
                    currentView === 'unused' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400'
                }`}
            >
                Unused Assets
            </Link>
        </div>
    );
}