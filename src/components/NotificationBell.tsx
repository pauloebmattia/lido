'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Info } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationType } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=10');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Optional: Set up real-time subscription here
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    // Refresh on new notification
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: id }),
            });

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all_read: true }),
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'like_review': return <Heart size={16} className="text-red-500 fill-current" />;
            case 'comment_review': return <MessageSquare size={16} className="text-blue-500 fill-current" />;
            case 'new_follower': return <UserPlus size={16} className="text-green-500 fill-current" />;
            default: return <Info size={16} className="text-stone-500" />;
        }
    };

    const getMessage = (notification: Notification) => {
        const actorName = notification.actor?.username || 'Alguém';

        // Check for message in data first
        if (notification.data?.message) return notification.data.message;

        switch (notification.type) {
            case 'like_review': return <span><strong>{actorName}</strong> curtiu sua review.</span>;
            case 'comment_review': return <span><strong>{actorName}</strong> comentou na sua review.</span>;
            case 'new_follower': return <span><strong>{actorName}</strong> começou a te seguir.</span>;
            case 'system_alert': return <span>Alerta do sistema</span>;
            default: return <span>Nova notificação</span>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ink animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-paper rounded-xl shadow-xl border border-stone-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <h3 className="font-semibold text-sm text-ink">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-accent hover:underline font-medium"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-fade text-sm">Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-fade text-sm flex flex-col items-center gap-2">
                                <Bell size={24} className="opacity-20" />
                                <p>Nenhuma notificação ainda</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-stone-50 transition-colors ${!notification.read ? 'bg-accent/5' : ''}`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm text-ink leading-snug">
                                                    {notification.data.link ? (
                                                        <Link href={notification.data.link} className="hover:underline decoration-stone-300 underline-offset-2">
                                                            {getMessage(notification)}
                                                        </Link>
                                                    ) : (
                                                        getMessage(notification)
                                                    )}
                                                </p>
                                                <p className="text-xs text-fade">
                                                    {formatRelativeTime(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="flex-shrink-0 mt-1.5">
                                                    <div className="w-2 h-2 bg-accent rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
