import { createClient } from '@/lib/supabase/server';
import MediaGrid from './MediaGrid';
import MediaUploadButton from './MediaUploadButton';

export default async function MediaLibraryPage() {
    const supabase = createClient();
    
    const { data: media } = await supabase
        .from('pm_media')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Media Library</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage all uploaded assets.</p>
                </div>
                <MediaUploadButton />
            </header>

            <MediaGrid initialMedia={media || []} />
        </div>
    );
}