'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import MediaPicker from '@/components/MediaPicker';

export default function EditPostPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [communities, setCommunities] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>(null);

    const loadData = useCallback(async () => {
        // 1. Fetch communities for the dropdown
        const { data: comms } = await supabase.from('pm_communities').select('id, name').order('name');
        if (comms) setCommunities(comms);

        // 2. Fetch Post with media join
        const { data, error } = await supabase
            .from('pm_posts')
            .select(`
                id, title, slug, community_id, excerpt, body_html, status, featured_media_id,
                featured_media:pm_media!pm_posts_featured_media_id_fkey (id, file_path)
            `)
            .eq('id', id) 
            .single();

        if (error) {
            alert("Database Error: " + error.message);
            router.push('/admin/posts');
            return;
        }

        if (data) setFormData(data);
        setLoading(false);
    }, [id, supabase, router]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);        
        
        // Defensive Payload Picking
        const updatePayload = {
            title: formData.title,
            community_id: formData.community_id,
            excerpt: formData.excerpt,
            body_html: formData.body_html,
            status: formData.status,
            featured_media_id: formData.featured_media_id
        };

        const { error } = await supabase
            .from('pm_posts')
            .update(updatePayload)
            .eq('id', id);

        if (error) {
            alert(error.message);
        } else {
            alert("Article updated successfully!");
            router.refresh();
        }
        setSaving(false);
    };

    if (loading) return <div className="p-20 animate-pulse text-slate-400 font-mono text-[10px] uppercase tracking-widest text-center">Opening Newsroom Archives...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans text-slate-900">
            <header>
                <Link href="/admin/posts" className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-widest">← Back to Newsroom</Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Edit Article</h1>
            </header>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label>
                            <input required className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-xl font-bold"
                            value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Body HTML</label>
                            <textarea rows={15} className="w-full p-6 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-mono text-sm leading-relaxed bg-slate-50"
                            value={formData.body_html || ''} onChange={(e) => setFormData({...formData, body_html: e.target.value})} />
                        </div>
                    </div>

                    <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-sm">
                        {saving ? 'Syncing...' : 'Save & Update Article'}
                    </button>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 pb-4">Status & Target</h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Visibility</label>
                            <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold text-sm"
                                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                <option value="draft">📁 Draft (Internal Only)</option>
                                <option value="published">🌐 Published (Public)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Community</label>
                            <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none font-bold text-sm"
                                value={formData.community_id} onChange={(e) => setFormData({...formData, community_id: e.target.value})}>
                                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-4">Featured Image</h3>
                        <MediaPicker 
                            currentId={formData.featured_media_id}
                            onSelect={(id) => setFormData({...formData, featured_media_id: id as string})}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}