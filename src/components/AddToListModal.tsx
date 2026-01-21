'use client';

import { useState } from 'react';
import { X, BookOpen, Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Book } from '@/lib/supabase/types';

export type ReadingStatus = 'want-to-read' | 'reading' | 'read' | 'dnf';

interface AddToListModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book;
    currentStatus?: ReadingStatus | null;
    onSave: (status: ReadingStatus | null) => Promise<void>;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'want-to-read', label: 'Quero Ler', icon: Bookmark, color: 'text-blue-600 bg-blue-50' },
    { value: 'reading', label: 'Lendo', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { value: 'read', label: 'Lido', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { value: 'dnf', label: 'Abandonei', icon: XCircle, color: 'text-red-600 bg-red-50' },
];

export function AddToListModal({ isOpen, onClose, book, currentStatus, onSave }: AddToListModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | null>(currentStatus || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await onSave(selectedStatus);
            onClose();
        } catch (error) {
            console.error('Error saving status:', error);
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
            <div className="relative w-full max-w-sm bg-paper rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-200">
                    <h2 className="font-serif text-xl font-semibold text-ink">
                        Adicionar à Lista
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
                            className="w-12 h-18 rounded-lg object-cover shadow-sm"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-medium text-ink line-clamp-2">
                            {book.title}
                        </h3>
                        <p className="text-sm text-fade line-clamp-1">
                            {book.authors.join(', ')}
                        </p>
                    </div>
                </div>

                {/* Status Options */}
                <div className="p-5 space-y-3">
                    {STATUS_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedStatus === option.value;

                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    // Toggle: if already selected, deselect (remove)
                                    if (selectedStatus === option.value) {
                                        setSelectedStatus(null);
                                    } else {
                                        setSelectedStatus(option.value);
                                    }
                                }}
                                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                  ${isSelected
                                        ? 'border-accent bg-accent/5'
                                        : 'border-stone-200 hover:border-stone-300'
                                    }
                `}
                            >
                                <div className={`p-2 rounded-full ${option.color}`}>
                                    <Icon size={20} />
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-accent' : 'text-ink'}`}>
                                    {option.label}
                                </span>
                                {isSelected && (
                                    <CheckCircle size={20} className="ml-auto text-accent" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-stone-200">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isSubmitting}
                        disabled={!selectedStatus}
                    >
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}
