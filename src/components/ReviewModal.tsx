'use client';

import { useState } from 'react';
import { X, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VibeBadge, VibePickerOption, DEFAULT_VIBES } from '@/components/VibeBadge';
import type { Book, Vibe } from '@/lib/supabase/types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book;
    onSubmit: (review: ReviewData) => Promise<void>;
}

export interface ReviewData {
    rating: number;
    content: string;
    vibes: Vibe[];
    containsSpoilers: boolean;
}

export function ReviewModal({ isOpen, onClose, book, onSubmit }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');
    const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
    const [containsSpoilers, setContainsSpoilers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleVibeToggle = (vibe: Vibe) => {
        setSelectedVibes((prev) => {
            if (prev.find((v) => v.id === vibe.id)) {
                return prev.filter((v) => v.id !== vibe.id);
            }
            if (prev.length >= 3) {
                return prev; // Max 3 vibes
            }
            return [...prev, vibe];
        });
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Por favor, selecione uma nota.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit({
                rating,
                content,
                vibes: selectedVibes,
                containsSpoilers,
            });
            onClose();
        } catch (err) {
            setError('Erro ao enviar review. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-200">
                    <h2 className="font-serif text-xl font-semibold text-ink">
                        Avaliar Livro
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-fade hover:text-ink transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Book Preview */}
                <div className="flex gap-4 p-5 bg-stone-50">
                    {book.cover_thumbnail && (
                        <img
                            src={book.cover_thumbnail}
                            alt={book.title}
                            className="w-16 h-24 rounded-lg object-cover shadow-sm"
                        />
                    )}
                    <div>
                        <h3 className="font-serif font-medium text-ink line-clamp-2">
                            {book.title}
                        </h3>
                        <p className="text-sm text-fade">{book.authors.join(', ')}</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-6">
                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-3">
                            Sua nota
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={32}
                                        className={
                                            star <= (hoverRating || rating)
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-stone-300'
                                        }
                                    />
                                </button>
                            ))}
                            <span className="ml-3 text-2xl font-serif font-bold text-ink">
                                {rating > 0 ? rating : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Vibes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-ink">
                                Vibes do livro
                            </label>
                            <span className="text-xs text-fade">
                                {selectedVibes.length}/3 selecionadas
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_VIBES.map((vibe) => (
                                <VibePickerOption
                                    key={vibe.id}
                                    vibe={vibe}
                                    selected={selectedVibes.some((v) => v.id === vibe.id)}
                                    onToggle={handleVibeToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">
                            Sua review (opcional)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="O que você achou do livro?"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-ink placeholder:text-fade focus:outline-none focus:border-accent resize-none"
                        />
                    </div>

                    {/* Spoiler Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={containsSpoilers}
                            onChange={(e) => setContainsSpoilers(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-accent focus:ring-accent"
                        />
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-yellow-600" />
                            <span className="text-sm text-ink">Contém spoilers</span>
                        </div>
                    </label>

                    {/* Error */}
                    {error && (
                        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-stone-200">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isSubmitting}>
                        Publicar Review
                    </Button>
                </div>
            </div>
        </div>
    );
}
