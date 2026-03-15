'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import MediaPicker from '@/components/MediaPicker';

export default function NewCommunityPage() {
    const router = useRouter();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        region_id: '',
        headline: '',
        description_html: '',
        address_display: '',
        city: '',
        state_code: '',
        zip_code: '',
        appfolio_listing_url: '',
        appfolio_portal_url: '',
        featured_media_id: '' // Now storing an ID instead of a file
    });

    // Load regions for dropdown
    useEffect(() => {
        async function loadRegions() {
            const { data } = await supabase.from('pm_regions').select('id, name').order('name');
            if (data) setRegions(data);
        }
        loadRegions();
    }, [supabase]);

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData(prev => ({ ...prev, name, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Logic is now MUCH simpler because we don't handle the file here!
            const { error } = await supabase
                .from('pm_communities')
                .insert([formData]);

            if (error) throw error;
            router.push('/admin/communities');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 font-sans text-slate-900">
            <header>
                <Link href="/admin/communities" className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-widest">← Back to List</Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Community</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* SECTION 1: IDENTITY */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">1. Basic Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Official Name</label>
                            <input required className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                placeholder="e.g. Royal Valley" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">URL Slug</label>
                            <input required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500"
                                value={formData.slug} readOnly />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Region</label>
                        <select required className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none"
                            value={formData.region_id} onChange={(e) => setFormData({...formData, region_id: e.target.value})}>
                            <option value="">Select Region...</option>
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* SECTION 2: MARKETING & MEDIA */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">2. Marketing & Media</h2>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Hero Image</label>
                        {/* THE NEW PICKER */}
                        <MediaPicker 
                            currentId={formData.featured_media_id}
                            onSelect={(id) => setFormData({...formData, featured_media_id: id as string})}
                            communitySlug={formData.slug}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Hero Headline</label>
                        <input className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="Great Commuter Location"
                            value={formData.headline} onChange={(e) => setFormData({...formData, headline: e.target.value})} />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">About Text (HTML)</label>
                        <textarea rows={5} className="w-full p-4 rounded-2xl border border-slate-200 font-sans outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                            placeholder="<p>Lakeside is centrally located...</p>"
                            value={formData.description_html} onChange={(e) => setFormData({...formData, description_html: e.target.value})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-blue-100 disabled:opacity-50 uppercase tracking-widest text-sm">
                    {loading ? 'Creating Property...' : 'Publish Community'}
                </button>
            </form>
        </div>
    );
}