'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, BookOpen, Heart, MessageCircle, UserPlus, Loader2 } from 'lucide-react';
import { VibeBadge } from '@/components/VibeBadge';
import { formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Vibe } from '@/lib/supabase/types';

interface FeedActivity {
    id: string;
    type: 'review' | 'started_reading' | 'finished_book' | 'follow' | 'added_to_list';
    user: {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
    book?: {
        id: string;
        title: string;
        authors: string[];
        cover_url: string | null;
    };
    targetUser?: {
        id: string;
        username: string;
        display_name: string;
    };
    review?: {
        id: string; // Ensure ID is present
        rating: number;
        content: string | null;
        vibes: Vibe[];
        likes_count?: number;
    };
    created_at: string;
}



const activityMessages = {
    review: 'avaliou',
    started_reading: 'começou a ler',
    finished_book: 'terminou de ler',
    follow: 'começou a seguir',
    added_to_list: 'adicionou à lista',
};

const activityIcons = {
    review: Star,
    started_reading: BookOpen,
    finished_book: BookOpen,
    follow: UserPlus,
    added_to_list: Heart,
};

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={12}
                    className={
                        star <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-stone-200'
                    }
                />
            ))}
        </div>
    );
}

import { useSocialActions } from '@/hooks/useSocialActions';

function ActivityCard({ activity, currentUserId }: { activity: FeedActivity; currentUserId?: string }) {
    const Icon = activityIcons[activity.type];
    const message = activityMessages[activity.type];
    const { likeReview } = useSocialActions({ userId: currentUserId });
    const [isLiked, setIsLiked] = useState(false); // Todo: persisted state
    const [likesCount, setLikesCount] = useState(activity.review?.likes_count || 0);

    const handleLike = async () => {
        if (!currentUserId || !activity.review) return;

        // Optimistic update
        setIsLiked(true);
        setLikesCount(c => c + 1);

        const success = await likeReview(activity.review.id);
        if (!success) {
            // Revert
            setIsLiked(false);
            setLikesCount(c => c - 1);
        }
    };

    return (
        <article className="card p-4 sm:p-5">
            <div className="flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${activity.user.username}`} className="flex-shrink-0">
                    {activity.user.avatar_url ? (
                        <img
                            src={activity.user.avatar_url}
                            alt={activity.user.display_name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium">
                            {activity.user.display_name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">
                            <Link
                                href={`/profile/${activity.user.username}`}
                                className="font-semibold text-ink hover:text-accent transition-colors"
                            >
                                {activity.user.display_name}
                            </Link>
                            <span className="text-fade"> {message}</span>
                            {activity.targetUser && (
                                <Link
                                    href={`/profile/${activity.targetUser.username}`}
                                    className="font-semibold text-ink hover:text-accent transition-colors ml-1"
                                >
                                    {activity.targetUser.display_name}
                                </Link>
                            )}
                        </p>
                        <span className="text-xs text-fade flex-shrink-0">
                            {formatRelativeTime(activity.created_at)}
                        </span>
                    </div>

                    {/* Book Preview */}
                    {activity.book && (
                        <Link
                            href={`/books/${activity.book.id}`}
                            className="mt-3 flex gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors group"
                        >
                            {activity.book.cover_url && (
                                <img
                                    src={activity.book.cover_url}
                                    alt={activity.book.title}
                                    className="w-12 h-18 rounded-lg object-cover shadow-sm"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-medium text-ink group-hover:text-accent transition-colors line-clamp-2">
                                    {activity.book.title}
                                </h4>
                                <p className="text-sm text-fade">
                                    {activity.book.authors.join(', ')}
                                </p>

                                {/* Rating for reviews */}
                                {activity.review && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <RatingStars rating={activity.review.rating} />
                                    </div>
                                )}
                            </div>
                        </Link>
                    )}

                    {/* Review Vibes */}
                    {activity.review?.vibes && activity.review.vibes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {activity.review.vibes.map((vibe) => (
                                <VibeBadge key={vibe.id} vibe={vibe} size="xs" />
                            ))}
                        </div>
                    )}

                    {/* Review Content */}
                    {activity.review?.content && (
                        <p className="mt-3 text-sm text-fade line-clamp-3">
                            "{activity.review.content}"
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={handleLike}
                            disabled={!currentUserId || !activity.review}
                            className={`flex items-center gap-1.5 transition-colors text-sm ${isLiked ? 'text-accent' : 'text-fade hover:text-accent'}`}
                        >
                            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                            <span>{likesCount > 0 ? likesCount : 'Curtir'}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-fade hover:text-accent transition-colors text-sm">
                            <MessageCircle size={16} />
                            <span>Comentar</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

interface ActivityFeedProps {
    className?: string;
}

export function ActivityFeed({ className = '' }: ActivityFeedProps) {
    const [activities, setActivities] = useState<FeedActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id);
        });
    }, [supabase]);

    // Load initial feed
    useEffect(() => {
        const loadFeed = async () => {
            try {
                // Fetch from activity_feed table with joins
                const { data, error } = await supabase
                    .from('activity_feed')
                    .select(`
                        id,
                        activity_type,
                        created_at,
                        user:profiles!user_id (
                            id,
                            username,
                            display_name,
                            avatar_url
                        ),
                        book:books (
                            id,
                            title,
                            authors,
                            cover_url
                        ),
                        review:reviews (
                            id,
                            rating,
                            content,
                            likes_count,
                            review_vibes (
                                vibe:vibes (
                                    id,
                                    name,
                                    slug,
                                    emoji,
                                    color
                                )
                            )
                        ),
                        target_user:profiles!target_user_id (
                            id,
                            username,
                            display_name
                        )
                    `)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) {
                    console.error('Error fetching feed:', error);
                    setActivities([]);
                } else if (data && data.length > 0) {
                    // Transform Supabase data to FeedActivity format
                    const formattedActivities: FeedActivity[] = data.map((item: any) => {
                        const typeMap: Record<string, FeedActivity['type']> = {
                            'user_reviewed': 'review',
                            'user_started_reading': 'started_reading',
                            'user_finished_book': 'finished_book',
                            'user_followed': 'follow',
                            'user_added_to_list': 'added_to_list',
                        };

                        return {
                            id: item.id,
                            type: typeMap[item.activity_type] || 'added_to_list',
                            user: item.user || { id: '', username: 'unknown', display_name: 'Unknown', avatar_url: null },
                            book: item.book || undefined,
                            targetUser: item.target_user || undefined,
                            review: item.review ? {
                                id: item.review.id,
                                rating: item.review.rating,
                                content: item.review.content,
                                vibes: item.review.review_vibes?.map((rv: any) => rv.vibe) || [],
                                likes_count: item.review.likes_count || 0,
                            } : undefined,
                            created_at: item.created_at,
                        };
                    });
                    setActivities(formattedActivities);
                    setHasMore(data.length >= 20);
                } else {
                    setActivities([]);
                }
            } catch (err) {
                console.error('Error loading feed:', err);
                setActivities([]);
            }
            setIsLoading(false);
        };
        loadFeed();
    }, [supabase]);

    const loadMore = useCallback(async () => {
        // In a real app, this would fetch more from the API
        setHasMore(false);
    }, []);

    if (isLoading) {
        return (
            <div className={`flex justify-center py-12 ${className}`}>
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="space-y-4">
                {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} currentUserId={currentUserId} />
                ))}
            </div>

            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        className="text-accent hover:underline text-sm"
                    >
                        Carregar mais
                    </button>
                </div>
            )}

            {activities.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-fade">Nenhuma atividade recente.</p>
                    <p className="text-sm text-fade mt-2">
                        Siga mais pessoas para ver suas atualizações aqui!
                    </p>
                </div>
            )}
        </div>
    );
}
