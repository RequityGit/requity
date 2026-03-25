'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function MediaUploadButton() {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const fileName = `library-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `general/${fileName}`;

                await supabase.storage.from('trg-living-media').upload(filePath, file);
                await supabase.from('pm_media').insert([{
                    file_path: filePath,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size
                }]);
            }
            router.refresh(); // Refresh the Server Component data
        } catch (err: any) {
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <label className={`cursor-pointer bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
            {uploading ? 'Processing...' : 'Upload New'}
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
        </label>
    );
}