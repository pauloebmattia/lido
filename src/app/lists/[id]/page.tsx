'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Lock, Globe, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Book } from '@/lib/supabase/types';

interface ListItem {
    id: string;
    position: number;
    note: string | null;
    book: Book;
}

interface BookList {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    cover_url: string | null;
    user_id: string;
    items: ListItem[];
}

export default function ListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listId = params.id as string;

    const [user, setUser] = useState<Profile | null>(null);
    const [list, setList] = useState<BookList | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddBook, setShowAddBook] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [searching, setSearching] = useState(false);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(profile);
            }

            // Fetch list with items
            const res = await fetch(`/api/lists?list_id=${listId}`);
            if (res.ok) {
                const data = await res.json();
                setList(data.list);
            }

            setLoading(false);
        }
        loadData();
    }, [listId, supabase]);

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;

        setSearching(true);
        // Search in our database
        const { data } = await supabase
            .from('books')
            .select('*')
            .or(`title.ilike.%${searchQuery}%,authors.cs.{${searchQuery}}`)
            .limit(10);

        setSearchResults(data || []);
        setSearching(false);
    };

    const handleAddBook = async (bookId: string) => {
        const res = await fetch('/api/lists/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: listId, book_id: bookId }),
        });

        if (res.ok) {
            // Reload list
            const listRes = await fetch(`/api/lists?list_id=${listId}`);
            if (listRes.ok) {
                const data = await listRes.json();
                setList(data.list);
            }
            setShowAddBook(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRemoveBook = async (bookId: string) => {
        await fetch(`/api/lists/items?list_id=${listId}&book_id=${bookId}`, {
            method: 'DELETE',
        });

        // Update local state
        if (list) {
            setList({
                ...list,
                items: list.items.filter(item => item.book.id !== bookId),
            });
        }
    };

    const isOwner = user?.id === list?.user_id;

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

    if (!list) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={user} />
                <div className="pt-32 text-center max-w-md mx-auto px-4">
                    <h1 className="font-serif text-3xl font-bold text-ink mb-4">Lista não encontrada</h1>
                    <Link href="/lists">
                        <Button>Voltar para Listas</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <Link
                        href="/lists"
                        className="inline-flex items-center gap-2 text-fade hover:text-ink transition-colors py-4"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para Listas</span>
                    </Link>

                    {/* List Header */}
                    <div className="card p-6 mt-4">
                        <div className="flex gap-6">
                            {/* List Cover */}
                            <div className="w-32 h-40 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                {list.cover_url ? (
                                    <img src={list.cover_url} alt={list.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                        <BookOpen className="text-accent" size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                                            {list.name}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-fade">
                                            {list.is_public ? (
                                                <span className="flex items-center gap-1"><Globe size={14} /> Pública</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Lock size={14} /> Privada</span>
                                            )}
                                            <span>• {list.items?.length || 0} livros</span>
                                        </div>
                                    </div>
                                </div>

                                {list.description && (
                                    <p className="text-fade mt-4">{list.description}</p>
                                )}

                                {isOwner && (
                                    <Button
                                        onClick={() => setShowAddBook(true)}
                                        className="mt-4"
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Adicionar Livro
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add Book Modal */}
                    {showAddBook && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddBook(false)} />
                            <div className="relative bg-paper rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
                                <h2 className="font-serif text-xl font-semibold text-ink mb-4">Adicionar Livro</h2>

                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fade" size={18} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Buscar livros..."
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} disabled={searching}>
                                        {searching ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {searchResults.map((book) => (
                                        <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50">
                                            {book.cover_thumbnail ? (
                                                <img
                                                    src={book.cover_thumbnail}
                                                    alt={book.title}
                                                    className="w-12 h-16 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-16 bg-stone-100 rounded flex items-center justify-center">
                                                    <BookOpen size={20} className="text-stone-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-ink truncate">{book.title}</p>
                                                <p className="text-sm text-fade truncate">
                                                    {book.authors?.join(', ')}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddBook(book.id)}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    ))}

                                    {searchResults.length === 0 && searchQuery && !searching && (
                                        <p className="text-center text-fade py-4">Nenhum livro encontrado</p>
                                    )}
                                </div>

                                <div className="flex justify-end mt-4">
                                    <Button variant="ghost" onClick={() => setShowAddBook(false)}>
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Books List */}
                    <div className="mt-6 space-y-3">
                        {list.items?.length > 0 ? (
                            list.items.map((item) => (
                                <div key={item.id} className="card p-4 flex items-center gap-4">
                                    <Link href={`/books/${item.book.id}`}>
                                        {item.book.cover_thumbnail ? (
                                            <img
                                                src={item.book.cover_thumbnail}
                                                alt={item.book.title}
                                                className="w-16 h-20 rounded-lg object-cover shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-16 h-20 bg-stone-100 rounded-lg flex items-center justify-center">
                                                <BookOpen size={24} className="text-stone-400" />
                                            </div>
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/books/${item.book.id}`} className="hover:text-accent">
                                            <h3 className="font-medium text-ink truncate">{item.book.title}</h3>
                                        </Link>
                                        <p className="text-sm text-fade truncate">
                                            {item.book.authors?.join(', ')}
                                        </p>
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleRemoveBook(item.book.id)}
                                            className="p-2 text-fade hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="mx-auto text-fade mb-4" size={40} />
                                <p className="text-fade">Esta lista ainda não tem livros.</p>
                                {isOwner && (
                                    <Button onClick={() => setShowAddBook(true)} className="mt-4">
                                        <Plus size={18} className="mr-2" />
                                        Adicionar Primeiro Livro
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
