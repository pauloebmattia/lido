'use client';

import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Star, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

interface FriendsActivityProps {
    bookId: string;
}

// Helper to format names: "Fulano", "Fulano e Cicrano", "Fulano, Cicrano e Beltrano", "X amigos"
function formatNames(users: Profile[], actionVerb: string): string {
    if (users.length === 0) return '';

    const names = users.map(u => u.display_name || u.username);

    if (names.length === 1) {
        return `${names[0]} ${actionVerb}`;
    } else if (names.length === 2) {
        return `${names[0]} e ${names[1]} ${actionVerb}`;
    } else if (names.length === 3) {
        return `${names[0]}, ${names[1]} e ${names[2]} ${actionVerb}`;
    } else {
        return `${names.length} amigos ${actionVerb}`;
    }
}

interface ActivityGroup {
    icon: React.ReactNode;
    text: string;
}

export function FriendsActivity({ bookId }: FriendsActivityProps) {
    const [activities, setActivities] = useState<ActivityGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFriendsActivity() {
            try {
                const res = await fetch(`/api/books/${bookId}/friends`);
                if (!res.ok) {
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                const friends = data.friends || [];
                const reviews = data.reviews || [];

                // Group users by status
                const readUsers: Profile[] = [];
                const readingUsers: Profile[] = [];
                const dnfUsers: Profile[] = [];
                const reviewedUsers: Profile[] = [];
                const ratedUsers: Profile[] = [];

                // Process reading status
                friends.forEach((f: { status: string; user: Profile }) => {
                    if (f.status === 'read') {
                        readUsers.push(f.user);
                    } else if (f.status === 'reading') {
                        readingUsers.push(f.user);
                    } else if (f.status === 'dnf') {
                        dnfUsers.push(f.user);
                    }
                });

                // Process reviews
                reviews.forEach((r: { rating: number; content: string | null; user: Profile }) => {
                    // Has content = reviewed
                    if (r.content && r.content.trim().length > 0) {
                        reviewedUsers.push(r.user);
                    }
                    // Has rating = rated
                    if (r.rating > 0) {
                        ratedUsers.push(r.user);
                    }
                });

                // Build activity groups
                const groups: ActivityGroup[] = [];

                if (readUsers.length > 0) {
                    groups.push({
                        icon: <CheckCircle size={14} className="text-green-600" />,
                        text: formatNames(readUsers, readUsers.length === 1 ? 'leu' : 'leram')
                    });
                }

                if (readingUsers.length > 0) {
                    groups.push({
                        icon: <BookOpen size={14} className="text-amber-600" />,
                        text: formatNames(readingUsers, readingUsers.length === 1 ? 'está lendo' : 'estão lendo')
                    });
                }

                if (reviewedUsers.length > 0) {
                    groups.push({
                        icon: <span className="text-sm">✍️</span>,
                        text: formatNames(reviewedUsers, reviewedUsers.length === 1 ? 'resenhou' : 'resenharam')
                    });
                }

                if (ratedUsers.length > 0) {
                    groups.push({
                        icon: <Star size={14} className="text-amber-500 fill-amber-500" />,
                        text: formatNames(ratedUsers, ratedUsers.length === 1 ? 'avaliou' : 'avaliaram')
                    });
                }

                if (dnfUsers.length > 0) {
                    groups.push({
                        icon: <XCircle size={14} className="text-red-500" />,
                        text: formatNames(dnfUsers, dnfUsers.length === 1 ? 'abandonou' : 'abandonaram')
                    });
                }

                setActivities(groups);
            } catch (error) {
                console.error('Failed to load friends activity:', error);
            } finally {
                setLoading(false);
            }
        }
        loadFriendsActivity();
    }, [bookId]);

    if (loading || activities.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fade py-3 border-t border-stone-200 mt-4">
            {activities.map((activity, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                    {activity.icon}
                    <span>{activity.text}</span>
                </span>
            ))}
        </div>
    );
}
