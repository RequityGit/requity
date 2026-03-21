'use client';

import { useState } from 'react';
import MediaPicker from '@/components/MediaPicker';
import RichTextEditor from '@/components/RichTextEditor';
import Image from 'next/image';

export interface CommunityFormData {
    name: string;
    slug: string;
    region_id: string;
    headline: string;
    description_html: string;
    address_display: string;
    city: string;
    state_code: string;
    zip_code: string;
    beds_range: string;
    baths_range: string;
    starting_price: string;
    appfolio_listing_url: string;
    appfolio_portal_url: string;
    featured_media_id: string | undefined;
    featured_media?: { id: string; file_path: string };
    pm_gallery?: any[];
}

interface CommunityFormProps {
    initialData?: Partial<CommunityFormData>;
    regions: { id: string, name: string }[];
    onSubmit: (data: CommunityFormData) => Promise<void>;
    onGalleryChange?: (selectedIds: string[]) => Promise<void>; // Special handler for gallery
    loading: boolean;
    isEdit?: boolean;
}

export default function CommunityForm({ initialData, regions, onSubmit, onGalleryChange, loading, isEdit = false }: CommunityFormProps) {
    const [formData, setFormData] = useState<CommunityFormData>({
        name: '',
        slug: '',
        region_id: '',
        headline: '',
        description_html: '',
        address_display: '',
        city: '',
        state_code: '',
        zip_code: '',
        beds_range: '',
        baths_range: '',
        starting_price: '',
        appfolio_listing_url: '',
        appfolio_portal_url: '',
        featured_media_id: undefined,
        ...initialData 
    });

    const handleNameChange = (name: string) => {
        if (isEdit) {
            setFormData(prev => ({ ...prev, name }));
            return;
        }
        const slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData(prev => ({ ...prev, name, slug }));
    };

    // optimistic preview
    const currentHeroUrl = formData.featured_media?.file_path 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${formData.featured_media.file_path}`
        : null;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">                
                
                {/* SECTION 1: IDENTITY */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">1. Identity & Quick Facts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Official Name</label>
                            <input
                                required
                                className="w-full p-4 rounded-2xl border border-slate-200 outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                onBlur={(e) => handleNameChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Slug {isEdit && '(Locked)'}</label>
                            <input readOnly className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500"
                                value={formData.slug} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Region</label>
                            <select required className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none"
                                value={formData.region_id} onChange={(e) => setFormData({...formData, region_id: e.target.value})}>
                                <option value="">Select Region...</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>                   
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">State Code</label>
                            <input 
                                maxLength={2}
                                className="w-full p-4 rounded-2xl border border-slate-200 uppercase font-mono"
                                value={formData.state_code}
                                onChange={(e) => setFormData({...formData, state_code: e.target.value.slice(0,2).toUpperCase()})}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Quick Facts</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-50">                        
                            <input
                                className="p-3 rounded-xl border border-slate-200 text-sm"
                                placeholder="Beds Range"
                                value={formData.beds_range} 
                                onChange={(e) => setFormData({...formData, beds_range: e.target.value})}
                            />
                            <input
                                className="p-3 rounded-xl border border-slate-200 text-sm" 
                                placeholder="Baths Range"
                                value={formData.baths_range}
                                onChange={(e) => setFormData({...formData, baths_range: e.target.value})}
                            />
                            <input
                                className="p-3 rounded-xl border border-slate-200 text-sm"
                                placeholder="Price" value={formData.starting_price}
                                onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: LOCATION */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">2. Location Details</h2>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Display Address</label>
                        <input 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none" 
                            placeholder="e.g. 221 Riggs Rd, Hubert, NC 28539"
                            value={formData.address_display || ''} 
                            onChange={(e) => setFormData({...formData, address_display: e.target.value})} 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">City</label>
                            <input 
                                required
                                className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                                placeholder="Hubert" 
                                value={formData.city || ''} 
                                onChange={(e) => setFormData({...formData, city: e.target.value})} 
                            />
                            <p className="text-[10px] text-amber-600 font-bold uppercase mt-1 ml-1">
                                Must match AppFolio city exactly for listings sync.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Zip Code</label>
                            <input 
                                className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
                                placeholder="28539" 
                                value={formData.zip_code || ''} 
                                onChange={(e) => setFormData({...formData, zip_code: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: MARKETING */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">3. Marketing Content</h2>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hero Headline</label>
                        <input 
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold"
                            placeholder="Headline"
                            value={formData.headline || ''} 
                            onChange={(e) => setFormData({...formData, headline: e.target.value})}
                        />
                        <RichTextEditor 
                            content={formData.description_html}
                            onChange={(html) => setFormData({...formData, description_html: html})}
                        />
                    </div>
                </div>

                {/* SECTION 4: INTEGRATION */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-4">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">4. Appfolio Sync</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="p-4 rounded-2xl border border-slate-200 text-sm" placeholder="Listings URL" value={formData.appfolio_listing_url} onChange={(e) => setFormData({...formData, appfolio_listing_url: e.target.value})} />
                      <input className="p-4 rounded-2xl border border-slate-200 text-sm" placeholder="Portal URL" value={formData.appfolio_portal_url} onChange={(e) => setFormData({...formData, appfolio_portal_url: e.target.value})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50">
                    {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Publish Community')}
                </button>
            </div>            

            {/* SIDEBAR: MEDIA */}
            <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[1rem] border border-slate-100 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Hero Media</h3>
                    {currentHeroUrl && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-sm mb-4">
                            <Image src={currentHeroUrl} alt="Hero Preview" fill className="object-cover" />
                        </div>
                    )}
                    <MediaPicker 
                        currentId={formData.featured_media_id} 
                        onSelect={(id) => setFormData({...formData, featured_media_id: id as string, featured_media: undefined})} 
                        communitySlug={formData.slug} 
                    />
                </div>

                {/* GALLERY MANAGER */}
                <div className="bg-slate-900 p-8 rounded-[1rem] shadow-2xl space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-b border-slate-800 pb-4">Photo Gallery</h3>
                    <MediaPicker 
                        isMulti={true}
                        currentId={formData.pm_gallery?.map((g: any) => g.media_id)}
                        onSelect={(ids) => onGalleryChange ? onGalleryChange(ids as string[]) : null}
                        communitySlug={formData.slug}
                    />
                    <div className="grid grid-cols-3 gap-2">
                        {formData.pm_gallery?.map((item: any) => (
                            <div key={item.id} className="aspect-square rounded-lg overflow-hidden border border-slate-800">
                                <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.media?.file_path}`} className="w-full h-full object-cover grayscale opacity-50" alt="" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </form>
    );
}