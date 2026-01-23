'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFollow(targetUserId: string, isFollowing: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (user.id === targetUserId) {
        throw new Error('Cannot follow yourself');
    }

    // Use Service Client to bypass RLS
    const serviceClient = createServiceClient();
    const tableName = 'user_follows'; // Defaulting to user_follows as it was the original working state

    try {
        if (isFollowing) {
            // Unfollow
            const { error } = await serviceClient
                .from(tableName)
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);

            if (error) throw error;
        } else {
            // Follow
            const { error } = await serviceClient
                .from(tableName)
                .insert({
                    follower_id: user.id,
                    following_id: targetUserId
                });

            if (error) {
                // Ignore unique constraint violation (already followed)
                if (error.code !== '23505') throw error;
            }
        }

        // Revalidate relevant pages
        revalidatePath(`/profile/${targetUserId}`);
        revalidatePath(`/profile/${user.id}`); // My profile might change (following count)
        revalidatePath('/profile/[username]', 'page');

        return { success: true };
    } catch (error: any) {
        console.error('Toggle follow error:', error);
        return { success: false, error: error.message };
    }
}
