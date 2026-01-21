import { NextRequest, NextResponse } from 'next/server';
import { getBookById, cleanBookData } from '@/lib/google-books';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: googleId } = await params;

        if (!googleId) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            );
        }

        const rawBook = await getBookById(googleId);

        if (!rawBook) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        const book = cleanBookData(rawBook);

        return NextResponse.json({ book });
    } catch (error) {
        console.error('Error fetching book:', error);
        return NextResponse.json(
            { error: 'Failed to fetch book details' },
            { status: 500 }
        );
    }
}
