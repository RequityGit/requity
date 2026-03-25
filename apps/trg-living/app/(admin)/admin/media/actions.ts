'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteMediaAction(id: string, filePath: string) {
    const supabase = createClient();

    const { error: dbError } = await supabase
        .from('pm_media')
        .delete()
        .eq('id', id);

    if (dbError) {
        // Postgres error code 23503 is a "Foreign Key Violation"
        if (dbError.code === '23503') {
            throw new Error("Cannot delete: This image is currently being used as a Hero or in a Gallery.");
        }
        throw new Error(dbError.message);
    }

    const { error: storageError } = await supabase.storage
        .from('trg-living-media')
        .remove([filePath]);

    if (storageError) {
        console.error("Storage cleanup failed:", storageError.message);
    }

    revalidatePath('/admin/media');
    return { success: true };
}