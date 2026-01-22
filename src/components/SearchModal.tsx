'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Plus, Book, List as ListIcon, Users, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { CleanBookData } from '@/lib/google-books';
import type { Profile } from '@/lib/supabase/types';

interface SearchList {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    owner: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    items: { count: number }[];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBook?: (book: CleanBookData) => void;
}

type SearchTab = 'books' | 'lists' | 'users';

export function SearchModal({ isOpen, onClose, onSelectBook }: SearchModalProps) {
    const [activeTab, setActiveTab] = useState<SearchTab>('books');
    const [query, setQuery] = useState('');
    const [bookResults, setBookResults] = useState<CleanBookData[]>([]);
    const [listResults, setListResults] = useState<SearchList[]>([]);
    const [userResults, setUserResults] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Reset results when tab changes
    useEffect(() => {
        setResults([]);
        setHasSearched(false);
        if (query.trim().length >= 3) {
            handleSearch(query, activeTab);
        }
    }, [activeTab]);

    const setResults = (data: any[]) => {
        if (activeTab === 'books') setBookResults(data);
        if (activeTab === 'lists') setListResults(data);
        if (activeTab === 'users') setUserResults(data);
    };

    const handleSearch = useCallback(async (searchQuery: string, tab: SearchTab) => {
        if (searchQuery.length < 3) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            let limit = tab === 'books' ? '' : '&limit=20'; // existing apis support limit?
            let endpoint = '';

            if (tab === 'books') endpoint = `/api/books/search?q=${encodeURIComponent(searchQuery)}`;
            if (tab === 'lists') endpoint = `/api/lists/search?q=${encodeURIComponent(searchQuery)}`;
            if (tab === 'users') endpoint = `/api/users/search?q=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (tab === 'books') setBookResults(data.books || []);
            if (tab === 'lists') setListResults(data.lists || []);
            if (tab === 'users') setUserResults(data.users || []);

        } catch (error) {
            console.error('Error searching:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                handleSearch(query, activeTab);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, activeTab, handleSearch]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            // Auto focus input is handled by autoFocus prop
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-accent" size={32} />
                </div>
            );
        }

        if (hasSearched) {
            const isEmpty =
                (activeTab === 'books' && bookResults.length === 0) ||
                (activeTab === 'lists' && listResults.length === 0) ||
                (activeTab === 'users' && userResults.length === 0);

            if (isEmpty) {
                return (
                    <div className="py-12 text-center">
                        <p className="text-fade">Nenhum resultado encontrado para "{query}"</p>
                    </div>
                );
            }

            if (activeTab === 'books') {
                return (
                    <div className="divide-y divide-stone-100">
                        {bookResults.map((book) => (
                            <div
                                key={book.google_books_id}
                                className="flex gap-4 p-4 hover:bg-stone-50 transition-colors cursor-pointer group"
                                onClick={() => onSelectBook?.(book)}
                            >
                                <div className="flex-shrink-0">
                                    {book.cover_thumbnail ? (
                                        <img src={book.cover_thumbnail} alt={book.title} className="w-12 h-18 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-12 h-18 rounded-lg bg-stone-200 flex items-center justify-center">
                                            <span className="text-xs text-fade">Sem capa</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 self-center">
                                    <h3 className="font-medium text-ink line-clamp-1">{book.title}</h3>
                                    <p className="text-sm text-fade line-clamp-1">{book.authors.join(', ')}</p>
                                </div>
                                <div className="flex-shrink-0 self-center">
                                    <Button variant="ghost" size="sm">
                                        <Plus size={16} className="mr-1" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            if (activeTab === 'lists') {
                return (
                    <div className="divide-y divide-stone-100">
                        {listResults.map((list) => (
                            <Link href={`/lists/${list.id}`} key={list.id} onClick={onClose}>
                                <div className="flex gap-4 p-4 hover:bg-stone-50 transition-colors group">
                                    <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 flex-shrink-0">
                                        {list.cover_url ? (
                                            <img src={list.cover_url} alt={list.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <ListIcon size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 self-center">
                                        <h3 className="font-medium text-ink line-clamp-1">{list.name}</h3>
                                        <p className="text-xs text-fade mt-0.5">
                                            por @{list.owner?.username} • {list.items?.[0]?.count || 0} livros
                                        </p>
                                    </div>
                                    <div className="self-center">
                                        <ChevronRight size={16} className="text-fade group-hover:text-accent" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                );
            }

            if (activeTab === 'users') {
                return (
                    <div className="divide-y divide-stone-100">
                        {userResults.map((user) => (
                            <Link href={`/profile/${user.username}`} key={user.id} onClick={onClose}>
                                <div className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors group">
                                    <div className="flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-ink truncate">{user.display_name || user.username}</h3>
                                        <p className="text-xs text-fade">@{user.username}</p>
                                    </div>
                                    <div className="self-center">
                                        <ChevronRight size={16} className="text-fade group-hover:text-accent" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                );
            }
        }

        return (
            <div className="py-12 text-center text-fade">
                Comece a digitar para buscar {activeTab === 'books' ? 'livros' : activeTab === 'lists' ? 'listas' : 'pessoas'}...
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-paper rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                {/* Header */}
                <div className="p-6 border-b border-stone-200 bg-white z-10">
                    <h2 className="text-lg font-serif font-medium text-ink mb-4">O que você deseja pesquisar?</h2>

                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 mb-6 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 focus-within:bg-white">
                        <Search size={22} className="text-fade flex-shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                activeTab === 'books' ? "Buscar livros..." :
                                    activeTab === 'lists' ? "Buscar listas..." :
                                        "Buscar pessoas..."
                            }
                            className="flex-1 bg-transparent text-lg text-ink placeholder:text-fade/70 outline-none"
                            autoFocus
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 text-fade hover:text-ink">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    {/* Close Modal Button - Moved outside input container */}
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-fade hover:text-ink hover:bg-stone-100 rounded-full transition-colors">
                        <span className="sr-only">Fechar</span>
                        <X size={24} />
                    </button>

                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('books')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'books' ? 'bg-ink text-paper' : 'bg-stone-100 text-fade hover:bg-stone-200 hover:text-ink'
                                }`}
                        >
                            <Book size={16} />
                            Livros
                        </button>
                        <button
                            onClick={() => setActiveTab('lists')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'lists' ? 'bg-ink text-paper' : 'bg-stone-100 text-fade hover:bg-stone-200 hover:text-ink'
                                }`}
                        >
                            <ListIcon size={16} />
                            Listas
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-ink text-paper' : 'bg-stone-100 text-fade hover:bg-stone-200 hover:text-ink'
                                }`}
                        >
                            <Users size={16} />
                            Pessoas
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="overflow-y-auto flex-1 min-h-[300px]">
                    {renderResults()}
                </div>
            </div>
        </div>
    );
}
