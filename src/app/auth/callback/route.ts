import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const origin = getURL(); // Force usage of canonical URL

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Remove trailing slash from origin if present to avoid double slashes
            const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
            // Ensure next starts with /
            const path = next.startsWith('/') ? next : `/${next}`;
            return NextResponse.redirect(`${baseUrl}${path}`);
        }
    }

    // Redirect to login with error
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
