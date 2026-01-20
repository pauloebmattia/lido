import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Skip if Supabase is not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Supabase not configured, skip session update
        return supabaseResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if needed
    const { data: { user } } = await supabase.auth.getUser();

    // PROTECTED ROUTES
    const protectedPaths = ['/publish', '/settings', '/admin', '/read'];
    const authPaths = ['/login', '/register'];
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    const isAuthPage = authPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return supabaseResponse;
}
