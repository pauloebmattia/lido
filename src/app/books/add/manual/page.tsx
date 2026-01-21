'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Loader2, Upload, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { translateCategory } from '@/lib/utils';
import type { Profile } from '@/lib/supabase/types';

export default function ManualAddPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<Profile | null>(null);

    // Form Stats
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [description, setDescription] = useState('');
    const [pageCount, setPageCount] = useState('');
    const [publisher, setPublisher] = useState('');
    const [publishedDate, setPublishedDate] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    const [error, setError] = useState('');

    const supabase = createClient();

    useEffect(() => {
        async function fetchUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(profile);
            }
            setIsLoading(false);
        }
        fetchUser();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('Você precisa estar logado para adicionar livros.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Generate a unique ID (or let DB do it if uuid, but we insert directly)
            // Books table uses default gen_random_uuid(), so we don't need to supply id.

            const bookData = {
                title,
                authors: authors.split(',').map(a => a.trim()).filter(Boolean),
                description,
                page_count: parseInt(pageCount) || null,
                publisher,
                published_date: publishedDate,
                cover_url: coverUrl || null,
                cover_thumbnail: coverUrl || null,
                google_books_id: null, // Manual entry
                categories: []
            };

            const { data, error: insertError } = await supabase
                .from('books')
                .insert(bookData)
                .select()
                .single();

            if (insertError) throw insertError;

            // Redirect to the new book page
            router.push(`/books/${data.id}`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao adicionar livro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-paper flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-24 pb-16">
                <div className="max-w-2xl mx-auto px-4">
                    <Link href="/books/add" className="inline-flex items-center text-fade hover:text-ink mb-6">
                        <ArrowLeft size={18} className="mr-2" />
                        Voltar
                    </Link>

                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-stone-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-accent/10 rounded-xl text-accent">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-ink">Cadastro Manual</h1>
                                <p className="text-fade text-sm">Adicione um livro que não encontrou na busca.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Título *</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                    placeholder="Ex: Dom Casmurro"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Autores * (separados por vírgula)</label>
                                <input
                                    value={authors}
                                    onChange={e => setAuthors(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                    placeholder="Ex: Machado de Assis"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Páginas</label>
                                    <input
                                        type="number"
                                        value={pageCount}
                                        onChange={e => setPageCount(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                        placeholder="Ex: 256"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Data (Ano ou YYYY-MM-DD)</label>
                                    <input
                                        value={publishedDate}
                                        onChange={e => setPublishedDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                                        placeholder="Ex: 1899"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">URL da Capa (Opcional)</label>
                                <input
                                    value={coverUrl}
                                    onChange={e => setCoverUrl(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none font-mono text-xs"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Sinopse</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none h-32 resize-none"
                                    placeholder="Breve descrição do livro..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" isLoading={isSubmitting}>
                                    <div className="flex items-center gap-2">
                                        <Save size={18} />
                                        Cadastrar Livro
                                    </div>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
