'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, MoreVertical, BookOpen, Loader2, Trash2, Lock, Globe, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

interface BookList {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    cover_url: string | null;
    created_at: string;
    items: { count: number }[];
}

function ListsContent() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState<Profile | null>(null);
    const [lists, setLists] = useState<BookList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [newListPublic, setNewListPublic] = useState(true);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
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

                // Fetch user's lists
                const res = await fetch(`/api/lists?user_id=${authUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setLists(data.lists || []);
                }
            }

            setLoading(false);
        }

        loadData();
    }, [supabase]);

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowCreate(true);
        }
    }, [searchParams]);

    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        setCreating(true);
        try {
            let coverUrl = null;

            // Upload cover if selected
            if (coverFile) {
                const fileExt = coverFile.name.split('.').pop();
                const fileName = `list-covers/${Math.random()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(fileName, coverFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('book-covers')
                        .getPublicUrl(fileName);
                    coverUrl = publicUrl;
                }
            }

            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newListName,
                    description: newListDesc || null,
                    is_public: newListPublic,
                    cover_url: coverUrl,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setLists([data.list, ...lists]);
                setNewListName('');
                setNewListDesc('');
                setCoverFile(null);
                setCoverPreview(null);
                setShowCreate(false);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

        await fetch(`/api/lists?list_id=${listId}`, { method: 'DELETE' });
        setLists(lists.filter(l => l.id !== listId));
    };

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
                    <h1 className="font-serif text-3xl font-bold text-ink mb-4">Minhas Listas</h1>
                    <p className="text-fade mb-6">Entre na sua conta para criar e gerenciar suas listas de livros.</p>
                    <Link href="/login">
                        <Button size="lg" className="btn-shimmer">Entrar</Button>
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
                    {/* Header */}
                    <div className="py-8 flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Minhas Listas</h1>
                            <p className="mt-2 text-fade">{lists.length} lista{lists.length !== 1 ? 's' : ''}</p>
                        </div>
                        <Button onClick={() => setShowCreate(true)}>
                            <Plus size={18} className="mr-2" />
                            Nova Lista
                        </Button>
                    </div>

                    {/* Create List Modal */}
                    {showCreate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
                            <div className="relative bg-paper rounded-2xl p-6 w-full max-w-md shadow-xl">
                                <h2 className="font-serif text-xl font-semibold text-ink mb-4">Nova Lista</h2>

                                <div className="space-y-4">
                                    {/* Cover Upload */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <div
                                                className={`w-32 h-40 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${coverPreview ? 'border-accent' : 'border-stone-200 hover:border-accent'
                                                    }`}
                                            >
                                                {coverPreview ? (
                                                    <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center text-fade p-2">
                                                        <ImageIcon className="mx-auto mb-2" size={24} />
                                                        <span className="text-xs">Adicionar Capa</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    onChange={handleFileSelect}
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            {coverPreview && (
                                                <button
                                                    onClick={() => {
                                                        setCoverFile(null);
                                                        setCoverPreview(null);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-ink mb-1">Nome</label>
                                        <input
                                            type="text"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            placeholder="Ex: Melhores de 2024"
                                            className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-ink mb-1">Descrição (opcional)</label>
                                        <textarea
                                            value={newListDesc}
                                            onChange={(e) => setNewListDesc(e.target.value)}
                                            placeholder="Uma breve descrição..."
                                            rows={2}
                                            className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-accent focus:outline-none resize-none"
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newListPublic}
                                            onChange={(e) => setNewListPublic(e.target.checked)}
                                            className="w-5 h-5 rounded"
                                        />
                                        <span className="text-fade">Lista pública (outros podem ver)</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
                                    <Button onClick={handleCreateList} isLoading={creating} disabled={!newListName.trim()}>
                                        Criar Lista
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lists Grid */}
                    {lists.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {lists.map((list) => (
                                <div key={list.id} className="card p-4 flex gap-4">
                                    <div className="w-16 h-20 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                        {list.cover_url ? (
                                            <img src={list.cover_url} alt={list.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen className="text-stone-400" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <Link href={`/lists/${list.id}`} className="hover:text-accent">
                                                <h3 className="font-medium text-ink truncate">{list.name}</h3>
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteList(list.id)}
                                                className="p-1 text-fade hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {list.description && (
                                            <p className="text-sm text-fade line-clamp-2 mt-1">{list.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-fade">
                                            <span>{list.items?.[0]?.count || 0} livros</span>
                                            {list.is_public ? (
                                                <span className="flex items-center gap-1"><Globe size={12} /> Pública</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Lock size={12} /> Privada</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <BookOpen className="mx-auto text-fade mb-4" size={48} />
                            <p className="text-fade text-lg mb-4">Você ainda não criou nenhuma lista.</p>
                            <Button onClick={() => setShowCreate(true)}>
                                <Plus size={18} className="mr-2" />
                                Criar Primeira Lista
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ListsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-paper">
                <NavBar user={null} />
                <div className="pt-32 flex justify-center">
                    <Loader2 className="animate-spin text-fade" size={32} />
                </div>
            </div>
        }>
            <ListsContent />
        </Suspense>
    );
}
