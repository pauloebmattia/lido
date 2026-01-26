'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Star, Edit3, Trash2 } from 'lucide-react';
import { VibeBadge } from '@/components/VibeBadge';
import type { Vibe } from '@/lib/supabase/types';

interface ReviewCardProps {
    review: {
        id: string;
        user_id: string;
        rating: number;
        content: string | null;
        created_at: string;
        likes_count: number;
        comments_count: number;
        user: {
            id: string;
            username: string;
            display_name: string | null;
            avatar_url: string | null;
        };
        vibes: Vibe[];
    };
    currentUserId?: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
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

export function ReviewCard({ review, currentUserId, onEdit, onDelete }: ReviewCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(review.likes_count);
    const [isLiking, setIsLiking] = useState(false);

    // Check if user already liked this review
    useEffect(() => {
        if (!currentUserId || !review.id) return;

        const checkLiked = async () => {
            try {
                const res = await fetch(`/api/reviews/like?review_id=${review.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsLiked(data.liked);
                }
            } catch (error) {
                // Ignore errors - just means we couldn't check
            }
        };

        checkLiked();
    }, [currentUserId, review.id]);

    const handleLikeToggle = async () => {
        if (!currentUserId || isLiking) return;

        setIsLiking(true);

        // Optimistic update
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount(c => wasLiked ? c - 1 : c + 1);

        try {
            const res = await fetch('/api/reviews/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_id: review.id }),
            });

            if (!res.ok) {
                // Revert on error
                setIsLiked(wasLiked);
                setLikesCount(c => wasLiked ? c + 1 : c - 1);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(wasLiked);
            setLikesCount(c => wasLiked ? c + 1 : c - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const isOwnReview = currentUserId && review.user?.id === currentUserId;

    return (
        <article className="card p-6">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {review.user?.avatar_url ? (
                        <img
                            src={review.user.avatar_url}
                            alt={review.user.username}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium">
                            {(review.user?.display_name || review.user?.username || 'U').charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Link
                            href={`/profile/${review.user?.username}`}
                            className="font-medium text-ink hover:text-accent transition-colors"
                        >
                            {review.user?.display_name || review.user?.username}
                        </Link>
                        <RatingStars rating={review.rating} />
                        <span className="text-sm text-fade">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                    </div>

                    {/* Vibes */}
                    {review.vibes && review.vibes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {review.vibes.map((vibe) => (
                                <VibeBadge key={vibe.id} vibe={vibe} size="xs" />
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <p className="text-fade leading-relaxed">{review.content}</p>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                            {/* Like Button */}
                            <button
                                onClick={handleLikeToggle}
                                disabled={!currentUserId || isLiking}
                                className={`flex items-center gap-1.5 transition-all ${isLiked
                                        ? 'text-red-500'
                                        : 'text-fade hover:text-red-500'
                                    } ${!currentUserId ? 'cursor-not-allowed opacity-50' : ''}`}
                                title={currentUserId ? (isLiked ? 'Descurtir' : 'Curtir') : 'Faça login para curtir'}
                            >
                                <Heart
                                    size={18}
                                    className={`transition-transform ${isLiked ? 'fill-current scale-110' : ''} ${isLiking ? 'animate-pulse' : ''}`}
                                />
                                {likesCount > 0 && <span>{likesCount}</span>}
                            </button>

                            {/* Comment Button */}
                            <button
                                disabled={!currentUserId}
                                className={`flex items-center gap-1.5 transition-colors ${currentUserId ? 'text-fade hover:text-accent' : 'text-fade/50 cursor-not-allowed'
                                    }`}
                                title={currentUserId ? 'Comentar' : 'Faça login para comentar'}
                            >
                                <MessageCircle size={18} />
                                {review.comments_count > 0 && <span>{review.comments_count}</span>}
                            </button>
                        </div>

                        {/* Edit/Delete for own reviews */}
                        {isOwnReview && (
                            <div className="flex items-center gap-2">
                                {onEdit && (
                                    <button
                                        onClick={onEdit}
                                        className="p-2 text-fade hover:text-accent transition-colors"
                                        title="Editar review"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="p-2 text-fade hover:text-red-500 transition-colors"
                                        title="Excluir review"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
