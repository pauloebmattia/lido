'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Book as BookIcon, Download, Eye, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { EarlyAccessBook, Book } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils'; // Assuming this utility exists

interface PublishedBook extends EarlyAccessBook {
    book: Book;
}

export function AuthorDashboard() {
    const [publications, setPublications] = useState<PublishedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPublications() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('early_access_books')
                .select(`
                    *,
                    book:books(*)
                `)
                .eq('author_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setPublications(data as PublishedBook[]);
            }
            setLoading(false);
        }

        fetchPublications();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-fade animate-pulse">Carregando suas publicações...</div>;
    }

    if (publications.length === 0) {
        return (
            <div className="text-center py-16 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <BookIcon size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-xl font-serif font-semibold text-ink mb-2">Você ainda não publicou nada</h3>
                <p className="text-fade mb-8 max-w-md mx-auto">
                    Compartilhe suas histórias com a comunidade. Publique seu primeiro livro e ganhe XP!
                </p>
                <Link href="/publish/new">
                    <button className="btn-ink px-8 py-3 rounded-full flex items-center gap-2 mx-auto">
                        <Plus size={20} />
                        Publicar Meu Primeiro Livro
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-ink">Minhas Publicações</h2>
                    <p className="text-fade text-sm mt-1">Gerencie seus livros e acompanhe o desempenho</p>
                </div>
                <Link href="/publish/new">
                    <button className="btn-ink px-6 py-2 rounded-full flex items-center gap-2 text-sm">
                        <Plus size={18} />
                        Nova Publicação
                    </button>
                </Link>
            </div>

            <div className="grid gap-4">
                {publications.map((item) => (
                    <div key={item.id} className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                        {/* Cover */}
                        <div className="w-16 h-24 flex-shrink-0 bg-stone-200 rounded-md overflow-hidden">
                            {item.book.cover_url ? (
                                <img src={item.book.cover_url} alt={item.book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-fade">Sem capa</div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-ink truncate pr-4">{item.book.title}</h3>
                                    <p className="text-xs text-fade mb-2">Publicado {formatRelativeTime(item.created_at)}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${item.is_approved
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {item.is_approved ? (
                                        <>
                                            <CheckCircle2 size={12} />
                                            Aprovado
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={12} />
                                            Em Análise
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 mt-3 text-sm">
                                <div className="flex items-center gap-2 text-fade" title="Total de Downloads">
                                    <Download size={16} />
                                    <span className="font-medium text-ink">{item.download_count}</span>
                                </div>
                                <div className="flex items-center gap-2 text-fade" title="Avaliações">
                                    <Eye size={16} /> {/* Using Eye for reviews/views proxy for now */}
                                    <span className="font-medium text-ink">{item.book.reviews_count} reviews</span>
                                </div>
                                <div className="flex items-center gap-2 text-fade" title="Nota Média">
                                    <span className="text-yellow-500">★</span>
                                    <span className="font-medium text-ink">{item.book.avg_rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
