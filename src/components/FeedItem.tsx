import Link from 'next/link';
import { Star, BookOpen, Heart, MessageCircle, UserPlus } from 'lucide-react';
import type { ActivityFeedItem as FeedItemType } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils';

interface FeedItemProps {
    item: FeedItemType;
}

const activityIcons = {
    user_reviewed: Star,
    user_started_reading: BookOpen,
    user_finished_book: BookOpen,
    user_added_to_list: Heart,
    user_followed: UserPlus,
    book_trending: Star,
};

const activityMessages = {
    user_reviewed: 'avaliou',
    user_started_reading: 'começou a ler',
    user_finished_book: 'terminou de ler',
    user_added_to_list: 'adicionou à lista',
    user_followed: 'começou a seguir',
    book_trending: 'está em alta',
};

export function FeedItem({ item }: FeedItemProps) {
    const Icon = activityIcons[item.activity_type] || Star;
    const message = activityMessages[item.activity_type] || 'interagiu com';

    // Safely extract metadata values
    const reviewRating = typeof item.metadata?.rating === 'number' ? item.metadata.rating : null;
    const reviewContent = typeof item.metadata?.content === 'string' ? item.metadata.content : null;

    return (
        <article className="card p-4 sm:p-5">
            <div className="flex gap-4">
                {/* User Avatar */}
                <Link
                    href={`/profile/${item.username}`}
                    className="flex-shrink-0"
                >
                    {item.avatar_url ? (
                        <img
                            src={item.avatar_url}
                            alt={item.display_name || item.username || ''}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium">
                            {(item.display_name || item.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">
                            <Link
                                href={`/profile/${item.username}`}
                                className="font-semibold text-ink hover:text-accent transition-colors"
                            >
                                {item.display_name || item.username}
                            </Link>
                            <span className="text-fade"> {message}</span>
                        </p>
                        <span className="text-xs text-fade flex-shrink-0">
                            {formatRelativeTime(item.created_at)}
                        </span>
                    </div>

                    {/* Book Preview */}
                    {item.book_id && item.book_title && (
                        <Link
                            href={`/books/${item.book_id}`}
                            className="mt-3 flex gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors group"
                        >
                            {item.book_cover && (
                                <img
                                    src={item.book_cover}
                                    alt={item.book_title}
                                    className="w-12 h-18 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-medium text-ink group-hover:text-accent transition-colors line-clamp-2">
                                    {item.book_title}
                                </h4>

                                {/* Show rating if it's a review */}
                                {item.activity_type === 'user_reviewed' && reviewRating !== null && (
                                    <div className="flex items-center gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={12}
                                                className={
                                                    star <= reviewRating
                                                        ? 'text-yellow-500 fill-yellow-500'
                                                        : 'text-stone-200'
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )}

                    {/* Review Content Preview */}
                    {item.activity_type === 'user_reviewed' && reviewContent && (
                        <p className="mt-3 text-sm text-fade line-clamp-3">
                            &quot;{reviewContent}&quot;
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button className="flex items-center gap-1.5 text-fade hover:text-accent transition-colors text-sm">
                            <Heart size={16} />
                            <span>Curtir</span>
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
