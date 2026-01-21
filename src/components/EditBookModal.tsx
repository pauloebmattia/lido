'use client';

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import type { Book } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

interface EditBookModalProps {
    book: Book;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedBook: Book) => void;
}

export function EditBookModal({ book, isOpen, onClose, onUpdate }: EditBookModalProps) {
    const [title, setTitle] = useState(book.title);
    const [authors, setAuthors] = useState(book.authors.join(', '));
    const [description, setDescription] = useState(book.description || '');
    const [pageCount, setPageCount] = useState(book.page_count?.toString() || '');
    const [publisher, setPublisher] = useState(book.publisher || '');
    const [publishedDate, setPublishedDate] = useState(book.published_date || '');
    const [coverUrl, setCoverUrl] = useState(book.cover_url || '');

    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createClient();

        const updates = {
            title,
            authors: authors.split(',').map(a => a.trim()).filter(Boolean),
            description,
            page_count: parseInt(pageCount) || null,
            publisher,
            published_date: publishedDate,
            cover_url: coverUrl,
            cover_thumbnail: coverUrl,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('books')
            .update(updates)
            .eq('id', book.id);

        if (!error) {
            onUpdate({ ...book, ...updates, authors: updates.authors });
            onClose();
        } else {
            alert('Erro ao atualizar livro: ' + error.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-serif font-bold text-ink">Editar Livro (Admin)</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Título</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Autores (separados por vírgula)</label>
                        <input
                            value={authors}
                            onChange={e => setAuthors(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Páginas</label>
                            <input
                                type="number"
                                value={pageCount}
                                onChange={e => setPageCount(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Data Publicação</label>
                            <input
                                value={publishedDate}
                                onChange={e => setPublishedDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Editora</label>
                        <input
                            value={publisher}
                            onChange={e => setPublisher(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">URL da Capa</label>
                        <input
                            value={coverUrl}
                            onChange={e => setCoverUrl(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Sinopse</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-accent focus:outline-none h-32"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-stone-500 hover:text-stone-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
