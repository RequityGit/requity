'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { 
    ssr: false,
    loading: () => <div className="h-10 bg-slate-50 animate-pulse rounded-xl" />
});

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { 
    ssr: false,
    loading: () => <div className="h-40 bg-slate-50 animate-pulse rounded-xl" />
});

const DB_FIELDS = ['name', 'slug', 'status', 'description_html', 'featured_media_id', 'sort_order'];

export default function RegionForm({ initialData, onSubmit, loading, isEdit }: any) {
    const [formData, setFormData] = useState({
        name: '', 
        slug: '', 
        status: 'published', 
        description_html: '',
        featured_media_id: undefined, 
        featured_media: null, 
        sort_order: 0,
        ...initialData
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();        
        
        const cleanPayload: any = {};
        DB_FIELDS.forEach(f => {
            if (formData[f as keyof typeof formData] !== undefined) {
                cleanPayload[f] = formData[f as keyof typeof formData];
            }
        });
        
        onSubmit(cleanPayload);
    };

    const heroUrl = (formData.featured_media as any)?.file_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${(formData.featured_media as any).file_path}`
        : null;

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. IDENTITY SECTION */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300 border-b pb-4">1. Region Identity & Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Region Name</label>
                            <input 
                                className="w-full p-4 border border-slate-200 rounded-2xl font-bold bg-slate-50 outline-none" 
                                value={formData.name} 
                                readOnly 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Market Visibility</label>
                            <select 
                                className="w-full p-4 border border-slate-200 rounded-2xl bg-blue-50 text-blue-600 font-bold outline-none cursor-pointer" 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="draft">📁 Draft (Hidden)</option>
                                <option value="published">🌐 Published (Live)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Regional Marketing Copy</label>
                        <RichTextEditor 
                            content={formData.description_html} 
                            onChange={h => setFormData({...formData, description_html: h})} 
                        />
                    </div>
                </div>

                <button 
                    disabled={loading} 
                    className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (isEdit ? 'Save Regional Marketing' : 'Create Region')}
                </button>
            </div>

            {/* SIDEBAR: ASSETS */}
            <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-4">Region Hero</h3>
                    
                    {heroUrl ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-sm mb-4">
                            <Image src={heroUrl} alt="Region Hero" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-video bg-slate-200/50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-4 text-[10px] font-bold text-slate-400 uppercase">
                            No Image Set
                        </div>
                    )}

                    <MediaPicker 
                        onSelect={id => setFormData({...formData, featured_media_id: id as any, featured_media: null})} 
                        currentId={formData.featured_media_id}
                    />
                </div>
            </div>
        </form>
    );
}