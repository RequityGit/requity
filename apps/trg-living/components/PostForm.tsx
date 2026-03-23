'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => <div className="border border-slate-200 rounded-2xl min-h-[200px] bg-slate-50 animate-pulse" />,
});
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), {
    ssr: false,
    loading: () => <div className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 animate-pulse" />,
});

export interface PostFormData {
    title: string;
    slug: string;
    community_id: string;
    excerpt: string;
    body_html: string;
    status: 'draft' | 'published';
    featured_media_id: string | undefined;
    featured_media?: { id: string; file_path: string };
}

interface PostFormProps {
    initialData?: Partial<PostFormData>;
    communities: { id: string, name: string }[];
    onSubmit: (data: PostFormData) => Promise<void>;
    loading: boolean;
    isEdit?: boolean;
}

export default function PostForm({ initialData, communities, onSubmit, loading, isEdit = false }: PostFormProps) {
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        slug: '',
        community_id: '',
        excerpt: '',
        body_html: '',
        status: 'draft',
        featured_media_id: undefined,
        ...initialData 
    });

    const handleTitleChange = (title: string) => {
        if (isEdit) {
            setFormData(prev => ({ ...prev, title }));
            return;
        }
        const slug = title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const currentHeroUrl = formData.featured_media?.file_path 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${formData.featured_media.file_path}`
        : null;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-sans text-slate-900">
            <div className="lg:col-span-2 space-y-8">                
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 border-b pb-4">1. Article Content</h2>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Article Title</label>
                            <input required className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-xl font-bold"
                                value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Slug {isEdit && '(Locked)'}</label>
                            <input readOnly className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500" value={formData.slug} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Short Excerpt (Summary)</label>
                        <input
                            className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                            placeholder="A brief summary for the listings page..."
                            value={formData.excerpt}
                            onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Body Text (Rich Editor)</label>
                        <RichTextEditor content={formData.body_html} onChange={(html) => setFormData({...formData, body_html: html})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50">
                    {loading ? 'Processing...' : (isEdit ? 'Update Article' : 'Publish Article')}
                </button>
            </div>            

            <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Status & Target</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Community</label>
                            <select required className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold text-sm"
                                value={formData.community_id} onChange={(e) => setFormData({...formData, community_id: e.target.value})}>
                                <option value="">Select Community...</option>
                                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Visibility</label>
                            <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold text-sm"
                                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'published'})}>
                                <option value="draft">📁 Draft</option>
                                <option value="published">🌐 Published</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Featured Image</h3>
                    {currentHeroUrl ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-sm mb-4">
                            <Image src={currentHeroUrl} alt="Preview" fill className="object-cover" />
                        </div>
                    ) : formData.featured_media_id ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-600 font-bold uppercase text-center mb-4">
                            ✓ New Image Selected
                        </div>
                    ) : null}
                    <MediaPicker 
                        currentId={formData.featured_media_id} 
                        onSelect={(id) => setFormData({...formData, featured_media_id: id as string, featured_media: undefined})} 
                    />                    
                </div>
            </div>
        </form>
    );
}