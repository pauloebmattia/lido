'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import type { Vibe } from '@/lib/supabase/types';
import { VibePickerOption, DEFAULT_VIBES } from './VibeBadge';

interface ReviewFormProps {
    bookId: string;
    bookTitle: string;
    onSubmit: (review: {
        rating: number;
        content: string;
        vibes: number[];
        containsSpoilers: boolean;
    }) => Promise<void>;
    initialRating?: number;
    initialContent?: string;
    initialVibes?: number[];
    availableVibes?: Vibe[];
    isLoading?: boolean;
    isEditing?: boolean;
}

export function ReviewForm({
    bookId,
    bookTitle,
    onSubmit,
    initialRating = 0,
    initialContent = '',
    initialVibes = [],
    availableVibes = DEFAULT_VIBES,
    isLoading = false,
    isEditing = false,
}: ReviewFormProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState(initialContent);
    const [selectedVibes, setSelectedVibes] = useState<number[]>(initialVibes);
    const [containsSpoilers, setContainsSpoilers] = useState(false);
    const [error, setError] = useState('');

    const handleVibeToggle = (vibe: Vibe) => {
        setSelectedVibes((prev) =>
            prev.includes(vibe.id)
                ? prev.filter((id) => id !== vibe.id)
                : prev.length < 3
                    ? [...prev, vibe.id]
                    : prev
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Por favor, selecione uma nota de 1 a 5.');
            return;
        }

        try {
            await onSubmit({
                rating,
                content,
                vibes: selectedVibes,
                containsSpoilers,
            });
        } catch (err) {
            setError('Erro ao salvar review. Tente novamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
                <label className="block font-medium text-ink mb-3">
                    Como você avalia "{bookTitle}"?
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
                            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                        >
                            <Star
                                size={32}
                                className={`transition-colors ${star <= (hoverRating || rating)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-stone-300'
                                    }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-3 text-2xl font-serif font-semibold text-ink">
                            {rating}.0
                        </span>
                    )}
                </div>
            </div>

            {/* Vibe Tags Picker */}
            <div>
                <label className="block font-medium text-ink mb-2">
                    Que vibes esse livro passa? <span className="text-fade font-normal">(até 3)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                    {availableVibes.map((vibe) => (
                        <VibePickerOption
                            key={vibe.id}
                            vibe={vibe}
                            selected={selectedVibes.includes(vibe.id)}
                            onToggle={handleVibeToggle}
                        />
                    ))}
                </div>
            </div>

            {/* Review Text */}
            <div>
                <label htmlFor="review-content" className="block font-medium text-ink mb-2">
                    Sua resenha <span className="text-fade font-normal">(opcional)</span>
                </label>
                <textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="O que você achou do livro? Compartilhe seus pensamentos..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
            </div>

            {/* Spoilers Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(e) => setContainsSpoilers(e.target.checked)}
                    className="w-5 h-5 rounded border-stone-300 text-accent focus:ring-accent"
                />
                <span className="text-fade">
                    Esta resenha contém spoilers
                </span>
            </label>

            {/* Error Message */}
            {error && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                </p>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || rating === 0}
                className="w-full btn-ink py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Review' : 'Publicar Review'}
            </button>
        </form>
    );
}
