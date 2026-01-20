'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/lib/supabase/types';

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    users: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>[];
    isLoading?: boolean;
    currentUserId?: string;
    onFollow?: (userId: string) => Promise<void>;
    onUnfollow?: (userId: string) => Promise<void>;
    followingIds?: string[];
}

export function UserListModal({
    isOpen,
    onClose,
    title,
    users,
    isLoading = false,
    currentUserId,
    onFollow,
    onUnfollow,
    followingIds = [],
}: UserListModalProps) {
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
        if (!onFollow || !onUnfollow) return;

        setLoadingUserId(userId);
        try {
            if (isFollowing) {
                await onUnfollow(userId);
            } else {
                await onFollow(userId);
            }
        } finally {
            setLoadingUserId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-paper rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-200">
                    <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-fade hover:text-ink transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-accent" size={32} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-12 text-center text-fade">
                            Nenhum usuário encontrado
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {users.map((user) => {
                                const isFollowing = followingIds.includes(user.id);
                                const isCurrentUser = user.id === currentUserId;
                                const isLoadingThis = loadingUserId === user.id;

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <Link href={`/profile/${user.username}`} onClick={onClose}>
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.display_name || user.username}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium">
                                                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/profile/${user.username}`}
                                                onClick={onClose}
                                                className="font-medium text-ink hover:text-accent transition-colors block truncate"
                                            >
                                                {user.display_name || user.username}
                                            </Link>
                                            <p className="text-sm text-fade">@{user.username}</p>
                                        </div>

                                        {/* Follow Button */}
                                        {!isCurrentUser && onFollow && onUnfollow && (
                                            <Button
                                                variant={isFollowing ? 'ghost' : 'primary'}
                                                size="sm"
                                                onClick={() => handleFollowToggle(user.id, isFollowing)}
                                                disabled={isLoadingThis}
                                            >
                                                {isLoadingThis ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : isFollowing ? (
                                                    'Seguindo'
                                                ) : (
                                                    'Seguir'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
