'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

interface MediaItem {
    id: string;
    file_path: string;
    file_name: string;
}

interface MediaPickerProps {
    onSelect: (id: string | string[]) => void;
    currentId?: string | string[];
    isMulti?: boolean;
    communitySlug?: string;
}

export default function MediaPicker({ 
    onSelect, 
    currentId,
    isMulti = false,
    communitySlug = 'general'
}: MediaPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleOpen = async () => {
        // sync selections from props
        if (isMulti && Array.isArray(currentId)) {
            setSelectedIds(currentId);
        } else if (!isMulti && typeof currentId === 'string') {
            setSelectedIds([currentId]);
        }

        // fetch library content
        const { data, error } = await supabase
            .from('pm_media')
            .select('id, file_path, file_name')
            .order('created_at', { ascending: false });
        
        if (data) setMedia(data);
        if (error) console.error("Library Fetch Error:", error.message);
        
        setIsOpen(true);
    };

    // path sieve and MIME check
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const uploadedItems: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} is too large (>5MB)`);
                if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`${file.name} is not a supported image format`);

                const safeSlug = communitySlug.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const fileName = `${safeSlug}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `communities/${safeSlug}/gallery/${fileName}`;

                const { error: storageError } = await supabase.storage
                    .from('trg-living-media')
                    .upload(filePath, file);

                if (storageError) throw storageError;
                
                const { data: dbData, error: dbError } = await supabase
                    .from('pm_media')
                    .insert([{
                        file_path: filePath,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size
                    }])
                    .select()
                    .single();

                if (dbError) throw dbError;
                uploadedItems.push(dbData.id);
            }

            const { data: freshList } = await supabase
                .from('pm_media')
                .select('id, file_path, file_name')
                .order('created_at', { ascending: false });
            
            if (freshList) setMedia(freshList);

            if (isMulti) {
                setSelectedIds(prev => [...uploadedItems, ...prev]);
            } else {
                onSelect(uploadedItems[0]);
                setIsOpen(false);
            }

        } catch (err: any) {
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = (id: string) => {
        if (isMulti) {
            setSelectedIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            onSelect(id);
            setIsOpen(false);
        }
    };

    return (
        <div>
            {/* TRIGGER BUTTON */}
            <button 
                type="button"
                onClick={handleOpen}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[10px] uppercase hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
                {isMulti ? 'Manage Gallery' : (currentId ? 'Change Hero Image' : 'Select Hero Image')}
            </button>

            {/* MODAL OVERLAY */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* HEADER */}
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Relational Media Library</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {uploading ? 'Writing to storage...' : 'Click to select or upload new assets'}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <label className={`cursor-pointer px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                    uploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-lg'
                                }`}>
                                    {uploading ? 'Processing...' : 'Upload New'}
                                    <input 
                                        type="file" 
                                        multiple 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        disabled={uploading} 
                                        accept="image/jpeg,image/png,image/webp,image/avif" 
                                    />
                                </label>
                                
                                {isMulti && (
                                    <button 
                                        type="button"
                                        onClick={() => { onSelect(selectedIds); setIsOpen(false); }} 
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg"
                                    >
                                        Confirm ({selectedIds.length})
                                    </button>
                                )}
                                
                                <button type="button" onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </header>                        
                        
                        {/* MEDIA GRID */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {media.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelect(item.id)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all group shadow-sm ${
                                                isSelected ? 'border-blue-600 ring-4 ring-blue-50' : 'border-white hover:border-slate-200'
                                            }`}
                                        >
                                            <Image 
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.file_path}`} 
                                                alt={item.file_name} 
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                sizes="200px"
                                            />
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg z-10">
                                                    ✓
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <p className="text-[8px] text-white font-mono truncate w-full bg-black/40 p-1 rounded backdrop-blur-sm">
                                                    {item.file_name}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}

                                {media.length === 0 && !uploading && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                        Library Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}