'use client';

import { useState, useEffect } from 'react';
import { User, BookOpen, Star } from 'lucide-react';

const MOCK_ACTIVITIES = [
    { user: 'Maria S.', action: 'avaliou', book: 'Duna', detail: '5 estrelas', icon: Star },
    { user: 'João P.', action: 'começou a ler', book: 'O Hobbit', detail: '', icon: BookOpen },
    { user: 'Ana C.', action: 'terminou', book: 'Torto Arado', detail: 'em 3 dias', icon: BookOpen },
    { user: 'Lucas M.', action: 'adicionou', book: '1984', detail: 'à lista Quero Ler', icon: BookOpen },
    { user: 'Beatriz L.', action: 'avaliou', book: 'Dom Casmurro', detail: '5 estrelas', icon: Star },
];

export function SocialTicker() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Initial delay
        const initialTimeout = setTimeout(() => setIsVisible(true), 2000);

        // Cycle every 6 seconds
        const cycleInterval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
                setIsVisible(true);
            }, 500); // 500ms hide transition
        }, 6000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(cycleInterval);
        };
    }, []);

    const activity = MOCK_ACTIVITIES[currentIndex];
    const Icon = activity.icon;

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
