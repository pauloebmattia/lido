'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseSocialActionsOptions {
    userId?: string;
}

export function useSocialActions({ userId }: UseSocialActionsOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    /**
     * Follow a user
     */
    const followUser = useCallback(async (targetUserId: string): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in to follow users');
            return false;
        }

        if (userId === targetUserId) {
            setError('You cannot follow yourself');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('follows')
                .insert({
                    follower_id: userId,
                    following_id: targetUserId,
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    // Already following - unique constraint violation
                    return true;
                }
                throw insertError;
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to follow user';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Unfollow a user
     */
    const unfollowUser = useCallback(async (targetUserId: string): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', userId)
                .eq('following_id', targetUserId);

            if (deleteError) throw deleteError;
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unfollow user';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Check if following a user
     */
    const isFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
        if (!userId) return false;

        try {
            const { data, error } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', userId)
                .eq('following_id', targetUserId)
                .single();

            return !error && !!data;
        } catch {
            return false;
        }
    }, [supabase, userId]);

    /**
     * Like a review
     */
    const likeReview = useCallback(async (reviewId: string): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in to like reviews');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // For now, we'll increment the likes_count directly
            // In a full implementation, you'd have a separate likes table
            const { error: updateError } = await supabase.rpc('increment_review_likes', {
                review_id: reviewId
            });

            if (updateError) throw updateError;
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to like review';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Get followers for a user
     */
    const getFollowers = useCallback(async (targetUserId: string, limit = 20) => {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          follower:profiles!follows_follower_id_fkey(
            id, username, display_name, avatar_url
          )
        `)
                .eq('following_id', targetUserId)
                .limit(limit);

            if (error) throw error;
            return data?.map((d: any) => d.follower) || [];
        } catch (err) {
            console.error('Error fetching followers:', err);
            return [];
        }
    }, [supabase]);

    /**
     * Get following for a user
     */
    const getFollowing = useCallback(async (targetUserId: string, limit = 20) => {
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          following:profiles!follows_following_id_fkey(
            id, username, display_name, avatar_url
          )
        `)
                .eq('follower_id', targetUserId)
                .limit(limit);

            if (error) throw error;
            return data?.map((d: any) => d.following) || [];
        } catch (err) {
            console.error('Error fetching following:', err);
            return [];
        }
    }, [supabase]);

    return {
        isLoading,
        error,
        followUser,
        unfollowUser,
        isFollowing,
        likeReview,
        getFollowers,
        getFollowing,
    };
}
