'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Lock, Globe, BookOpen, Search, Pencil, Save, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useBookActions } from '@/hooks/useBookActions';
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
    const [supabase] = useState(() => createClient());

    // Actions hooks
    const { addBookToDatabase } = useBookActions({ userId: user?.id });

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPublic, setEditPublic] = useState(true);
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Search State
    const [showAddBook, setShowAddBook] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]); // Using any to handle mixed types temporarily
    const [searching, setSearching] = useState(false);

    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<ListItem | null>(null);

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

            await fetchList();
            setLoading(false);
        }
        loadData();
    }, [listId, supabase]);

    const fetchList = async () => {
        const res = await fetch(`/api/lists?list_id=${listId}`);
        if (res.ok) {
            const data = await res.json();
            const listData = data.list;

            // Sort items by position
            if (listData.items) {
                listData.items.sort((a: ListItem, b: ListItem) => a.position - b.position);
            }

            setList(listData);

            // Reset edit state vars
            setEditName(listData.name);
            setEditDesc(listData.description || '');
            setEditPublic(listData.is_public);
            setEditCoverPreview(listData.cover_url);
        }
    };

    // --- Search Logic ---
    const handleSearch = async () => {
        if (searchQuery.length < 2) return;

        setSearching(true);
        try {
            // Use the main search API which searches both DB and Google Books
            const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.books || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleAddBook = async (book: any) => {
        let bookId = book.google_books_id; // In search results, this holds either UUID or Google ID

        // If it's not a UUID (it's a Google ID), we need to add to DB first
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);

        if (!isUuid) {
            const addedBook = await addBookToDatabase(book);
            if (!addedBook) {
                alert('Erro ao adicionar livro ao banco de dados.');
                return;
            }
            bookId = addedBook.id;
        }

        // Add to list
        const res = await fetch('/api/lists/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list_id: listId, book_id: bookId }),
        });

        if (res.ok) {
            await fetchList();
            setShowAddBook(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    // --- Edit List Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditCoverFile(file);
            setEditCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveList = async () => {
        if (!editName.trim()) return;
        setSaving(true);

        try {
            let coverUrl = editCoverPreview;

            // Upload new cover if selected
            if (editCoverFile) {
                const fileExt = editCoverFile.name.split('.').pop();
                const fileName = `list-covers/${Math.random()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(fileName, editCoverFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('book-covers')
                        .getPublicUrl(fileName);
                    coverUrl = publicUrl;
                }
            }

            // Update List using PUT
            const res = await fetch('/api/lists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    list_id: listId,
                    name: editName,
                    description: editDesc,
                    is_public: editPublic,
                    cover_url: coverUrl,
                }),
            });

            if (res.ok) {
                await fetchList();
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // --- Reorder Logic (DnD) ---
    const handleDragStart = (e: React.DragEvent, item: ListItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        // Make ghost image cleaner
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent, targetItem: ListItem) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetItem.id) return;

        // Reorder locally
        const formers = [...(list?.items || [])];
        const oldIndex = formers.findIndex(i => i.id === draggedItem.id);
        const newIndex = formers.findIndex(i => i.id === targetItem.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const [moved] = formers.splice(oldIndex, 1);
            formers.splice(newIndex, 0, moved);

            // Re-assign positions temporarily
            const reordered = formers.map((item, idx) => ({ ...item, position: idx }));

            if (list) {
                setList({ ...list, items: reordered });
            }
        }
    };

    const saveOrder = async () => {
        if (!list?.items) return;

        // Prepare payload: id and new position
        const itemsToUpdate = list.items.map((item, index) => ({
            id: item.id,
            position: index
        }));

        await fetch('/api/lists/items/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToUpdate }),
        });
    };

    // Auto-save order on drop (a bit simplified)
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        // Trigger save
        await saveOrder();
    };


    const handleRemoveBook = async (bookId: string) => {
        if (!confirm('Remover livro da lista?')) return;

        await fetch(`/api/lists/items?list_id=${listId}&book_id=${bookId}`, {
            method: 'DELETE',
        });

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
                    <Link
                        href="/lists"
                        className="inline-flex items-center gap-2 text-fade hover:text-ink transition-colors py-4 my-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para Listas</span>
                    </Link>

                    {/* List Header */}
                    <div className="card p-6 mt-2 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                            {/* Create/Edit logic for cover */}
                            <div className="relative group mx-auto sm:mx-0">
                                <div className="w-32 h-40 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-stone-200">
                                    {isEditing ? (
                                        <>
                                            {editCoverPreview ? (
                                                <img src={editCoverPreview} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-fade" size={32} />
                                            )}
                                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Pencil className="text-white" size={24} />
                                                <input type="file" onChange={handleFileSelect} accept="image/*" className="hidden" />
                                            </label>
                                        </>
                                    ) : (
                                        list.cover_url ? (
                                            <img src={list.cover_url} alt={list.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                                <BookOpen className="text-accent" size={40} />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full text-2xl font-bold bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                                            placeholder="Nome da lista"
                                        />
                                        <textarea
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-accent focus:outline-none"
                                            placeholder="Descrição"
                                            rows={2}
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                                            <input
                                                type="checkbox"
                                                checked={editPublic}
                                                onChange={(e) => setEditPublic(e.target.checked)}
                                                className="w-4 h-4 rounded text-accent focus:ring-accent"
                                            />
                                            <span className="text-sm text-fade">Lista Pública</span>
                                        </label>

                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" onClick={handleSaveList} disabled={saving}>
                                                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                                Salvar
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0">
                                                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink truncate">
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

                                            {isOwner && (
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                                    <Pencil size={18} />
                                                </Button>
                                            )}
                                        </div>

                                        {list.description && (
                                            <p className="text-fade mt-4 leading-relaxed">{list.description}</p>
                                        )}

                                        {isOwner && (
                                            <Button
                                                onClick={() => setShowAddBook(true)}
                                                className="mt-6"
                                                variant="secondary"
                                            >
                                                <Plus size={18} className="mr-2" />
                                                Adicionar Livro
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Books List with DnD */}
                    <div className="mt-6 space-y-3">
                        {list.items?.length > 0 ? (
                            list.items.map((item) => (
                                <div
                                    key={item.id}
                                    draggable={isOwner}
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onDragOver={(e) => handleDragOver(e, item)}
                                    onDragEnd={handleDragEnd}
                                    onDrop={handleDrop}
                                    className={`card p-4 flex items-center gap-4 transition-all duration-200 ${isOwner ? 'cursor-grab active:cursor-grabbing hover:border-accent/40 hover:shadow-md' : ''
                                        } ${draggedItem?.id === item.id ? 'opacity-50 scale-[0.99] border-dashed border-accent' : 'opacity-100'}`}
                                >
                                    {isOwner && (
                                        <div className="text-stone-300 cursor-grab active:cursor-grabbing hover:text-stone-500">
                                            <GripVertical size={20} />
                                        </div>
                                    )}

                                    <Link href={`/books/${item.book.id}`} className="shrink-0 pointer-events-none sm:pointer-events-auto">
                                        {item.book.cover_thumbnail ? (
                                            <img
                                                src={item.book.cover_thumbnail}
                                                alt={item.book.title}
                                                className="w-16 h-20 rounded-lg object-cover shadow-sm select-none"
                                            />
                                        ) : (
                                            <div className="w-16 h-20 bg-stone-100 rounded-lg flex items-center justify-center">
                                                <BookOpen size={24} className="text-stone-400" />
                                            </div>
                                        )}
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <Link href={`/books/${item.book.id}`} className="hover:text-accent transition-colors">
                                            <h3 className="font-medium text-ink truncate select-none">{item.book.title}</h3>
                                        </Link>
                                        <p className="text-sm text-fade truncate select-none">
                                            {item.book.authors?.join(', ')}
                                        </p>
                                    </div>

                                    {isOwner && (
                                        <button
                                            onClick={() => handleRemoveBook(item.book.id)}
                                            className="p-2 text-fade hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Remover da lista"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                                <BookOpen className="mx-auto text-stone-300 mb-4" size={40} />
                                <p className="text-fade">Esta lista ainda não tem livros.</p>
                                {isOwner && (
                                    <Button onClick={() => setShowAddBook(true)} variant="link" className="mt-2 text-accent">
                                        Começar a adicionar
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Book Modal */}
                    {showAddBook && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20 animate-in fade-in duration-200">
                            <div className="absolute inset-0" onClick={() => setShowAddBook(false)} />
                            <div className="relative bg-paper rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6 shrink-0">
                                    <h2 className="font-serif text-xl font-semibold text-ink">Adicionar Livro</h2>
                                    <button onClick={() => setShowAddBook(false)} className="text-fade hover:text-ink p-2 hover:bg-stone-100 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2 mb-6 shrink-0">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fade" size={18} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Buscar livros (título, autor, ISBN)..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <Button onClick={handleSearch} disabled={searching} isLoading={searching}>
                                        Buscar
                                    </Button>
                                </div>

                                <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                    {searchResults.map((book) => (
                                        <div key={book.google_books_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200 group">
                                            {book.cover_thumbnail ? (
                                                <img
                                                    src={book.cover_thumbnail}
                                                    alt={book.title}
                                                    className="w-12 h-16 rounded object-cover shadow-sm bg-stone-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-16 bg-stone-100 rounded flex items-center justify-center text-stone-400">
                                                    <BookOpen size={20} />
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
                                                variant="secondary"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleAddBook(book)}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    ))}

                                    {searchResults.length === 0 && searchQuery && !searching && (
                                        <div className="text-center py-8">
                                            <p className="text-fade">Nenhum livro encontrado</p>
                                            <p className="text-xs text-stone-400 mt-1">Tente buscar pelo título em inglês ou ISBN</p>
                                        </div>
                                    )}

                                    {!searchQuery && (
                                        <div className="text-center py-12 px-4">
                                            <Search className="mx-auto text-stone-200 mb-3" size={32} />
                                            <p className="text-stone-400 text-sm">Digite acima para buscar livros no Google Books</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
