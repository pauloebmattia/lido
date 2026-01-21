'use client';

import { useState, useEffect } from 'react';
import { Star, BookOpen, Users, Calendar, Bookmark, PenLine, Trash2, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { FriendsActivity } from '@/components/FriendsActivity';
import { VibeBadge, DEFAULT_VIBES } from '@/components/VibeBadge';
import { Button } from '@/components/ui/Button';
import { AddToListModal, ReadingStatus } from '@/components/AddToListModal';
import { ReviewForm } from '@/components/ReviewForm';
import { EditBookModal } from '@/components/EditBookModal';
import { createClient } from '@/lib/supabase/client';
import { translateCategory } from '@/lib/utils';
import type { Book, Profile, Vibe } from '@/lib/supabase/types';

// Types for reviews with relations
interface ReviewWithUser {
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
}

function RatingStars({ rating, size = 16 }: { rating: number; size?: number }) {
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

export function BookDetailClient({ id }: { id: string }) {
    const [book, setBook] = useState<Book | null>(null);
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    // Social features state
    const [showAddToList, setShowAddToList] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<ReadingStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(null);
    const [availableVibes, setAvailableVibes] = useState<Vibe[]>(DEFAULT_VIBES);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // 1. Fetch User (for NavBar)
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(profile);

                // Check if user has this book in their list
                const { data: userBook } = await supabase
                    .from('user_books')
                    .select('status')
                    .eq('user_id', authUser.id)
                    .eq('book_id', id)
                    .single();

                if (userBook) {
                    // Map DB status to component status
                    const statusMap: Record<string, ReadingStatus> = {
                        'want_to_read': 'want-to-read',
                        'reading': 'reading',
                        'read': 'read',
                        'dnf': 'dnf'
                    };
                    setCurrentStatus(statusMap[userBook.status] || null);
                }
            }

            // 2. Fetch Book
            const { data: bookData } = await supabase
                .from('books')
                .select('*')
                .eq('id', id)
                .single();

            if (bookData) {
                setBook(bookData);

                // 3. Fetch Reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select(`
                        id, user_id, rating, content, created_at, likes_count, comments_count,
                        user:profiles!user_id(id, username, display_name, avatar_url),
                        vibes:vibes(*)
                    `)
                    .eq('book_id', id)
                    .order('created_at', { ascending: false });

                // Cast to correct type since Supabase types are inferred differently
                setReviews((reviewsData as any) || []);
            }

            // 4. Fetch Vibes
            const { data: vibesData } = await supabase
                .from('vibes')
                .select('*')
                .order('name');

            if (vibesData && vibesData.length > 0) {
                // Merge DB vibes with DEFAULT_VIBES to ensure new code-added vibes appear
                const dbIds = new Set(vibesData.map(v => v.id));
                const missingDefaults = DEFAULT_VIBES.filter(v => !dbIds.has(v.id));
                const allVibes = [...vibesData, ...missingDefaults].sort((a, b) => a.name.localeCompare(b.name));
                setAvailableVibes(allVibes);
            }

            setLoading(false);
        }

        loadData();
    }, [id, supabase]);

    // Handle adding book to list
    const handleAddToList = async (status: ReadingStatus | null) => {
        if (!book) return;

        try {
            if (status === null) {
                // Remove from list
                const response = await fetch(`/api/user-books?book_id=${book.id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setCurrentStatus(null);
                } else {
                    const data = await response.json();
                    console.error('Error removing from list:', data.error);
                }
            } else {
                // Add/Update list
                const response = await fetch('/api/user-books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: book.id, status }),
                });

                if (response.ok) {
                    setCurrentStatus(status);
                } else {
                    const data = await response.json();
                    console.error('Error:', data.error);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Handle submitting review
    const handleSubmitReview = async (review: { rating: number; content: string; vibes: number[]; containsSpoilers: boolean }) => {
        if (!book) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    book_id: book.id,
                    rating: review.rating,
                    content: review.content,
                    vibes: review.vibes,
                    contains_spoilers: review.containsSpoilers,
                }),
            });

            if (response.ok) {
                setShowReviewForm(false);
                // Refresh reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select(`
                        id, user_id, rating, content, created_at, likes_count, comments_count,
                        user:profiles!user_id(id, username, display_name, avatar_url)
                    `)
                    .eq('book_id', book.id)
                    .order('created_at', { ascending: false });
                setReviews((reviewsData as any) || []);

                // Also update book's current status to read
                setCurrentStatus('read');
                // Clear editing state if any
                setEditingReview(null);
            } else {
                const data = await response.json();
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting review
    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Tem certeza que deseja excluir este review?')) return;

        try {
            const response = await fetch(`/api/reviews?review_id=${reviewId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove from local state
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            } else {
                const data = await response.json();
                console.error('Error deleting review:', data.error);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={user} />
                <div className="pt-32 flex justify-center">
                    <div className="animate-pulse text-fade">Carregando livro...</div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={user} />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-ink">Livro não encontrado</h1>
                    <Link href="/books" className="text-accent hover:underline mt-4 inline-block">
                        Voltar para a biblioteca
                    </Link>
                </div>
            </div>
        );
    }

    // Aggregate specific vibes from reviews (Dynamic, ignoring DEFAULT_VIBES ids)
    const vibeMap = new Map<number, Vibe & { count: number }>();

    reviews.forEach(review => {
        if (review.vibes) {
            review.vibes.forEach(vibe => {
                const existing = vibeMap.get(vibe.id) || { ...vibe, count: 0 };
                existing.count++;
                vibeMap.set(vibe.id, existing);
            });
        }
    });

    const topVibes = Array.from(vibeMap.values()).sort((a, b) => b.count - a.count);

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16 animate-fade-in">
                {/* Book Hero */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* ... (Hero content omitted, unchanged) */}


                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        {/* Cover Image */}
                        <div className="flex-shrink-0 mx-auto lg:mx-0 relative group">
                            {book.cover_url ? (
                                <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="w-64 h-auto rounded-2xl object-cover shadow-xl"
                                />
                            ) : (
                                <div className="w-64 h-96 rounded-2xl bg-stone-200 flex items-center justify-center text-fade">
                                    Sem capa
                                </div>
                            )}

                            {/* Admin Edit Cover (Quick Fix) */}
                            {user && user.role === 'admin' && (
                                <button
                                    className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                                    onClick={async () => {
                                        const newUrl = prompt('URL da nova capa (Alta Resolução):', book.cover_url || '');
                                        if (newUrl && newUrl !== book.cover_url) {
                                            const { error } = await supabase
                                                .from('books')
                                                .update({ cover_url: newUrl, cover_thumbnail: newUrl })
                                                .eq('id', book.id);

                                            if (!error) {
                                                setBook({ ...book, cover_url: newUrl, cover_thumbnail: newUrl });
                                                alert('Capa atualizada!');
                                            } else {
                                                alert('Erro ao atualizar capa.');
                                            }
                                        }
                                    }}
                                    title="Trocar capa (Admin)"
                                >
                                    <PenLine size={16} />
                                </button>
                            )}

                            {/* Full Admin Controls */}
                            {user && user.role === 'admin' && (
                                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="bg-stone-900/90 text-white p-2 rounded-full hover:scale-110 transition-transform shadow-lg backdrop-blur-sm"
                                        onClick={() => setIsEditModalOpen(true)}
                                        title="Editar Tudo (Admin)"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        className="bg-red-600/90 text-white p-2 rounded-full hover:scale-110 transition-transform shadow-lg backdrop-blur-sm"
                                        onClick={async () => {
                                            if (confirm('Tem certeza que deseja EXCLUIR este livro?')) {
                                                const { error } = await supabase.from('books').delete().eq('id', book.id);
                                                if (error) alert(error.message);
                                                else router.push('/books');
                                            }
                                        }}
                                        title="Excluir (Admin)"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <EditBookModal
                            book={book}
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            onUpdate={(updated) => setBook(updated)}
                        />

                        {/* Book Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                                {book.categories && book.categories.map((category) => (
                                    <span key={category} className="text-xs text-fade uppercase tracking-wider font-semibold">
                                        {translateCategory(category)}
                                    </span>
                                ))}
                            </div>

                            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight">
                                {book.title}
                            </h1>
                            {book.subtitle && (
                                <p className="mt-2 text-lg text-fade font-serif italic">{book.subtitle}</p>
                            )}

                            <p className="mt-4 text-xl">
                                por <span className="text-accent font-medium">{book.authors ? book.authors.join(', ') : 'Autor desconhecido'}</span>
                            </p>

                            <div className="mt-6 flex flex-wrap justify-center lg:justify-start items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <RatingStars rating={book.avg_rating || 0} size={20} />
                                    <span className="text-2xl font-serif font-bold text-ink">
                                        {(book.avg_rating || 0).toFixed(1)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-fade">
                                    <Users size={18} />
                                    <span>{book.ratings_count || 0} avaliações</span>
                                </div>
                                <div className="flex items-center gap-1 text-fade">
                                    <BookOpen size={18} />
                                    <span>{book.page_count} páginas</span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2">
                                {topVibes.map((vibe) => (
                                    <VibeBadge key={vibe.id} vibe={vibe} size="md" count={vibe.count} />
                                ))}
                            </div>

                            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                                {user ? (
                                    <>
                                        <Button
                                            size="lg"
                                            className="btn-shimmer"
                                            onClick={() => setShowReviewForm(true)}
                                        >
                                            <PenLine size={18} className="mr-2" />
                                            Avaliar
                                        </Button>
                                        <Button
                                            variant={currentStatus ? 'secondary' : 'ghost'}
                                            size="lg"
                                            onClick={() => setShowAddToList(true)}
                                        >
                                            <Bookmark size={18} className="mr-2" fill={currentStatus ? 'currentColor' : 'none'} />
                                            {currentStatus === 'reading' ? 'Lendo' :
                                                currentStatus === 'read' ? 'Lido' :
                                                    currentStatus === 'want-to-read' ? 'Quero Ler' :
                                                        currentStatus === 'dnf' ? 'Abandonei' : 'Adicionar'}
                                        </Button>
                                    </>
                                ) : (
                                    <Link href="/login">
                                        <Button size="lg" className="btn-shimmer">
                                            Entre para avaliar
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-fade">
                                <div>
                                    <span className="font-medium text-ink">Editora:</span> {book.publisher}
                                </div>
                                {book.published_date && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{new Date(book.published_date).getFullYear()}</span>
                                    </div>
                                )}
                                {book.isbn && (
                                    <div>
                                        <span className="font-medium text-ink">ISBN:</span> {book.isbn}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h2 className="font-serif text-2xl font-semibold text-ink mb-4">Sinopse</h2>
                    <div
                        className="text-fade leading-relaxed prose prose-stone max-w-none"
                        dangerouslySetInnerHTML={{ __html: book.description || 'Sem descrição disponível.' }}
                    />
                </section>

                {/* Friends Activity */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FriendsActivity bookId={id} />
                </section>

                {/* Reviews */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-semibold text-ink">
                            Avaliações ({reviews.length})
                        </h2>
                        {user && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowReviewForm(true)}
                            >
                                Escrever Review
                            </Button>
                        )}
                    </div>

                    {reviews.length > 0 ? (
                        <div className="space-y-6 stagger-children">
                            {reviews.map((review) => (
                                <article key={review.id} className="card p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {review.user?.avatar_url ? (
                                                <img src={review.user.avatar_url} alt={review.user.username} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center font-medium">
                                                    {(review.user?.display_name || review.user?.username || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <Link
                                                    href={`/profile/${review.user?.username}`}
                                                    className="font-medium text-ink hover:text-accent transition-colors"
                                                >
                                                    {review.user?.display_name || review.user?.username}
                                                </Link>
                                                <RatingStars rating={review.rating} size={14} />
                                                <span className="text-sm text-fade">
                                                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>

                                            {review.vibes && review.vibes.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {review.vibes.map((vibe) => (
                                                        <VibeBadge key={vibe.id} vibe={vibe} size="xs" />
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-fade leading-relaxed">{review.content}</p>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <button className="text-fade hover:text-accent transition-colors flex items-center gap-1">
                                                        ❤️ {review.likes_count > 0 && <span>{review.likes_count}</span>}
                                                    </button>
                                                    <button className="text-fade hover:text-accent transition-colors flex items-center gap-1">
                                                        💬 {review.comments_count > 0 && <span>{review.comments_count}</span>}
                                                    </button>
                                                </div>

                                                {/* Edit/Delete for own reviews */}
                                                {user && review.user?.id === user.id && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingReview(review);
                                                                setShowReviewForm(true);
                                                            }}
                                                            className="p-2 text-fade hover:text-accent transition-colors"
                                                            title="Editar review"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="p-2 text-fade hover:text-red-500 transition-colors"
                                                            title="Excluir review"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-8 text-center text-fade italic">
                            Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                        </div>
                    )}
                </section>
            </main>

            {/* Modals */}
            {
                book && (
                    <>
                        <AddToListModal
                            isOpen={showAddToList}
                            onClose={() => setShowAddToList(false)}
                            book={book}
                            currentStatus={currentStatus}
                            onSave={handleAddToList}
                        />

                        {showReviewForm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div
                                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                    onClick={() => {
                                        setShowReviewForm(false);
                                        setEditingReview(null);
                                    }}
                                />
                                <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-center justify-between p-5 border-b border-stone-200">
                                        <h2 className="font-serif text-xl font-semibold text-ink">
                                            {editingReview ? 'Editar Review' : 'Escrever Review'}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowReviewForm(false);
                                                setEditingReview(null);
                                            }}
                                            className="p-2 text-fade hover:text-ink transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <ReviewForm
                                            key={editingReview?.id || 'new'}
                                            bookId={book.id}
                                            bookTitle={book.title}
                                            onSubmit={handleSubmitReview}
                                            isLoading={isSubmitting}
                                            isEditing={!!editingReview}
                                            initialRating={editingReview?.rating || 0}
                                            initialContent={editingReview?.content || ''}
                                            initialVibes={editingReview?.vibes?.map(v => v.id) || []}
                                            availableVibes={availableVibes}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
        </div>
    );
}
