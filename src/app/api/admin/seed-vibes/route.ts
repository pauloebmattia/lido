import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
    const supabase = createClient();

    // New vibes to add
    const newVibes = [
        { id: 7, name: 'Divertido', slug: 'divertido', emoji: '😂', color: 'vibe-divertido', description: 'Te faz rir alto' },
        { id: 8, name: 'Reflexivo', slug: 'reflexivo', emoji: '🤔', color: 'vibe-reflexivo', description: 'Te faz pensar muito' },
        { id: 9, name: 'Apaixonante', slug: 'apaixonante', emoji: '😍', color: 'vibe-apaixonante', description: 'Romance de suspirar' },
        { id: 10, name: 'Chocante', slug: 'chocante', emoji: '😱', color: 'vibe-chocante', description: 'Não acredito que isso aconteceu' },
        { id: 11, name: 'Assustador', slug: 'assustador', emoji: '👻', color: 'vibe-assustador', description: 'De dar medo de verdade' }
    ];

    try {
        const { error } = await supabase
            .from('vibes')
            .upsert(newVibes, { onConflict: 'slug' });

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Vibes seeded successfully' });
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
