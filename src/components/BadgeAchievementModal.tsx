'use client';

import { useEffect, useState } from 'react';
import { X, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    xp_reward: number;
}

interface BadgeAchievementModalProps {
    badge: Badge | null;
    onClose: () => void;
}

export function BadgeAchievementModal({ badge, onClose }: BadgeAchievementModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (badge) {
            // Trigger entrance animation
            setTimeout(() => setIsVisible(true), 50);
        } else {
            setIsVisible(false);
        }
    }, [badge]);

    if (!badge) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-gradient-to-br from-yellow-50 via-white to-amber-50 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-yellow-200 transform transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
                >
                    <X size={20} />
                </button>

                {/* Confetti effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <Sparkles className="absolute top-4 left-8 text-yellow-400 animate-pulse" size={16} />
                    <Sparkles className="absolute top-12 right-12 text-amber-400 animate-pulse delay-100" size={12} />
                    <Sparkles className="absolute bottom-16 left-12 text-yellow-500 animate-pulse delay-200" size={14} />
                    <Sparkles className="absolute bottom-8 right-8 text-amber-300 animate-pulse delay-300" size={10} />
                </div>

                {/* Content */}
                <div className="text-center relative z-10">
                    <p className="text-amber-600 font-medium text-sm uppercase tracking-wider mb-4">
                        🎉 Nova Conquista!
                    </p>

                    {/* Badge Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 animate-bounce">
                        <Award className="text-white" size={48} />
                    </div>

                    {/* Badge Name */}
                    <h2 className="font-serif text-2xl font-bold text-ink mb-2">
                        {badge.name}
                    </h2>

                    {/* Description */}
                    <p className="text-fade text-sm mb-6">
                        {badge.description}
                    </p>

                    {/* XP Reward */}
                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Sparkles size={16} />
                        +{badge.xp_reward} XP
                    </div>

                    {/* Close Button */}
                    <div>
                        <Button onClick={onClose} className="w-full">
                            Continuar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
