'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import { deleteMediaAction } from './actions';

export default function MediaGrid({ initialMedia }: { initialMedia: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async (item: any) => {
        if (!confirm('Permanently delete this file? This cannot be undone.')) return;

        startTransition(async () => {
            try {
                await deleteMediaAction(item.id, item.file_path);
            } catch (err: any) {
                alert(err.message);
            }
        });
    };

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {initialMedia.map((item) => (
                <div key={item.id} className="group relative aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
                    <Image 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.file_path}`}
                        alt={item.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 16vw"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                        <p className="text-[8px] font-mono truncate">{item.file_name}</p>
                        <button 
                            onClick={() => handleDelete(item)}
                            className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase py-1.5 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
            {initialMedia.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 text-xs italic">
                    The library is currently empty.
                </div>
            )}
        </div>
    );
}