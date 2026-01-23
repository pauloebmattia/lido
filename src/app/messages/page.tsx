'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

interface Conversation {
    id: string;
    otherUser: Profile;
    lastMessage: { content: string; created_at: string } | null;
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender: Profile;
}

export default function MessagesPage() {
    const [user, setUser] = useState<Profile | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [supabase] = useState(() => createClient());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const searchParams = useSearchParams();
    const toUsername = searchParams.get('to');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(profile);

                // Load conversations
                const res = await fetch('/api/messages');
                let userConversations: Conversation[] = [];
                if (res.ok) {
                    const data = await res.json();
                    userConversations = data.conversations || [];
                    setConversations(userConversations);
                }

                // Handle "to" param (New conversation)
                if (toUsername) {
                    // Check if conversation already exists
                    const existing = userConversations.find(c => c.otherUser.username === toUsername);
                    if (existing) {
                        loadMessages(existing);
                    } else {
                        // Fetch recipient profile to create temporary conversation state
                        const { data: recipient } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('username', toUsername)
                            .single();

                        if (recipient) {
                            const newConv: Conversation = {
                                id: 'new',
                                otherUser: recipient,
                                lastMessage: null,
                                unreadCount: 0
                            };
                            setSelectedConversation(newConv);
                            setMessages([]); // Empty messages for new chat
                        }
                    }
                }
            }
            setLoading(false);
        }
        loadData();
    }, [supabase, toUsername]);

    const loadMessages = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setLoadingMessages(true);

        const res = await fetch(`/api/messages?conversation_id=${conversation.id}`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
        }
        setLoadingMessages(false);

        // Scroll to bottom
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_id: selectedConversation.otherUser.id,
                    content: newMessage,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, {
                    id: data.message.id,
                    content: newMessage,
                    created_at: new Date().toISOString(),
                    sender: user!,
                }]);
                setNewMessage('');

                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={user} />
                <div className="pt-32 flex justify-center">
                    <Loader2 className="animate-spin text-fade" size={32} />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={null} />
                <div className="pt-32 text-center max-w-md mx-auto px-4">
                    <h1 className="font-serif text-3xl font-bold text-ink mb-4">Mensagens</h1>
                    <p className="text-fade mb-6">Entre na sua conta para ver suas mensagens.</p>
                    <Link href="/login">
                        <Button size="lg" className="btn-shimmer">Entrar</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-16 h-screen flex">
                {/* Conversations List */}
                <div className={`${selectedConversation ? 'hidden md:block' : ''} w-full md:w-80 border-r border-stone-200 bg-white`}>
                    <div className="p-4 border-b border-stone-200">
                        <h1 className="font-serif text-xl font-semibold text-ink">Mensagens</h1>
                    </div>

                    {conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageSquare className="mx-auto text-fade mb-4" size={40} />
                            <p className="text-fade">Nenhuma conversa ainda.</p>
                            <p className="text-sm text-fade mt-2">Visite o perfil de alguém para iniciar uma conversa.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadMessages(conv)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-stone-50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-accent/5' : ''
                                        }`}
                                >
                                    <img
                                        src={conv.otherUser.avatar_url || '/default-avatar.png'}
                                        alt={conv.otherUser.display_name || conv.otherUser.username}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-medium text-ink truncate">
                                            {conv.otherUser.display_name || conv.otherUser.username}
                                        </p>
                                        {conv.lastMessage && (
                                            <p className="text-sm text-fade truncate">{conv.lastMessage.content}</p>
                                        )}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-stone-200 bg-white flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-fade hover:text-ink"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <Link href={`/profile/${selectedConversation.otherUser.username}`}>
                                    <img
                                        src={selectedConversation.otherUser.avatar_url || '/default-avatar.png'}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                </Link>
                                <Link href={`/profile/${selectedConversation.otherUser.username}`} className="hover:text-accent">
                                    <p className="font-medium text-ink">
                                        {selectedConversation.otherUser.display_name || selectedConversation.otherUser.username}
                                    </p>
                                </Link>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
                                {loadingMessages ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin text-fade" size={24} />
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.sender.id === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-accent text-white rounded-br-sm'
                                                        : 'bg-white text-ink rounded-bl-sm shadow-sm'
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-fade'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-stone-200 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 px-4 py-2 rounded-full border border-stone-200 focus:border-accent focus:outline-none"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sending}
                                        className="rounded-full px-4"
                                    >
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <MessageSquare className="mx-auto text-fade mb-4" size={48} />
                                <p className="text-fade text-lg">Selecione uma conversa</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
