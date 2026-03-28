'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PostForm, { PostFormData } from '@/components/PostForm';

export default function EditPostClient({ post, properties, id }: { post: any, properties: any[], id: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (formData: PostFormData) => {
        setLoading(true);
        try {
            const updatePayload = {
                title: formData.title,
                property_id: formData.property_id,
                excerpt: formData.excerpt,
                body_html: formData.body_html,
                status: formData.status,
                featured_media_id: formData.featured_media_id || null
            };

            const { error } = await supabase.from('pm_posts').update(updatePayload).eq('id', id);
            if (error) throw error;
            router.refresh();
            alert("Article Updated.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PostForm
            initialData={post}
            properties={properties}
            onSubmit={handleUpdate}
            loading={loading}
            isEdit={true}
        />
    );
}