'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Bookmark, CheckCircle, XCircle, Grid, List, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Book, Profile } from '@/lib/supabase/types';

interface UserBookWithBook {
    id: string;
    status: string;
    added_at: string;
    book: Book;
}

const TABS = [
    { id: 'all', label: 'Todos', icon: Grid },
    { id: 'reading', label: 'Lendo', icon: BookOpen },
    { id: 'want_to_read', label: 'Quero Ler', icon: Bookmark },
    { id: 'read', label: 'Lidos', icon: CheckCircle },
    { id: 'dnf', label: 'Abandonados', icon: XCircle },
];

export default function MyBooksPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [user, setUser] = useState<Profile | null>(null);
    const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setLoading(false);
                return;
            }

            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            setUser(profile);

            // Fetch user's books
            const { data: booksData } = await supabase
                .from('user_books')
                .select(`
                    id,
                    status,
                    added_at,
                    book:books (
                        id,
                        title,
                        subtitle,
                        authors,
                        cover_url,
                        cover_thumbnail,
                        page_count,
                        avg_rating,
                        categories,
                        isbn,
                        google_books_id,
                        publisher,
                        published_date,
                        description,
                        language,
                        ratings_count,
                        reviews_count,
                        added_by,
                        is_verified,
                        created_at,
                        updated_at
                    )
                `)
                .eq('user_id', authUser.id)
                .order('added_at', { ascending: false });

            if (booksData) {
                // Filter out any null books and transform to correct shape
                const validBooks = booksData
                    .filter((item: any) => item.book !== null)
                    .map((item: any) => ({
                        id: item.id,
                        status: item.status,
                        added_at: item.added_at,
                        book: item.book as Book,
                    })) as UserBookWithBook[];
                setUserBooks(validBooks);
            }

            setLoading(false);
        }

        loadData();
    }, [supabase]);

    // Filter books by status
    const filteredBooks = userBooks.filter((item) =>
        activeTab === 'all' || item.status === activeTab
    );

    // Count by status
    const counts = userBooks.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={user} />
                <div className="pt-32 flex justify-center">
                    <Loader2 className="animate-spin text-fade" size={32} />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={null} />
                <div className="pt-32 text-center max-w-md mx-auto px-4">
                    <h1 className="font-serif text-3xl font-bold text-ink mb-4">
                        Meus Livros
                    </h1>
                    <p className="text-fade mb-6">
                        Entre na sua conta para ver sua biblioteca pessoal.
                    </p>
                    <Link href="/login">
                        <Button size="lg" className="btn-shimmer">
                            Entrar
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-8 flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                                Meus Livros
                            </h1>
                            <p className="mt-2 text-fade">
                                {userBooks.length} livro{userBooks.length !== 1 ? 's' : ''} na sua biblioteca
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
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

                    {/* Tabs */}
                    <div className="border-b border-stone-200 mb-8">
                        <nav className="flex gap-1 overflow-x-auto">
                            {TABS.map((tab) => {
                                const count = tab.id === 'all'
                                    ? userBooks.length
                                    : counts[tab.id] || 0;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-ink text-ink font-medium'
                                            : 'border-transparent text-fade hover:text-ink'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span>{tab.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                            ? 'bg-ink text-paper'
                                            : 'bg-stone-100 text-fade'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Books Grid */}
                    {filteredBooks.length > 0 ? (
                        <div
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6'
                                    : 'space-y-4'
                            }
                        >
                            {filteredBooks.map(({ book }) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    variant={viewMode === 'list' ? 'compact' : 'default'}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-fade text-lg">
                                {activeTab === 'all'
                                    ? 'Sua biblioteca está vazia. Comece adicionando livros!'
                                    : 'Nenhum livro nesta categoria.'}
                            </p>
                            <Link href="/books">
                                <Button variant="ghost" className="mt-4">
                                    Explorar livros
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
