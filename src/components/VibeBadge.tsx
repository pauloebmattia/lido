'use client';

import type { Vibe } from '@/lib/supabase/types';

interface VibeBadgeProps {
    vibe: Vibe;
    size?: 'xs' | 'sm' | 'md';
    showEmoji?: boolean;
}

const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
};

/**
 * VibeBadge - Pílula colorida para Vibe Tags
 */
export function VibeBadge({ vibe, size = 'sm', showEmoji = true }: VibeBadgeProps) {
    return (
        <span className={`vibe-tag ${vibe.color} ${sizeClasses[size]}`}>
            {showEmoji && <span>{vibe.emoji}</span>}
            <span>{vibe.name}</span>
        </span>
    );
}

/**
 * Vibes pré-definidas para uso local quando não há conexão com DB
 */
export const DEFAULT_VIBES: Vibe[] = [
    { id: 1, name: 'Tensão', slug: 'tensao', emoji: '🔥', color: 'vibe-tensao', description: 'Livros que te deixam na ponta da cadeira', created_at: '' },
    { id: 2, name: 'Choro', slug: 'choro', emoji: '😢', color: 'vibe-choro', description: 'Prepare os lenços', created_at: '' },
    { id: 3, name: 'Leve', slug: 'leve', emoji: '🌸', color: 'vibe-leve', description: 'Leitura confortável e agradável', created_at: '' },
    { id: 4, name: 'Plot Twist', slug: 'plottwist', emoji: '🎭', color: 'vibe-plottwist', description: 'Reviravoltas de cair o queixo', created_at: '' },
    { id: 5, name: 'Sombrio', slug: 'sombrio', emoji: '🌑', color: 'vibe-sombrio', description: 'Atmosfera dark e intensa', created_at: '' },
    { id: 6, name: 'Inspirador', slug: 'inspirador', emoji: '✨', color: 'vibe-inspirador', description: 'Te motiva a ser melhor', created_at: '' },
];

/**
 * VibePickerOption - Item clicável para seleção de vibes
 */
interface VibePickerOptionProps {
    vibe: Vibe;
    selected: boolean;
    onToggle: (vibe: Vibe) => void;
}

export function VibePickerOption({ vibe, selected, onToggle }: VibePickerOptionProps) {
    return (
        <button
            type="button"
            onClick={() => onToggle(vibe)}
            className={`
        vibe-tag ${vibe.color} ${sizeClasses.md}
        transition-all duration-200
        ${selected
                    ? 'ring-2 ring-offset-2 ring-ink scale-105'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }
      `}
            aria-pressed={selected}
        >
            <span>{vibe.emoji}</span>
            <span>{vibe.name}</span>
        </button>
    );
}
