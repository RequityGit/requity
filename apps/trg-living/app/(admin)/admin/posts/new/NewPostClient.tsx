'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PostForm, { PostFormData } from '@/components/PostForm';

export default function NewPostClient({ properties }: { properties: any[] }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleCreate = async (formData: PostFormData) => {
        if (!formData.property_id) {
            alert("Please select a target property for this article.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.from('pm_posts').insert([{
                title: formData.title,
                slug: formData.slug,
                property_id: formData.property_id,
                excerpt: formData.excerpt,
                body_html: formData.body_html,
                status: formData.status,
                featured_media_id: formData.featured_media_id || null,
            }]);
            if (error) throw error;
            router.push('/admin/posts');
            router.refresh();
        } catch (err: any) {
            alert("Publishing Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
            <PostForm 
                properties={properties} // 🚀 Prop name must match PostForm's definition
                onSubmit={handleCreate} 
                loading={loading} 
            />
    );
}