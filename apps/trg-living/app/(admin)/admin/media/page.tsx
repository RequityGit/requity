'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function MediaLibraryPage() {
    const supabase = createClient();
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const handleDelete = async (item: any) => {
    if (!confirm('Confirm file delete?')) return;
    //Delete physical file from Storage
        const { error: storageError } = await supabase.storage
            .from('trg-living-media')
            .remove([item.file_path]);

        if (storageError) {
            alert("Storage error: " + storageError.message);
            return;
        }

        // Delete database record
        const { error: dbError } = await supabase
            .from('pm_media')
            .delete()
            .eq('id', item.id);

        if (dbError) alert("Database error: " + dbError.message);
        else setMedia(prev => prev.filter(m => m.id !== item.id));
    };

    useEffect(() => {
        async function loadMedia() {
            const { data } = await supabase
            .from('pm_media')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setMedia(data);
        setLoading(false);
        }
        loadMedia();
    }, [supabase]);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Media Library</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage all uploaded assets.</p>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                    Upload New
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.map((item) => (
                    <div key={item.id} className="group relative aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
                        {/* Construct URL from file_path via Supabase's public URL format */}
                        <Image 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.file_path}`}
                        alt={item.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 16vw"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-[8px] text-white font-mono truncate">{item.file_name}</p>
                        </div>
                    </div>
                ))}

            {media.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <p className="text-slate-400 text-sm italic">The library is currently empty.</p>
                </div>
            )}
            </div>
        </div>
    );
}