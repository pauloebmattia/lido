'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, SlidersHorizontal, Grid, List } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { BookCard } from '@/components/BookCard';
import { VibeBadge, DEFAULT_VIBES } from '@/components/VibeBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { translateCategory } from '@/lib/utils';
import type { Book, Profile, Vibe } from '@/lib/supabase/types';

const CATEGORIES = [
    'Todos',
    'Ficção',
    'Não-Ficção',
    'Fantasia',
    'Romance',
    'Mistério',
    'Clássicos',
    'Biografia',
    'Autoajuda',
    'Literatura Brasileira'
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Mais Populares (Rating)' },
    { value: 'recent', label: 'Mais Recentes' },
    { value: 'title', label: 'A-Z' },
];

export default function BooksPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BooksContent />
        </Suspense>
    );
}

function BooksContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('query') || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedVibes, setSelectedVibes] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Data states
    const [books, setBooks] = useState<Book[]>([]);
    const [user, setUser] = useState<Profile | null>(null);
    const [userBookIds, setUserBookIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [bookVibesMap, setBookVibesMap] = useState<Map<string, Set<number>>>(new Map());
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            // 1. Fetch User & Bookmarks
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                setUser(profile);

                const { data: userBooks } = await supabase.from('user_books').select('book_id').eq('user_id', authUser.id);
                if (userBooks) setUserBookIds(new Set(userBooks.map(ub => ub.book_id)));
            }

            // 2. Fetch Books
            const { data: booksData } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (booksData) setBooks(booksData);

            // 3. Fetch Vibes (via reviews)
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('book_id, review_vibes(vibe_id)');

            if (reviewsData) {
                const vibesMap = new Map<string, Set<number>>();
                reviewsData.forEach((review: any) => {
                    if (!vibesMap.has(review.book_id)) {
                        vibesMap.set(review.book_id, new Set());
                    }
                    if (review.review_vibes) {
                        review.review_vibes.forEach((rv: any) => {
                            vibesMap.get(review.book_id)?.add(rv.vibe_id);
                        });
                    }
                });
                setBookVibesMap(vibesMap);
            }

            setLoading(false);
        };

        loadData();
    }, [supabase]);

    // Filter books based on search, category and vibes
    const filteredBooks = books.filter((book) => {
        const matchesSearch =
            searchQuery === '' ||
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.authors?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
            selectedCategory === 'Todos' ||
            (book.categories && book.categories.some(cat => translateCategory(cat) === selectedCategory));

        const matchesVibes =
            selectedVibes.length === 0 ||
            (bookVibesMap.has(book.id) && selectedVibes.some(vId => bookVibesMap.get(book.id)?.has(vId)));

        return matchesSearch && matchesCategory && matchesVibes;
    }).sort((a, b) => { // ... unchanged sort logic ...
        if (sortBy === 'popular') return (b.avg_rating || 0) - (a.avg_rating || 0);
        if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
    });

    const handleVibeToggle = (vibe: Vibe) => {
        setSelectedVibes((prev) =>
            prev.includes(vibe.id)
                ? prev.filter((id) => id !== vibe.id)
                : [...prev, vibe.id]
        );
    };

    // Handle bookmark (quick add to 'want_to_read')
    const handleBookmark = async (bookId: string) => {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }

        try {
            if (userBookIds.has(bookId)) {
                // Remove from list
                await fetch(`/api/user-books?book_id=${bookId}`, { method: 'DELETE' });
                setUserBookIds(prev => {
                    const next = new Set(prev);
                    next.delete(bookId);
                    return next;
                });
            } else {
                // Add to want-to-read
                await fetch('/api/user-books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book_id: bookId, status: 'want-to-read' }),
                });
                setUserBookIds(prev => new Set(prev).add(bookId));
            }
        } catch (error) {
            console.error('Error bookmarking:', error);
        }
    };

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-8 animate-fade-in">
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                            Explorar Livros
                        </h1>
                        <p className="mt-2 text-fade">
                            Descubra sua próxima grande leitura
                        </p>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1">
                            <Input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por título ou autor..."
                                icon={<Search size={18} />}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <SlidersHorizontal size={18} />
                                Filtros
                            </Button>
                            <div className="flex items-center border border-stone-200 rounded-full p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-ink text-paper' : 'text-fade hover:text-ink'
                                        }`}
                                    aria-label="Visualização em grade"
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-ink text-paper' : 'text-fade hover:text-ink'
                                        }`}
                                    aria-label="Visualização em lista"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="card p-6 mb-8 space-y-6 animate-fade-in">
                            {/* Categories */}
                            <div>
                                <h3 className="font-medium text-ink mb-3">Categorias</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === category
                                                ? 'bg-ink text-paper'
                                                : 'bg-stone-100 text-fade hover:bg-stone-200'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vibes */}
                            <div>
                                <h3 className="font-medium text-ink mb-3">Vibes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {DEFAULT_VIBES.map((vibe) => (
                                        <button
                                            key={vibe.id}
                                            onClick={() => handleVibeToggle(vibe)}
                                            className={`vibe-tag ${vibe.color} transition-all ${selectedVibes.includes(vibe.id)
                                                ? 'ring-2 ring-ink ring-offset-2'
                                                : 'opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            {vibe.emoji} {vibe.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <h3 className="font-medium text-ink mb-3">Ordenar por</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-ink focus:outline-none focus:border-accent"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Results Count */}
                    <p className="text-fade text-sm mb-6">
                        {filteredBooks.length} livro{filteredBooks.length !== 1 ? 's' : ''} encontrado{filteredBooks.length !== 1 ? 's' : ''}
                    </p>

                    {/* Loading State */}
                    {loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="aspect-[2/3] bg-stone-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Books Grid */}
                    {!loading && (
                        <div
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 stagger-children'
                                    : 'space-y-4 stagger-children'
                            }
                        >
                            {filteredBooks.map((book) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    variant={viewMode === 'list' ? 'compact' : 'default'}
                                    isBookmarked={userBookIds.has(book.id)}
                                    onBookmark={() => handleBookmark(book.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredBooks.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-fade text-lg">
                                Nenhum livro encontrado.
                            </p>
                            {books.length === 0 ? (
                                <p className="text-sm text-fade mt-2">
                                    O banco de dados parece estar vazio. Use o script de seed para adicionar livros.
                                </p>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('Todos');
                                        setSelectedVibes([]);
                                    }}
                                >
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
