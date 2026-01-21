import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch user's conversations or messages from a conversation
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (conversationId) {
        // Fetch messages from conversation
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                id,
                content,
                is_read,
                created_at,
                sender:profiles!sender_id (
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id);

        return NextResponse.json({ messages });
    }

    // Fetch all conversations
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
            id,
            last_message_at,
            participant1:profiles!participant1_id (
                id,
                username,
                display_name,
                avatar_url
            ),
            participant2:profiles!participant2_id (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread counts for each conversation
    const conversationsWithOther = await Promise.all(
        (conversations || []).map(async (conv: any) => {
            const otherUser = conv.participant1.id === user.id ? conv.participant2 : conv.participant1;

            // Get last message
            const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get unread count
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('is_read', false)
                .neq('sender_id', user.id);

            return {
                id: conv.id,
                otherUser,
                lastMessage,
                unreadCount: count || 0,
                last_message_at: conv.last_message_at,
            };
        })
    );

    return NextResponse.json({ conversations: conversationsWithOther });
}

// POST - Send a message
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipient_id, content } = body;

    if (!recipient_id || !content) {
        return NextResponse.json({ error: 'recipient_id and content are required' }, { status: 400 });
    }

    if (recipient_id === user.id) {
        return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Get or create conversation
    const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: recipient_id,
    });

    if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
            conversation_id: convId,
            sender_id: user.id,
            content,
        })
        .select()
        .single();

    if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Update conversation last_message_at
    await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);

    return NextResponse.json({ success: true, message, conversation_id: convId });
}
