'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CleanBookData } from '@/lib/google-books';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBook?: (book: CleanBookData) => void;
}

export function SearchModal({ isOpen, onClose, onSelectBook }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CleanBookData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounced search
    const searchBooks = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setResults(data.books || []);
        } catch (error) {
            console.error('Error searching books:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchBooks(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, searchBooks]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-paper rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-stone-200">
                    <div className="flex items-center gap-3">
                        <Search size={20} className="text-fade" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar livros por título, autor ou ISBN..."
                            className="flex-1 bg-transparent text-lg text-ink placeholder:text-fade outline-none"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setResults([]);
                                    setHasSearched(false);
                                }}
                                className="p-1 text-fade hover:text-ink transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-fade hover:text-ink transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-accent" size={32} />
                        </div>
                    )}

                    {!isLoading && hasSearched && results.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-fade">Nenhum livro encontrado para "{query}"</p>
                            <p className="text-sm text-fade mt-2">
                                Tente outro termo ou adicione manualmente
                            </p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="divide-y divide-stone-100">
                            {results.map((book) => (
                                <div
                                    key={book.google_books_id}
                                    className="flex gap-4 p-4 hover:bg-stone-50 transition-colors cursor-pointer"
                                    onClick={() => onSelectBook?.(book)}
                                >
                                    {/* Cover */}
                                    <div className="flex-shrink-0">
                                        {book.cover_thumbnail ? (
                                            <img
                                                src={book.cover_thumbnail}
                                                alt={book.title}
                                                className="w-12 h-18 rounded-lg object-cover shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-12 h-18 rounded-lg bg-stone-200 flex items-center justify-center">
                                                <span className="text-xs text-fade">Sem capa</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-ink line-clamp-1">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-fade line-clamp-1">
                                            {book.authors.join(', ')}
                                        </p>
                                        <p className="text-xs text-fade mt-1">
                                            {book.publisher} {book.published_date && `• ${book.published_date.substring(0, 4)}`}
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div className="flex-shrink-0 self-center">
                                        <Button variant="ghost" size="sm">
                                            <Plus size={16} className="mr-1" />
                                            Adicionar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!hasSearched && !isLoading && (
                        <div className="py-12 text-center">
                            <p className="text-fade">Digite pelo menos 3 caracteres para buscar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
