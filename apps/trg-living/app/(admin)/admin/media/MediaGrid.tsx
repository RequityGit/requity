'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import { deleteMediaAction } from './actions';

export default function MediaGrid({ initialMedia }: { initialMedia: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async (item: any) => {
        const msg = "This will permanently remove the file from storage and the database. \n\n" +
                    "If this image is currently in use, the deletion will be blocked for safety.";
        if (!confirm(msg)) return;

        startTransition(async () => {
            try {
                await deleteMediaAction(item.id, item.file_path);
            } catch (err: any) {
                alert(err.message);
            }
        });
    };

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-opacity duration-300 ${
            isPending ? 'opacity-30 grayscale' : 'opacity-100'
        }`}>
            {initialMedia.map((item) => (
                <div key={item.id} className="group relative aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
                    <Image 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.file_path}`}
                        alt={item.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 16vw"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                        <p className="text-[9px] font-mono truncate leading-tight">{item.file_name}</p>
                        <button 
                            onClick={() => handleDelete(item)}
                            className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-all active:scale-95 shadow-lg"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
            {initialMedia.length === 0 && (
                <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Library is currently empty.
                    </p>
                </div>
            )}
        </div>
    );
}