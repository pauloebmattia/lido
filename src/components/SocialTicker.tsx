'use client';

import { useState, useEffect } from 'react';
import { User, BookOpen, Star, List } from 'lucide-react';

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
    // If no real activities, fallback to mock (or empty if preferred, user said "substituir por notificações reais")
    // User wants "activities and interactions of the user themselves" so even if few, use them.
    // If empty, we might want to hide it or show a default "Welcome".

    // Fallback Mock (only if initial is empty?) 
    // User said "substituir... por notificações reais". So let's prioritize real.
    // But if database is empty, it might look broken.
    // I'll keep a few mocks only if real is empty, or just use real if length > 0.

    const [activities, setActivities] = useState<TickerActivity[]>(initialActivities);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (activities.length === 0) return;

        // Initial delay
        const initialTimeout = setTimeout(() => setIsVisible(true), 2000);

        // Cycle every 6 seconds
        const cycleInterval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % activities.length);
                setIsVisible(true);
            }, 500); // 500ms hide transition
        }, 6000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(cycleInterval);
        };
    }, [activities.length]);

    if (activities.length === 0) return null;

    const activity = activities[currentIndex];

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
