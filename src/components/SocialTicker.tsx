'use client';

import { useState, useEffect } from 'react';
import { User, BookOpen, Star, List } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface TickerActivity {
    type: 'review' | 'list' | 'reading' | 'want_to_read';
    user: string;
    action: string;
    book: string;
    detail: string;
}

interface SocialTickerProps {
    initialActivities?: TickerActivity[];
}

export function SocialTicker({ initialActivities = [] }: SocialTickerProps) {
    const [activity, setActivity] = useState<TickerActivity | null>(initialActivities[0] || null);
    const [isVisible, setIsVisible] = useState(false);
    const supabase = createClient();

    // 1. Queue effect for Initial Activities (show one by one?? Or just show most recent?)
    // User said: "Show ONLY when they happen".
    // But initially we might want to show "recent" history?
    // "não precisa ficar mostrando as atualizações o tempo inteiro repetindo" -> Stop loop.
    // "mostre apenas no momento em que elas acontecerem mesmo" -> Realtime.
    // So: Show initial (recent) ONCE, then wait for Realtime.

    // Simplification: Show the FIRST initial activity, then listen for new ones.

    useEffect(() => {
        if (activity) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 5000); // Hide after 5s
            return () => clearTimeout(timer);
        }
    }, [activity]);

    useEffect(() => {
        // Realtime Subscription
        const channel = supabase
            .channel('public:ticker')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'reviews' },
                async (payload) => {
                    // Fetch details (need joins, so we fetch by ID)
                    const { data } = await supabase
                        .from('reviews')
                        .select('rating, book:books(title), user:profiles(username, display_name)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setActivity({
                            type: 'review',
                            user: data.user.display_name || data.user.username,
                            action: 'acabou de avaliar',
                            book: data.book.title,
                            detail: `${data.rating} estrelas`
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'book_lists' },
                async (payload) => {
                    const { data } = await supabase
                        .from('book_lists')
                        .select('title, user:profiles(username, display_name)')
                        .eq('id', payload.new.id)
                        .single();
                    if (data) {
                        setActivity({
                            type: 'list',
                            user: data.user.display_name || data.user.username,
                            action: 'criou a lista',
                            book: data.title,
                            detail: 'Confira!'
                        });
                    }
                }
            )
            // Add user_books update logic if needed (UPDATE event)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (!activity) return null;

    // Map type to icon
    let Icon = BookOpen;
    if (activity.type === 'review') Icon = Star;
    if (activity.type === 'list') Icon = List;

    return (
        <div
            className={`fixed bottom-6 left-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
        >
            <div className="bg-ink/90 backdrop-blur-md text-paper px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-stone-700/50 max-w-xs sm:max-w-md">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 animate-pulse">
                    <Icon size={14} className="text-white" />
                </div>
                <div className="text-xs sm:text-sm">
                    <span className="font-bold">{activity.user}</span>{' '}
                    <span className="text-stone-300">{activity.action}</span>{' '}
                    <span className="font-serif italic text-accent-light">{activity.book}</span>
                    {activity.detail && <span className="text-stone-400"> • {activity.detail}</span>}
                </div>
            </div>
        </div>
    );
}
