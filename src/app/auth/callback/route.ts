import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';
    const origin = requestUrl.origin; // Use the actual request origin

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Force revalidation of the home page (and layout) so properly logged in state renders
            revalidatePath('/', 'layout');

            // Redirect to the correct origin and path
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
