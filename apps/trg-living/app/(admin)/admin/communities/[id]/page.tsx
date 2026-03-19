'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import MediaPicker from '@/components/MediaPicker';

export default function EditCommunityPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regions, setRegions] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>(null);

    const loadData = useCallback(async () => {
        // 1. Fetch Regions for the dropdown
        const { data: regionData } = await supabase.from('pm_regions').select('id, name').order('name');
        if (regionData) setRegions(regionData);

        // 2. Fetch Community with explicit joins
        const { data, error } = await supabase
            .from('pm_communities')
            .select(`
                id, name, slug, region_id, headline, description_html, 
                address_display, city, state_code, zip_code,
                beds_range, baths_range, starting_price, featured_media_id,
                featured_media:pm_media!pm_communities_featured_media_id_fkey (id, file_path),
                pm_gallery (
                    id, media_id, sort_order,
                    media:pm_media (file_path)
                )
            `)
            .eq('id', id) 
            .single();

        if (error) {
            alert("Database Error: " + error.message);
            router.push('/admin/communities');
            return;
        }

        if (data) {
            // Sort gallery items by their sort_order
            if (data.pm_gallery) {
                data.pm_gallery.sort((a: any, b: any) => a.sort_order - b.sort_order);
            }
            setFormData(data);
        }
        setLoading(false);
    }, [id, supabase, router]);

    useEffect(() => { loadData(); }, [loadData]);

    // UX POLISH: Auto-slug logic
    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData((prev: any) => ({ ...prev, name, slug }));
    };

    const handleGallerySelect = async (selectedIds: string | string[]) => {
        if (!Array.isArray(selectedIds)) return;
        setSaving(true);
        try {
            await supabase.from('pm_gallery').delete().eq('community_id', id);
            const rows = selectedIds.map((mediaId, index) => ({
                community_id: id,
                media_id: mediaId,
                sort_order: index
            }));
            const { error } = await supabase.from('pm_gallery').insert(rows);
            if (error) throw error;
            await loadData();
            alert("Gallery updated.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);        
        
        // DEFENSIVE: PAYLOAD PICKING (Prevent Mass Assignment)
        const updatePayload = {
            name: formData.name,
            slug: formData.slug,
            region_id: formData.region_id,
            headline: formData.headline,
            description_html: formData.description_html,
            address_display: formData.address_display,
            city: formData.city,
            state_code: formData.state_code,
            zip_code: formData.zip_code,
            beds_range: formData.beds_range,
            baths_range: formData.baths_range,
            starting_price: formData.starting_price,
            appfolio_listing_url: formData.appfolio_listing_url,
            appfolio_portal_url: formData.appfolio_portal_url,
            featured_media_id: formData.featured_media_id
        };

        const { error } = await supabase
            .from('pm_communities')
            .update(updatePayload)
            .eq('id', id);

        if (error) {
            alert(error.message);
        } else {
            alert("Property updated successfully.");
            router.refresh();
        }
        setSaving(false);
    };

    if (loading) return <div className="p-20 animate-pulse text-slate-400 font-mono text-[10px] uppercase tracking-widest text-center">Reconciling Monolith...</div>;
    if (!formData) return <div className="p-20 text-red-500">Record not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans text-slate-900">
            <header className="flex items-center justify-between">
                <div>
                    <Link href="/admin/communities" className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-widest">← Back to List</Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage: {formData.name}</h1>
                </div>
            </header>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* SECTION 1: IDENTITY */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">1. Identity & URL</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Official Name</label>
                                <input required className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                    value={formData.name || ''} onChange={(e) => handleNameChange(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Slug (Read Only)</label>
                                <input readOnly className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500"
                                    value={formData.slug || ''} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Region</label>
                            <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none"
                                value={formData.region_id || ''} onChange={(e) => setFormData({...formData, region_id: e.target.value})}>
                                <option value="">Unassigned</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* SECTION 2: MARKETING */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">2. Marketing Content</h2>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hero Headline</label>
                            <input className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                value={formData.headline || ''} onChange={(e) => setFormData({...formData, headline: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">About Text (HTML)</label>
                            <textarea rows={8} className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-mono text-xs bg-slate-50 leading-relaxed"
                                value={formData.description_html || ''} onChange={(e) => setFormData({...formData, description_html: e.target.value})} />
                        </div>
                    </div>

                    {/* SECTION 3: LOCATION */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">3. Location Details</h2>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Display Address</label>
                            <input
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                placeholder="e.g. 221 Riggs Rd, Hubert, NC 28539"
                                value={formData.address_display || ''}
                                onChange={(e) => setFormData({...formData, address_display: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">City</label>
                                <input
                                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                                    placeholder="Hubert"
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                />
                                {/* Tooltip */}
                                <p className="text-[9px] text-amber-500 font-bold uppercase mt-1 ml-1 flex items-center gap-1">
                                        Must match AppFolio city name exactly for listing sync.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">State Code</label>
                                <input
                                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                    placeholder="NC" value={formData.state_code || ''}
                                    onChange={(e) => setFormData({...formData, state_code: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Zip Code</label>
                                <input
                                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                    placeholder="28539" value={formData.zip_code || ''}
                                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: INTEGRATION */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">4. AppFolio Integration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input className="p-4 rounded-2xl border border-slate-200 text-sm" placeholder="Listings URL" value={formData.appfolio_listing_url || ''} onChange={(e) => setFormData({...formData, appfolio_listing_url: e.target.value})} />
                            <input className="p-4 rounded-2xl border border-slate-200 text-sm" placeholder="Portal URL" value={formData.appfolio_portal_url || ''} onChange={(e) => setFormData({...formData, appfolio_portal_url: e.target.value})} />
                        </div>
                    </div>

                    <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-sm">
                        {saving ? 'Synchronizing...' : 'Save All Community Data'}
                    </button>
                </div>

                {/* SIDEBAR: ASSETS */}
                <div className="space-y-8">
                    {/* HERO */}
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Hero Asset</h3>
                        <MediaPicker 
                            currentId={formData.featured_media_id}
                            onSelect={(id) => setFormData({...formData, featured_media_id: id as string})}
                            communitySlug={formData.slug}
                        />
                    </div>

                    {/* GALLERY */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-b border-slate-800 pb-4">Photo Gallery</h3>
                        <MediaPicker 
                            isMulti={true}
                            currentId={formData.pm_gallery?.map((g: any) => g.media_id)}
                            onSelect={handleGallerySelect}
                            communitySlug={formData.slug}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            {formData.pm_gallery?.map((item: any) => (
                                <div key={item.id} className="aspect-square rounded-lg overflow-hidden border border-slate-800">
                                    <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.media?.file_path}`} className="w-full h-full object-cover grayscale" alt="" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}