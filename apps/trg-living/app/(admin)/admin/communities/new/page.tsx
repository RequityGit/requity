'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient} from '@/lib/supabase/client';


export default function NewCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Form State
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    region_id: '',
    headline: '',
    city: '',
    state_code: '',
    appfolio_listing_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load regions for the dropdown
  useEffect(() => {
    async function loadRegions() {
      const { data } = await supabase.from('pm_regions').select('id, name').order('name');
      if (data) setRegions(data);
    }
    loadRegions();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      // 1. Handle Image Upload if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `communities/${formData.slug}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('trg-living-media')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('trg-living-media')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }

      // 2. Insert into Database
      const { error: insertError } = await supabase
        .from('pm_communities')
        .insert([{
          ...formData,
          featured_image_url: imageUrl,
        }]);

      if (insertError) throw insertError;

      router.push('/admin/communities');
      router.refresh();
    } catch (error: any) {
      alert('Error creating community: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/admin/communities" className="text-xs font-bold text-blue-600 uppercase mb-2 block">← Back to List</Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Community</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Community Name</label>
            <input 
              required
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. Royal Valley"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">URL Slug</label>
            <input 
              required
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. royal-valley"
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">Region (State)</label>
          <select 
            required
            className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none"
            onChange={(e) => setFormData({...formData, region_id: e.target.value})}
          >
            <option value="">Select a region...</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">Headline</label>
          <input 
            className="w-full p-3 rounded-xl border border-slate-200 outline-none"
            placeholder="e.g. Quality Living in Hubert"
            onChange={(e) => setFormData({...formData, headline: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">Featured Image</label>
          <input 
            type="file"
            accept="image/*"
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Community'}
        </button>
      </form>
    </div>
  );
}