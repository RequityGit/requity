'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface MediaItem {
  id: string;
  file_path: string;
  file_name: string;
}

export default function MediaPicker({ 
  onSelect, 
  currentId,
  isMulti = false,
  communitySlug = 'general'
}: { 
  onSelect: (id: string | string[]) => void,
  currentId?: string | string[],
  isMulti?: boolean,
  communitySlug?: string 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [tab, setTab] = useState<'browse' | 'upload'>('browse');
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const loadMedia = useCallback(async () => {
    const { data } = await supabase
        .from('pm_media')
        .select('id, file_path, file_name')
        .order('created_at', { ascending: false });
    if (data) setMedia(data);
    }, [supabase]);

    useEffect(() => { 
    if (isOpen) loadMedia(); 
    }, [isOpen, loadMedia]);

    // When opening in single mode, sync the current ID
    useEffect(() => {
        if (isOpen) {
            if (isMulti && Array.isArray(currentId)) {
                setSelectedIds(currentId);
            } else if (!isMulti && typeof currentId === 'string') {
                setSelectedIds([currentId]);
            }
        }
    }, [isOpen, isMulti, currentId]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${communitySlug}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `communities/${communitySlug}/gallery/${fileName}`;

                // Immediate Storage Upload
                const { error: storageError } = await supabase.storage
                    .from('trg-living-media')
                    .upload(filePath, file);

                if (storageError) throw storageError;
                
                // Immediate DB Row Creation
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

                // Add to current selection automatically if multi, or select if single
                if (isMulti) {
                    setSelectedIds(prev => [dbData.id, ...prev]);
                } else {
                    onSelect(dbData.id);
                    setIsOpen(false);
                }
            }
            // Refresh library view to show new thumbs
            await loadMedia();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <button 
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[10px] uppercase hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
                {isMulti ? 'Manage Gallery' : (currentId ? 'Change Image' : 'Select Image')}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Media Library</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {uploading ? 'Uploading...' : 'Select or upload new assets'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className={`cursor-pointer px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                    uploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-lg'
                                }`}>
                                    {uploading ? 'Processing...' : 'Upload New'}
                                    <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} accept="image/*" />
                                </label>
                                
                                {isMulti && (
                                    <button 
                                        type="button"
                                        onClick={() => { onSelect(selectedIds); setIsOpen(false); }} 
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100"
                                    >
                                        Confirm ({selectedIds.length})
                                    </button>
                                )}
                                <button type="button" onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </header>                        
                        
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {media.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelect(item.id)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all group ${
                                                isSelected ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            <Image 
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trg-living-media/${item.file_path}`} 
                                                alt="" 
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                sizes="200px"
                                            />
                                            {isSelected && <div className="absolute top-2 right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">✓</div>}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <p className="text-[8px] text-white font-mono truncate w-full bg-black/40 p-1 rounded">{item.file_name}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}