'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Check, X, FileText, Calendar, Search, Edit3, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface PendingBook {
    id: string;
    book: {
        title: string;
        authors: string[];
        cover_thumbnail: string | null;
    };
    author: {
        username: string;
        display_name: string | null;
    };
    file_type: 'pdf' | 'epub';
    created_at: string;
}

interface SearchResult {
    google_books_id: string;
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    published_date: string | null;
    description: string | null;
    page_count: number | null;
    language: string;
    categories: string[];
    cover_url: string | null;
    cover_thumbnail: string | null;
    isbn: string | null;
}

export default function AdminPage() {
    const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);

    // Edit modal state
    const [editingBook, setEditingBook] = useState<SearchResult | null>(null);
    const [editForm, setEditForm] = useState<SearchResult | null>(null);

    const fetchPendingBooks = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('early_access_books')
            .select(`
                id,
                file_type,
                created_at,
                book:book_id (
                    title,
                    authors,
                    cover_thumbnail
                ),
                author:author_id (
                    username,
                    display_name
                )
            `)
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending books:', error);
            toast.error('Erro ao carregar livros pendentes');
        } else {
            setPendingBooks(data as unknown as PendingBook[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPendingBooks();
    }, []);

    const handleApprove = async (id: string, title: string) => {
        const { error } = await supabase
            .from('early_access_books')
            .update({
                is_approved: true,
                approved_at: new Date().toISOString(),
                approved_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', id);

        if (error) {
            toast.error('Erro ao aprovar livro');
        } else {
            toast.success(`'${title}' aprovado com sucesso!`);
            fetchPendingBooks();
        }
    };

    const handleReject = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja rejeitar e remover '${title}'?`)) return;

        const { error } = await supabase
            .from('early_access_books')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Erro ao rejeitar livro');
        } else {
            toast.success(`'${title}' removido.`);
            fetchPendingBooks();
        }
    };

    const [activeTab, setActiveTab] = useState<'pending' | 'import'>('pending');

    // Search books
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setSearchResults([]);

        try {
            const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&limit=15`);
            const data = await res.json();

            if (res.ok && data.books) {
                setSearchResults(data.books);
                if (data.books.length === 0) {
                    toast.info('Nenhum resultado encontrado');
                }
            } else {
                toast.error(data.error || 'Erro na busca');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setSearching(false);
        }
    };

    // Import book directly
    const handleImport = async (book: SearchResult) => {
        setImporting(book.google_books_id);

        try {
            const res = await fetch('/api/books/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Livro importado!');
                // Remove from results
                setSearchResults(prev => prev.filter(b => b.google_books_id !== book.google_books_id));
            } else {
                toast.error(data.error || 'Erro ao importar');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setImporting(null);
        }
    };

    // Open edit modal
    const handleEditBefore = (book: SearchResult) => {
        setEditingBook(book);
        setEditForm({ ...book });
    };

    // Import from edit modal
    const handleImportEdited = async () => {
        if (!editForm) return;

        setImporting(editForm.google_books_id);

        try {
            const res = await fetch('/api/books/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Livro importado!');
                setSearchResults(prev => prev.filter(b => b.google_books_id !== editForm.google_books_id));
                setEditingBook(null);
                setEditForm(null);
            } else {
                toast.error(data.error || 'Erro ao importar');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-ink">Painel Administrativo</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-stone-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'text-accent border-b-2 border-accent' : 'text-fade hover:text-ink'}`}
                >
                    Aprovações Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'import' ? 'text-accent border-b-2 border-accent' : 'text-fade hover:text-ink'}`}
                >
                    Importar Livros
                </button>
            </div>

            {/* Pending Tab */}
            {activeTab === 'pending' && (
                <>
                    {isLoading ? (
                        <div className="text-center py-12 text-fade">Carregando...</div>
                    ) : pendingBooks.length === 0 ? (
                        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                                <Check size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-ink">Tudo em dia!</h3>
                            <p className="text-fade mt-1">Nenhum livro pendente de aprovação no momento.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-xs text-fade uppercase tracking-wider">
                                        <th className="px-6 py-4 font-medium">Livro</th>
                                        <th className="px-6 py-4 font-medium">Autor</th>
                                        <th className="px-6 py-4 font-medium">Formato</th>
                                        <th className="px-6 py-4 font-medium">Data</th>
                                        <th className="px-6 py-4 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {pendingBooks.map((item) => (
                                        <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.book.cover_thumbnail ? (
                                                        <img src={item.book.cover_thumbnail} alt="" className="w-10 h-14 object-cover rounded shadow-sm bg-stone-200" />
                                                    ) : (
                                                        <div className="w-10 h-14 bg-stone-200 rounded flex items-center justify-center text-stone-400">
                                                            <FileText size={16} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-ink">{item.book.title}</p>
                                                        <p className="text-xs text-fade">{item.book.authors?.[0] || 'Desconhecido'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                                                        {item.author.display_name?.[0] || item.author.username[0]}
                                                    </div>
                                                    <span className="text-sm text-ink">{item.author.display_name || item.author.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.file_type === 'pdf' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {item.file_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-fade">
                                                    <Calendar size={14} />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-stone-200"
                                                        onClick={() => handleReject(item.id, item.book.title)}
                                                        title="Rejeitar"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white border-transparent"
                                                        onClick={() => handleApprove(item.id, item.book.title)}
                                                        title="Aprovar"
                                                    >
                                                        <Check size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
                <div className="space-y-6">
                    {/* Search Box */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                            <Search size={20} />
                            Buscar Livros para Importar
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Digite o título, autor ou ISBN..."
                                className="flex-1 border border-stone-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                                {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                <span className="ml-2">{searching ? 'Buscando...' : 'Buscar'}</span>
                            </Button>
                        </div>
                        <p className="text-xs text-fade mt-2">
                            Pesquisa em várias fontes: Google Books, Open Library e catálogo interno.
                        </p>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-ink flex items-center gap-2">
                                <BookOpen size={18} />
                                Resultados ({searchResults.length})
                            </h4>
                            <div className="grid gap-4">
                                {searchResults.map((book) => (
                                    <div key={book.google_books_id} className="card p-4 flex gap-4 items-start">
                                        {/* Cover */}
                                        <div className="flex-shrink-0">
                                            {book.cover_thumbnail ? (
                                                <img src={book.cover_thumbnail} alt="" className="w-16 h-24 object-cover rounded shadow-sm bg-stone-200" />
                                            ) : (
                                                <div className="w-16 h-24 bg-stone-200 rounded flex items-center justify-center text-stone-400">
                                                    <BookOpen size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-ink truncate">{book.title}</h5>
                                            {book.subtitle && (
                                                <p className="text-sm text-fade truncate">{book.subtitle}</p>
                                            )}
                                            <p className="text-sm text-fade mt-1">
                                                {book.authors?.join(', ') || 'Autor desconhecido'}
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fade mt-2">
                                                {book.publisher && <span>📚 {book.publisher}</span>}
                                                {book.published_date && <span>📅 {book.published_date}</span>}
                                                {book.page_count && <span>📄 {book.page_count} págs</span>}
                                                {book.isbn && <span>🔢 {book.isbn}</span>}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleImport(book)}
                                                disabled={importing === book.google_books_id}
                                                className="whitespace-nowrap"
                                            >
                                                {importing === book.google_books_id ? (
                                                    <Loader2 size={14} className="animate-spin mr-1" />
                                                ) : (
                                                    <Check size={14} className="mr-1" />
                                                )}
                                                Importar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditBefore(book)}
                                                className="whitespace-nowrap"
                                            >
                                                <Edit3 size={14} className="mr-1" />
                                                Editar antes
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state after search */}
                    {!searching && searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8 text-fade">
                            Nenhum resultado para mostrar. Faça uma busca acima.
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingBook && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingBook(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-stone-200 p-5 flex items-center justify-between">
                            <h3 className="font-serif text-xl font-semibold text-ink">Editar antes de importar</h3>
                            <button onClick={() => setEditingBook(null)} className="text-fade hover:text-ink p-2">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Cover Preview */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    {editForm.cover_url ? (
                                        <img src={editForm.cover_url} alt="" className="w-24 h-36 object-cover rounded shadow-sm bg-stone-200" />
                                    ) : (
                                        <div className="w-24 h-36 bg-stone-200 rounded flex items-center justify-center text-stone-400">
                                            <BookOpen size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-ink mb-1">URL da Capa</label>
                                    <input
                                        type="text"
                                        value={editForm.cover_url || ''}
                                        onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value, cover_thumbnail: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Título *</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Subtítulo</label>
                                <input
                                    type="text"
                                    value={editForm.subtitle || ''}
                                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Authors */}
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Autores (separados por vírgula)</label>
                                <input
                                    type="text"
                                    value={editForm.authors?.join(', ') || ''}
                                    onChange={(e) => setEditForm({ ...editForm, authors: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Publisher & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Editora</label>
                                    <input
                                        type="text"
                                        value={editForm.publisher || ''}
                                        onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Data de Publicação</label>
                                    <input
                                        type="text"
                                        value={editForm.published_date || ''}
                                        onChange={(e) => setEditForm({ ...editForm, published_date: e.target.value })}
                                        placeholder="2023 ou 2023-01-15"
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            {/* Page Count & ISBN */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Número de Páginas</label>
                                    <input
                                        type="number"
                                        value={editForm.page_count || ''}
                                        onChange={(e) => setEditForm({ ...editForm, page_count: parseInt(e.target.value) || null })}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">ISBN</label>
                                    <input
                                        type="text"
                                        value={editForm.isbn || ''}
                                        onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Descrição</label>
                                <textarea
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={4}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Categorias (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    value={editForm.categories?.join(', ') || ''}
                                    onChange={(e) => setEditForm({ ...editForm, categories: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-5 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setEditingBook(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleImportEdited} disabled={importing === editForm.google_books_id || !editForm.title}>
                                {importing === editForm.google_books_id ? (
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                ) : (
                                    <Check size={16} className="mr-2" />
                                )}
                                Importar Livro
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
