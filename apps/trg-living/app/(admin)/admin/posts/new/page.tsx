'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import MediaPicker from '@/components/MediaPicker';

export default function NewPostPage() {
    const router = useRouter();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        community_id: '',
        excerpt: '',
        body_html: '',
        status: 'draft',
        featured_media_id: ''
    });

    // Load communities for the dropdown
    useEffect(() => {
        async function loadCommunities() {
            const { data } = await supabase.from('pm_communities').select('id, name').order('name');
            if (data) setCommunities(data);
        }
        loadCommunities();
    }, [supabase]);

    const handleTitleChange = (title: string) => {
        const slug = title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.community_id) return alert("Please select a community for this post.");
        
        setLoading(true);

        try {
            // Payload Picking & Sanitization
            const submissionData = {
                ...formData,
                featured_media_id: formData.featured_media_id || null
            };

            const { error } = await supabase
                .from('pm_posts')
                .insert([submissionData]);

            if (error) throw error;
            router.push('/admin/posts');
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
                <Link href="/admin/posts" className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-widest">← Back to Newsroom</Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Community Update</h1>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* SECTION 1: CONTENT */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Article Title</label>
                            <input required className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-xl font-bold"
                                placeholder="e.g. Summer Pool Party 2026" 
                                value={formData.title} 
                                onChange={(e) => handleTitleChange(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">URL Slug</label>
                            <input readOnly className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-500"
                                value={formData.slug} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Article Body (HTML Supported)</label>
                            <textarea rows={15} className="w-full p-6 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-mono text-sm leading-relaxed bg-slate-50"
                                placeholder="<h2>Headline</h2><p>Your story goes here...</p>"
                                value={formData.body_html} 
                                onChange={(e) => setFormData({...formData, body_html: e.target.value})} 
                            />
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-sm">
                        {loading ? 'Publishing...' : 'Save Update'}
                    </button>
                </div>

                {/* SIDEBAR */}
                <div className="space-y-8">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Community</label>
                            <select required className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold text-sm"
                                value={formData.community_id} onChange={(e) => setFormData({...formData, community_id: e.target.value})}>
                                <option value="">Select Community...</option>
                                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status</label>
                            <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white outline-none appearance-none font-bold text-sm"
                                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                <option value="draft">📁 Draft</option>
                                <option value="published">🌐 Published</option>
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