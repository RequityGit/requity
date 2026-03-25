'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// --- HYDRATION SAFETY ---
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), {
    ssr: false,
    loading: () => <div className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 animate-pulse" />,
});
const AmenityPicker = dynamic(() => import('@/components/AmenityPicker'), {
    ssr: false,
    loading: () => <div className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 animate-pulse" />,
});
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => <div className="border border-slate-200 rounded-2xl min-h-[200px] bg-slate-50 animate-pulse" />,
});

// Explicit allowlist — only real pm_communities columns are sent to Postgres
const DB_FIELDS = [
    'name', 'slug', 'region_id', 'headline', 'description_html',
    'address_display', 'city', 'state_code', 'zip_code',
    'beds_range', 'baths_range', 'starting_price', 'status',
    'featured_media_id',
];

export interface CommunityFormData {
    id?: string;
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
    status: string;
    featured_media_id?: string;
    featured_media?: { id?: string; file_path: string };
    pm_gallery?: any[];
    amenity_ids?: string[];
}

interface CommunityFormProps {
    initialData?: Partial<CommunityFormData>;
    regions: { id: string, name: string }[];
    allAmenities: any[];
    onSubmit: (cleanData: any) => Promise<void>;
    onGalleryChange?: (selectedIds: string[]) => Promise<void>;
    onAmenitiesChange?: (selectedIds: string[]) => Promise<void>;
    loading: boolean;
    isEdit?: boolean;
}

export default function CommunityForm({ 
    initialData, 
    regions, 
    allAmenities, 
    onSubmit, 
    onGalleryChange, 
    onAmenitiesChange, 
    loading, 
    isEdit = false
}: CommunityFormProps) {

    const [formData, setFormData] = useState<CommunityFormData>({
        name: '', slug: '', region_id: '', headline: '', description_html: '',
        address_display: '', city: '', state_code: '', zip_code: '',
        beds_range: 'Studio - 3 Beds', baths_range: '1 - 2 Baths',
        starting_price: 'Starting at $1,200', status: 'draft',
        featured_media_id: undefined,
        amenity_ids: [],
        ...initialData,
    });

    const handleNameChange = (name: string) => {
        if (isEdit) {
            setFormData(prev => ({ ...prev, name }));
            return;
        }
        const slug = name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData(prev => ({ ...prev, name, slug }));
    };

    const handleHardenAndSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPayload: any = {};
        DB_FIELDS.forEach(f => {
            const val = formData[f as keyof CommunityFormData];
            if (val !== undefined) cleanPayload[f] = val;
        });

        if (!cleanPayload.featured_media_id) cleanPayload.featured_media_id = null;
        onSubmit(cleanPayload);
    };

    const currentHeroUrl = formData.featured_media?.file_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${formData.featured_media.file_path}`
        : null;

    return (
        <form onSubmit={handleHardenAndSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">

                {/* SECTION 1: IDENTITY & STATUS */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">1. Identity & Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Official Name</label>
                            <input
                                required
                                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                onBlur={(e) => handleNameChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Slug {isEdit && '(Locked)'}</label>
                            <input
                                readOnly
                                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500"
                                value={formData.slug}
                            />
                        </div>                        
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Region</label>
                            <select
                                required
                                className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold"
                                value={formData.region_id}
                                onChange={(e) => setFormData({...formData, region_id: e.target.value})}
                            >
                                <option value="">Select Region...</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                            <select
                                className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="draft">📁 Draft</option>
                                <option value="published">🌐 Published</option>
                            </select>
                        </div>                        
                    </div>
                </div>

                {/* SECTION 2: LOCATION */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">2. Location Details</h2>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Display Address</label>
                        <input
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                            placeholder="e.g. 221 Riggs Rd, Hubert, NC 28539"
                            value={formData.address_display}
                            onChange={(e) => setFormData({...formData, address_display: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">City</label>
                            <input
                                required
                                className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                placeholder="Hubert"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">State</label>
                            <input
                                maxLength={2}
                                className="w-full p-4 rounded-2xl border border-slate-200 uppercase font-mono text-center"
                                placeholder="NC"
                                value={formData.state_code}
                                onChange={(e) => setFormData({...formData, state_code: e.target.value.slice(0,2).toUpperCase()})}
                            />
                        </div>                        
                        <div className="space-y-1 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Zip Code</label>
                            <input
                                className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                placeholder="28539"
                                value={formData.zip_code}
                                onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-600 font-bold uppercase ml-1">
                        City must match AppFolio exactly for listings sync.
                    </p>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Quick Facts</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-50">
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
                                placeholder="Starting Price"
                                value={formData.starting_price}
                                onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: MARKETING */}
                <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">3. Marketing Content</h2>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hero Headline</label>
                        <input
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold"
                            placeholder="Headline"
                            value={formData.headline || ''}
                            onChange={(e) => setFormData({...formData, headline: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">About Text</label>
                        <RichTextEditor
                            content={formData.description_html}
                            onChange={(html) => setFormData({...formData, description_html: html})}
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (isEdit ? 'Save All Changes' : 'Publish Community')}
                </button>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-8">

                {/* HERO ASSET */}
                <div className="bg-slate-50 p-8 rounded-[1rem] border border-slate-100 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Hero Media</h3>
                    {currentHeroUrl ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-sm">
                            <Image src={currentHeroUrl} alt="Hero Preview" fill className="object-cover" />
                        </div>
                    ) : formData.featured_media_id ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-600 font-bold uppercase text-center">
                            ✓ New Image Selected (Save to see preview)
                        </div>
                    ) : null}
                    <MediaPicker
                        currentId={formData.featured_media_id}
                        onSelect={(id) => setFormData({...formData, featured_media_id: id as string, featured_media: undefined})}
                        communitySlug={formData.slug}
                    />
                </div>

                {/* AMENITIES — edit only */}
                {onAmenitiesChange && (
                    <div className="bg-white p-8 rounded-[1rem] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Community Features</h3>
                        <AmenityPicker
                            allAmenities={allAmenities}
                            selectedIds={formData.amenity_ids || []}
                            onConfirm={async (ids) => {
                                setFormData({...formData, amenity_ids: ids});
                                await onAmenitiesChange(ids);
                            }}
                        />
                    </div>
                )}

                {/* GALLERY — edit only */}
                {onGalleryChange && (
                    <div className="bg-slate-900 p-8 rounded-[1rem] shadow-2xl space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border-b border-slate-800 pb-4">Photo Gallery</h3>
                        <MediaPicker
                            isMulti={true}
                            currentId={formData.pm_gallery?.map((g: any) => g.media_id)}
                            onSelect={(ids) => onGalleryChange(ids as string[])}
                            communitySlug={formData.slug}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            {formData.pm_gallery?.map((item: any) => (
                                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.media?.file_path}`}
                                        alt=""
                                        fill
                                        className="object-cover grayscale opacity-50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </form>
    );
}