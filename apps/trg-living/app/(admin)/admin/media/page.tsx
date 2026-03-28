import { createClient } from '@/lib/supabase/server';
import MediaGrid from './MediaGrid';
import MediaUploadButton from './MediaUploadButton';
import MediaTabs from './MediaTabs';
interface Props {
    searchParams: { view?: string };
}
export default async function MediaLibraryPage({ searchParams }: Props) {
    const supabase = createClient();
    const isOrphanView = searchParams.view === 'unused';

    // logic sieve
    const sourceTable = isOrphanView ? 'view_orphaned_media' : 'pm_media';
    
    const { data: media } = await supabase
        .from(sourceTable)
        .select('id, file_path, file_name, created_at') 
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Media Library</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage all uploaded assets.</p>
                    <MediaTabs currentView={searchParams.view || 'all'} />
                </div>
                <MediaUploadButton />
            </header>

            <MediaGrid initialMedia={media || []} />
        </div>
    );
}