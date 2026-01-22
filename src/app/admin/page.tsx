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

    const [activeTab, setActiveTab] = useState<'pending' | 'seeds'>('pending');
    const [seedParams, setSeedParams] = useState({
        query: '',
        author: '',
        publisher: '',
        year: '',
        isbn: '',
        count: 5,
        onlyBrazilian: false
    });
    const [seeding, setSeeding] = useState(false);

    // ... (keep fetchPendingBooks and handle functions)

    const handleSeed = async () => {
        setSeeding(true);
        try {
            // Construct Query Params
            const params = new URLSearchParams();
            if (seedParams.query) params.append('query', seedParams.query);
            if (seedParams.author) params.append('author', seedParams.author);
            if (seedParams.publisher) params.append('publisher', seedParams.publisher);
            if (seedParams.year) params.append('year', seedParams.year);
            if (seedParams.isbn) params.append('isbn', seedParams.isbn);
            if (seedParams.onlyBrazilian) params.append('lang', 'pt');
            params.append('count', seedParams.count.toString());

            const res = await fetch(`/api/seed?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                toast.success(`Sucesso! ${data.count} livros gerados.`);
                fetchPendingBooks();
            } else {
                toast.error(data.error || 'Erro ao realizar seed');
            }
        } catch (e) {
            toast.error('Erro de conexão');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-ink">Painel Administrativo</h2>
            </div>

            {/* Simple Tabs */}
            <div className="flex gap-4 border-b border-stone-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'text-accent border-b-2 border-accent' : 'text-fade hover:text-ink'}`}
                >
                    Aprovações Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('seeds')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'seeds' ? 'text-accent border-b-2 border-accent' : 'text-fade hover:text-ink'}`}
                >
                    Gerador de Dados (Seeds)
                </button>
            </div>

            {activeTab === 'pending' && (
                <>
                    {/* Pending Books List (Existing Code) */}
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
                </>
            )}

            {activeTab === 'seeds' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <h3 className="font-semibold text-ink mb-4">Gerar Dados de Teste</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Termo Geral</label>
                                <input
                                    type="text"
                                    value={seedParams.query}
                                    onChange={(e) => setSeedParams({ ...seedParams, query: e.target.value })}
                                    placeholder="Ex: Fantasia, Harry Potter..."
                                    className="input w-full border border-stone-200 rounded-lg p-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Autor</label>
                                    <input
                                        type="text"
                                        value={seedParams.author}
                                        onChange={(e) => setSeedParams({ ...seedParams, author: e.target.value })}
                                        placeholder="Ex: Tolkien"
                                        className="input w-full border border-stone-200 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Editora</label>
                                    <input
                                        type="text"
                                        value={seedParams.publisher}
                                        onChange={(e) => setSeedParams({ ...seedParams, publisher: e.target.value })}
                                        placeholder="Ex: Rocco"
                                        className="input w-full border border-stone-200 rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">Ano</label>
                                    <input
                                        type="text"
                                        value={seedParams.year}
                                        onChange={(e) => setSeedParams({ ...seedParams, year: e.target.value })}
                                        placeholder="Ex: 2001"
                                        className="input w-full border border-stone-200 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink mb-1">ISBN</label>
                                    <input
                                        type="text"
                                        value={seedParams.isbn}
                                        onChange={(e) => setSeedParams({ ...seedParams, isbn: e.target.value })}
                                        placeholder="ISBN-13 ou 10"
                                        className="input w-full border border-stone-200 rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">Quantidade</label>
                                <input
                                    type="number"
                                    value={seedParams.count}
                                    onChange={(e) => setSeedParams({ ...seedParams, count: parseInt(e.target.value) })}
                                    min={1}
                                    max={20}
                                    className="input w-full border border-stone-200 rounded-lg p-2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="onlyBrazilian"
                                    checked={seedParams.onlyBrazilian}
                                    onChange={(e) => setSeedParams({ ...seedParams, onlyBrazilian: e.target.checked })}
                                    className="h-4 w-4 rounded border-stone-300 text-accent focus:ring-accent"
                                />
                                <label htmlFor="onlyBrazilian" className="text-sm font-medium text-ink select-none">
                                    Procurar por edições brasileiras?
                                </label>
                            </div>

                            <Button
                                onClick={handleSeed}
                                disabled={seeding || (!seedParams.query && !seedParams.author && !seedParams.isbn)}
                                className="w-full"
                            >
                                {seeding ? 'Gerando...' : 'Iniciar Seed'}
                            </Button>
                        </div>
                    </div>

                    <div className="card p-6 bg-stone-50 border-dashed border-2">
                        <h3 className="font-semibold text-ink mb-2">Dica de uso</h3>
                        <p className="text-sm text-fade mb-4">
                            Combine os filtros para ser mais específico. A busca usa a API do Google Books.
                        </p>
                        <ul className="text-sm text-fade space-y-2 list-disc list-inside">
                            <li>Para achar uma edição específica, use o <strong>ISBN</strong>.</li>
                            <li>Para livros de uma editora específica, preencha o campo <strong>Editora</strong>.</li>
                            <li>Se não encontrar nada, tente simplificar a busca (ex: tire o ano).</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
