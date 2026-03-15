'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewRegionPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const handleNameChange = (newName: string) => {
        setName(newName);
        setSlug(newName.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('pm_regions')
            .insert([{ name, slug, sort_order: 0 }]);

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            router.push('/admin/regions');
            router.refresh();
        }
    };

    if (!mounted) return null;

    return (
        <div className="max-w-md mx-auto space-y-8">
            <header>
                <Link href="/admin/regions" className="text-xs font-bold text-blue-600 uppercase mb-2 block">← Back to Regions</Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">New Region</h1>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">State/Region Name</label>
                    <input 
                        required 
                        autoFocus
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none text-lg font-bold"
                        placeholder="e.g. Tennessee" 
                        value={name} 
                        onChange={(e) => handleNameChange(e.target.value)} 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL Slug</label>
                    <input 
                        required 
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-100 font-mono text-xs text-slate-500"
                        value={slug} 
                        readOnly 
                    />
                </div>
                <button 
                    disabled={loading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 uppercase tracking-widest text-sm"
                >
                    {loading ? 'Creating...' : 'Register Region'}
                </button>
            </form>
        </div>
    );
}