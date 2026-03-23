import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditPostClient from './EditPostClient';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect('/login');
    
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

        if (userRole?.role !== 'admin' && userRole?.role !== 'super_admin') {
            redirect('/');
        }

    const { data: communities } = await supabase.from('pm_communities').select('id, name').order('name');
    const { data: post } = await supabase
        .from('pm_posts')
        .select(`
            id, title, slug, community_id, excerpt, body_html, status, featured_media_id,
            featured_media:pm_media!pm_posts_featured_media_id_fkey (id, file_path)
        `)
        .eq('id', id)
        .single();

    if (!post) notFound();

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <EditPostClient post={post} communities={communities ?? []} id={id} />
        </div>
    );
}