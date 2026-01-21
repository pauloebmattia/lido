'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, Bookmark, XCircle, Star } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/lib/supabase/types';

interface FriendActivity {
    status: string;
    user: Profile;
}

interface FriendReview {
    rating: number;
    content: string;
    user: Profile;
}

interface FriendsActivityProps {
    bookId: string;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    'want-to-read': { label: 'quer ler', icon: Bookmark, color: 'text-blue-600' },
    'reading': { label: 'está lendo', icon: BookOpen, color: 'text-amber-600' },
    'read': { label: 'leu', icon: CheckCircle, color: 'text-green-600' },
    'dnf': { label: 'abandonou', icon: XCircle, color: 'text-red-600' },
};

export function FriendsActivity({ bookId }: FriendsActivityProps) {
    const [friends, setFriends] = useState<FriendActivity[]>([]);
    const [reviews, setReviews] = useState<FriendReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFriendsActivity() {
            try {
                const res = await fetch(`/api/books/${bookId}/friends`);
                if (res.ok) {
                    const data = await res.json();
                    setFriends(data.friends || []);
                    setReviews(data.reviews || []);
                }
            } catch (error) {
                console.error('Failed to load friends activity:', error);
            } finally {
                setLoading(false);
            }
        }
        loadFriendsActivity();
    }, [bookId]);

    if (loading) {
        return null; // Don't show anything while loading
    }

    if (friends.length === 0 && reviews.length === 0) {
        return null; // Don't show section if no friends activity
    }

    return (
        <div className="card p-6 mt-6">
            <h3 className="font-serif text-lg font-semibold text-ink flex items-center gap-2 mb-4">
                <Users size={20} className="text-accent" />
                Amigos neste livro
            </h3>

            {/* Friends Reading Status */}
            {friends.length > 0 && (
                <div className="space-y-3 mb-4">
                    {friends.map((friend, idx) => {
                        const statusInfo = STATUS_LABELS[friend.status];
                        if (!statusInfo) return null;
                        const Icon = statusInfo.icon;

                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <Link href={`/profile/${friend.user.username}`}>
                                    <img
                                        src={friend.user.avatar_url || '/default-avatar.png'}
                                        alt={friend.user.display_name || friend.user.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                </Link>
                                <div className="flex-1 flex items-center gap-2">
                                    <Link
                                        href={`/profile/${friend.user.username}`}
                                        className="font-medium text-ink hover:text-accent"
                                    >
                                        {friend.user.display_name || friend.user.username}
                                    </Link>
                                    <Icon size={14} className={statusInfo.color} />
                                    <span className={`text-sm ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Friends Reviews */}
            {reviews.length > 0 && (
                <div className="border-t border-stone-100 pt-4 mt-4">
                    <p className="text-sm font-medium text-fade mb-3">Avaliações de amigos</p>
                    <div className="space-y-3">
                        {reviews.slice(0, 3).map((review, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <Link href={`/profile/${review.user.username}`}>
                                    <img
                                        src={review.user.avatar_url || '/default-avatar.png'}
                                        alt={review.user.display_name || review.user.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                </Link>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/profile/${review.user.username}`}
                                            className="font-medium text-ink hover:text-accent text-sm"
                                        >
                                            {review.user.display_name || review.user.username}
                                        </Link>
                                        <div className="flex items-center gap-1">
                                            <Star size={12} className="text-amber-500 fill-amber-500" />
                                            <span className="text-sm text-fade">{review.rating}</span>
                                        </div>
                                    </div>
                                    {review.content && (
                                        <p className="text-sm text-fade line-clamp-2 mt-1">{review.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
