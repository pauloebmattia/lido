'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function BookUploadForm() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [bookFile, setBookFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'book') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'cover') {
                if (!file.type.startsWith('image/')) return setError('Capa deve ser uma imagem');
                setCoverFile(file);
            } else {
                if (file.type !== 'application/pdf' && file.type !== 'application/epub+zip') {
                    return setError('Livro deve ser PDF ou EPUB');
                }
                setBookFile(file);
            }
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!title || !description || !bookFile) {
            setError('Preencha todos os campos obrigatórios');
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Upload Cover (if exists)
            let coverUrl = null;
            if (coverFile) {
                const coverPath = `${user.id}/${Date.now()}-${coverFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(coverPath, coverFile);

                if (uploadError) throw uploadError;

                const { data: publicUrl } = supabase.storage
                    .from('book-covers')
                    .getPublicUrl(coverPath);

                coverUrl = publicUrl.publicUrl;
            }

            // 2. Insert into Books table
            const { data: book, error: bookError } = await supabase
                .from('books')
                .insert({
                    title,
                    description,
                    cover_url: coverUrl,
                    authors: [user.user_metadata.name || 'Autor Independente'],
                    added_by: user.id,
                    language: 'pt',
                    is_verified: false // Needs manual verification/approval
                })
                .select()
                .single();

            if (bookError) throw bookError;

            // 3. Upload Book File
            const filePath = `${user.id}/${Date.now()}-${bookFile.name}`;
            const { error: fileError } = await supabase.storage
                .from('book-files')
                .upload(filePath, bookFile);

            if (fileError) throw fileError;

            // 4. Insert into Early Access table
            const { error: eaError } = await supabase
                .from('early_access_books')
                .insert({
                    book_id: book.id,
                    author_id: user.id,
                    file_path: filePath,
                    file_type: bookFile.type === 'application/pdf' ? 'pdf' : 'epub',
                    file_size_bytes: bookFile.size,
                    xp_bonus: 50
                });

            if (eaError) throw eaError;

            // 5. Get Profile Username for redirect
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            const username = profile?.username || user.email?.split('@')[0] || 'user';

            // Success
            router.push('/profile/' + username + '?tab=published');

        } catch (err: any) {
            console.error('Error publishing book:', err);
            setError(err.message || 'Erro ao publicar livro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto p-6 bg-paper rounded-2xl shadow-sm border border-stone-200">
            <div>
                <h2 className="text-2xl font-serif font-bold text-ink mb-6">Publicar Livro</h2>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">Título do Livro *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                            placeholder="Ex: As Crônicas de..."
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">Sinopse *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-none"
                            placeholder="Sobre o que é seu livro?"
                            required
                        />
                    </div>

                    {/* Cover Upload */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">Capa (Opcional)</label>
                        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 hover:bg-stone-50 transition-colors text-center cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'cover')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {coverFile ? (
                                <div className="flex items-center justify-center gap-2 text-accent">
                                    <ImageIcon size={20} />
                                    <span className="font-medium">{coverFile.name}</span>
                                </div>
                            ) : (
                                <div className="text-fade">
                                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Arraste ou clique para adicionar uma capa</p>
                                    <p className="text-xs mt-1">PNG, JPG até 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">Arquivo do Livro (PDF/EPUB) *</label>
                        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 hover:bg-stone-50 transition-colors text-center cursor-pointer relative bg-accent/5 border-accent/20">
                            <input
                                type="file"
                                accept=".pdf,.epub"
                                onChange={(e) => handleFileChange(e, 'book')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {bookFile ? (
                                <div className="flex items-center justify-center gap-2 text-accent">
                                    <FileText size={20} />
                                    <span className="font-medium">{bookFile.name}</span>
                                </div>
                            ) : (
                                <div className="text-accent">
                                    <Upload size={32} className="mx-auto mb-2 opacity-80" />
                                    <p className="text-sm font-medium">Upload do arquivo do livro</p>
                                    <p className="text-xs mt-1 opacity-70">PDF ou EPUB até 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-ink py-4 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.99]"
                    >
                        {loading ? 'Publicando...' : 'Publicar Livro'}
                    </button>

                    <p className="text-xs text-center text-fade">
                        Ao publicar, você concorda que possui os direitos autorais desta obra.
                        <br />Seu livro passará por uma breve aprovação antes de aparecer para todos.
                    </p>
                </div>
            </div>
        </form>
    );
}
