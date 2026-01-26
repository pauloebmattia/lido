'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Star, Edit3, Trash2, Send, Loader2, X } from 'lucide-react';
import { VibeBadge } from '@/components/VibeBadge';
import { formatRelativeTime } from '@/lib/utils';
import type { Vibe } from '@/lib/supabase/types';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

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

    // Comments state
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsCount, setCommentsCount] = useState(review.comments_count);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

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
                // Ignore errors
            }
        };

        checkLiked();
    }, [currentUserId, review.id]);

    // Load comments when expanded
    useEffect(() => {
        if (!showComments) return;

        const loadComments = async () => {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/reviews/comments?review_id=${review.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data.comments || []);
                }
            } catch (error) {
                console.error('Error loading comments:', error);
            } finally {
                setLoadingComments(false);
            }
        };

        loadComments();
    }, [showComments, review.id]);

    const handleLikeToggle = async () => {
        if (!currentUserId || isLiking) return;

        setIsLiking(true);
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
                setIsLiked(wasLiked);
                setLikesCount(c => wasLiked ? c + 1 : c - 1);
            }
        } catch (error) {
            setIsLiked(wasLiked);
            setLikesCount(c => wasLiked ? c + 1 : c - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId || !newComment.trim() || submittingComment) return;

        setSubmittingComment(true);
        try {
            const res = await fetch('/api/reviews/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_id: review.id, content: newComment }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.comment) {
                    setComments(prev => [...prev, data.comment]);
                    setCommentsCount(c => c + 1);
                    setNewComment('');
                }
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Excluir este comentário?')) return;

        try {
            const res = await fetch(`/api/reviews/comments?comment_id=${commentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                setCommentsCount(c => Math.max(0, c - 1));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
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
                                onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-accent' : 'text-fade hover:text-accent'
                                    }`}
                                title="Comentários"
                            >
                                <MessageCircle
                                    size={18}
                                    className={showComments ? 'fill-current' : ''}
                                />
                                {commentsCount > 0 && <span>{commentsCount}</span>}
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

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t border-stone-200">
                            {/* Loading */}
                            {loadingComments && (
                                <div className="flex justify-center py-4">
                                    <Loader2 size={20} className="animate-spin text-fade" />
                                </div>
                            )}

                            {/* Comments List */}
                            {!loadingComments && comments.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <div className="flex-shrink-0">
                                                {comment.user?.avatar_url ? (
                                                    <img
                                                        src={comment.user.avatar_url}
                                                        alt={comment.user.username}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-stone-200 text-fade flex items-center justify-center text-xs font-medium">
                                                        {(comment.user?.display_name || comment.user?.username || 'U').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="bg-stone-50 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/profile/${comment.user?.username}`}
                                                            className="text-sm font-medium text-ink hover:text-accent"
                                                        >
                                                            {comment.user?.display_name || comment.user?.username}
                                                        </Link>
                                                        <span className="text-xs text-fade">
                                                            {formatRelativeTime(comment.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-fade mt-0.5">{comment.content}</p>
                                                </div>
                                                {/* Delete own comment */}
                                                {currentUserId === comment.user?.id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="mt-1 text-xs text-fade hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Excluir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {!loadingComments && comments.length === 0 && (
                                <p className="text-sm text-fade text-center py-2 mb-3">
                                    Nenhum comentário ainda.
                                </p>
                            )}

                            {/* Add Comment Form */}
                            {currentUserId ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Escreva um comentário..."
                                        className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                        disabled={submittingComment}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submittingComment}
                                        className="px-3 py-2 bg-ink text-paper rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {submittingComment ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <p className="text-sm text-fade text-center">
                                    <Link href="/login" className="text-accent hover:underline">
                                        Faça login
                                    </Link>{' '}
                                    para comentar
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
