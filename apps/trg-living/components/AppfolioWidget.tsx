'use client';

import { useMemo } from 'react';

export default function AppfolioWidget({ listingUrl }: { listingUrl: string | null }) {
    const safeUrl = useMemo(() => {
        if (!listingUrl) return null;
        try {
            const url = new URL(listingUrl);
            return url.toString();
        } catch (e) {
            console.error("Malformed AppFolio URL:", listingUrl);
            return listingUrl;
        }
    }, [listingUrl]);

    if (!safeUrl) {
        return (
            <div className="aspect-video bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-12 text-center">
                <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest text-slate-400">No active listings in this region</p>
            </div>
        );
    }

    return (
        <div className="w-full rounded-[3rem] overflow-hidden border-[12px] border-slate-50 shadow-2xl bg-white">
            <iframe 
                src={safeUrl}
                className="w-full min-h-[1000px] border-0" // Use CSS border-0 instead of frameBorder
                allowFullScreen
                loading="lazy"
                title="Appfolio Vacancies"
            />
        </div>
    );
}