'use client';

import Link from 'next/link';
import { Bookmark, Star } from 'lucide-react';
import type { Book, Vibe } from '@/lib/supabase/types';
import { VibeBadge } from './VibeBadge';

interface BookCardProps {
    book: Book;
    vibes?: Vibe[];
    showActions?: boolean;
    onBookmark?: () => void;
    isBookmarked?: boolean;
    variant?: 'default' | 'compact' | 'featured';
}

export function BookCard({
    book,
    vibes = [],
    showActions = true,
    onBookmark,
    isBookmarked = false,
    variant = 'default',
}: BookCardProps) {
    const coverUrl = book.cover_url || book.cover_thumbnail || '/images/default-cover.png';

    if (variant === 'compact') {
        return (
            <Link href={`/books/${book.id}`} className="group flex gap-3">
                <div className="relative w-12 h-18 flex-shrink-0 overflow-hidden rounded-lg shadow-sm">
                    <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-ink truncate group-hover:text-accent transition-colors">
                        {book.title}
                    </h4>
                    <p className="text-xs text-fade truncate">
                        {book.authors?.join(', ') || 'Autor desconhecido'}
                    </p>
                    {book.avg_rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-fade">{book.avg_rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    if (variant === 'featured') {
        return (
            <article className="card overflow-hidden group">
                <Link href={`/books/${book.id}`} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden bg-stone-200">
                        {/* Blurred Background */}
                        <img
                            src={coverUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
                            aria-hidden="true"
                        />
                        {/* Main Image */}
                        <img
                            src={coverUrl}
                            alt={book.title}
                            className="relative w-full h-full object-contain shadow-md z-10 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                    </div>
                </Link>

                <div className="p-5">
                    <Link href={`/books/${book.id}`}>
                        <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-accent transition-colors line-clamp-2">
                            {book.title}
                        </h3>
                    </Link>

                    <p className="text-fade text-sm mt-1">
                        {book.authors?.join(', ') || 'Autor desconhecido'}
                    </p>

                    {/* Vibes */}
                    {vibes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {vibes.slice(0, 3).map((vibe) => (
                                <VibeBadge key={vibe.id} vibe={vibe} size="sm" />
                            ))}
                        </div>
                    )}

                    {/* Rating & Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                            {book.avg_rating > 0 ? (
                                <>
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">{book.avg_rating.toFixed(1)}</span>
                                    <span className="text-fade text-sm">({book.ratings_count})</span>
                                </>
                            ) : (
                                <span className="text-fade text-sm">Sem avaliações</span>
                            )}
                        </div>

                        {showActions && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onBookmark?.();
                                }}
                                className={`p-2 rounded-full transition-colors ${isBookmarked
                                    ? 'bg-accent text-white'
                                    : 'hover:bg-stone-100 text-fade'
                                    }`}
                                aria-label={isBookmarked ? 'Remover da lista' : 'Adicionar à lista Quero Ler'}
                            >
                                <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                            </button>
                        )}
                    </div>
                </div>
            </article>
        );
    }

    // Default variant
    return (
        <article className="card overflow-hidden group">
            <Link href={`/books/${book.id}`} className="block">
                <div className="relative aspect-[2/3] overflow-hidden bg-stone-200">
                    {/* Blurred Background for atmosphere */}
                    <img
                        src={coverUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
                        aria-hidden="true"
                    />
                    {/* Main Image - contained to show full cover */}
                    <img
                        src={coverUrl}
                        alt={book.title}
                        className="relative w-full h-full object-contain shadow-md z-10 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Quick Bookmark Button */}
                    {showActions && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onBookmark?.();
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${isBookmarked
                                ? 'bg-accent text-white'
                                : 'bg-white/80 text-fade hover:bg-white hover:text-ink'
                                }`}
                            aria-label={isBookmarked ? 'Remover da lista' : 'Adicionar à lista Quero Ler'}
                        >
                            <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
                        </button>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <Link href={`/books/${book.id}`}>
                    <h3 className="font-serif font-semibold text-ink group-hover:text-accent transition-colors line-clamp-2">
                        {book.title}
                    </h3>
                </Link>

                <p className="text-fade text-sm mt-1 truncate">
                    {book.authors?.join(', ') || 'Autor desconhecido'}
                </p>

                {/* Vibes */}
                {vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {vibes.slice(0, 2).map((vibe) => (
                            <VibeBadge key={vibe.id} vibe={vibe} size="xs" />
                        ))}
                        {vibes.length > 2 && (
                            <span className="text-xs text-fade">+{vibes.length - 2}</span>
                        )}
                    </div>
                )}

                {/* Rating */}
                {book.avg_rating > 0 && (
                    <div className="flex items-center gap-1.5 mt-3">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{book.avg_rating.toFixed(1)}</span>
                    </div>
                )}
            </div>
        </article>
    );
}
