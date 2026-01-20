import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verify Authentication (Standard Client)
        // We can't trust the client to just send an ID. We need to verify the session.
        // However, in an API route, we can use the headers to get the user from supabase auth.
        // Or simpler: The client sends their session token (access_token) in Authorization header.

        // Let's rely on standard Supabase pattern: 
        // We need to create a client with the user's token to verify identity.
        // But headers() from next/headers is for server components.
        // In route handlers:

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the token by calling getUser (using the provided token is tricky with service client).
        // A better way: usage of `createServerClient` from `@supabase/ssr` (if installed) or manual verification.
        // BUT, since we have the service key, we can use `auth.admin.deleteUser`.
        // We just need to be 100% sure the request comes from the user claiming to be that user.

        // Simpler flow:
        // 1. Client creates a 'normal' supabase client, checks auth.getUser().
        // 2. Client calls this API.
        // 3. API needs to verify.

        // Let's use `supabase-js` to verify the JWT.
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 2. Delete User (Admin Privileges)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Delete user error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
