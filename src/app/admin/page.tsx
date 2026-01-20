'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Check, X, FileText, Download, Calendar, User } from 'lucide-react';
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

export default function AdminPage() {
    const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

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
            // @ts-ignore - Supabase types might be tricky with nested joins, casting manually for now
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
                // approved_by should be set by backend trigger ideally, or we assume current user is admin
                approved_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', id);

        if (error) {
            toast.error('Erro ao aprovar livro');
        } else {
            toast.success(`'${title}' aprovado com sucesso!`);
            fetchPendingBooks(); // Refresh list
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-ink">Aprovações Pendentes</h2>
            </div>

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
                                                <img
                                                    src={item.book.cover_thumbnail}
                                                    alt=""
                                                    className="w-10 h-14 object-cover rounded shadow-sm bg-stone-200"
                                                />
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.file_type === 'pdf' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
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
        </div>
    );
}
