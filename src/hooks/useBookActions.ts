'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Book } from '@/lib/supabase/types';
import type { CleanBookData } from '@/lib/google-books';

export type ReadingStatus = 'want-to-read' | 'reading' | 'read' | 'dnf';

interface UseBookActionsOptions {
    userId?: string;
}

export function useBookActions({ userId }: UseBookActionsOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    /**
     * Add a book from Google Books to our database
     */
    const addBookToDatabase = useCallback(async (bookData: CleanBookData): Promise<Book | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if book already exists by ISBN or Google Books ID
            let existingBook = null;

            if (bookData.isbn) {
                const { data } = await supabase
                    .from('books')
                    .select('*')
                    .eq('isbn', bookData.isbn)
                    .maybeSingle();
                existingBook = data;
            }

            if (!existingBook && bookData.google_books_id) {
                const { data } = await supabase
                    .from('books')
                    .select('*')
                    .eq('google_books_id', bookData.google_books_id)
                    .maybeSingle();
                existingBook = data;
            }

            if (existingBook) {
                return existingBook as Book;
            }

            // Insert new book
            const { data: newBook, error: insertError } = await supabase
                .from('books')
                .insert({
                    title: bookData.title,
                    subtitle: null,
                    authors: bookData.authors,
                    isbn: bookData.isbn,
                    google_books_id: bookData.google_books_id,
                    publisher: bookData.publisher,
                    published_date: bookData.published_date,
                    description: bookData.description,
                    page_count: bookData.page_count,
                    language: bookData.language,
                    cover_url: bookData.cover_url,
                    cover_thumbnail: bookData.cover_thumbnail,
                    categories: bookData.categories,
                    added_by: userId || null,
                    is_verified: false,
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            return newBook as Book;
        } catch (err) {
            console.error('addBookToDatabase error:', err);
            const message = err instanceof Error ? err.message : 'Failed to add book';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Add/update book in user's reading list
     */
    const updateReadingStatus = useCallback(async (
        bookId: string,
        status: ReadingStatus
    ): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in to update reading status');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('user_books')
                .upsert({
                    user_id: userId,
                    book_id: bookId,
                    status,
                    started_at: status === 'reading' ? new Date().toISOString() : null,
                    finished_at: status === 'read' ? new Date().toISOString() : null,
                }, {
                    onConflict: 'user_id,book_id',
                });

            if (upsertError) {
                throw upsertError;
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Submit a review for a book
     */
    const submitReview = useCallback(async (
        bookId: string,
        review: {
            rating: number;
            content: string;
            vibeIds: number[];
            containsSpoilers: boolean;
        }
    ): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in to submit a review');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Insert review
            const { data: newReview, error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    user_id: userId,
                    book_id: bookId,
                    rating: review.rating,
                    content: review.content || null,
                    contains_spoilers: review.containsSpoilers,
                })
                .select()
                .single();

            if (reviewError) {
                throw reviewError;
            }

            // Insert review vibes
            if (review.vibeIds.length > 0) {
                const vibeInserts = review.vibeIds.map((vibeId) => ({
                    review_id: newReview.id,
                    vibe_id: vibeId,
                }));

                const { error: vibesError } = await supabase
                    .from('review_vibes')
                    .insert(vibeInserts);

                if (vibesError) {
                    console.error('Error inserting vibes:', vibesError);
                }
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to submit review';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    /**
     * Toggle bookmark for a book
     */
    const toggleBookmark = useCallback(async (bookId: string): Promise<boolean> => {
        if (!userId) {
            setError('You must be logged in to bookmark');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if already bookmarked
            const { data: existing } = await supabase
                .from('user_books')
                .select('id, status')
                .eq('user_id', userId)
                .eq('book_id', bookId)
                .single();

            if (existing) {
                // Remove from list
                await supabase
                    .from('user_books')
                    .delete()
                    .eq('id', existing.id);
            } else {
                // Add to want-to-read
                await supabase
                    .from('user_books')
                    .insert({
                        user_id: userId,
                        book_id: bookId,
                        status: 'want-to-read',
                    });
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to toggle bookmark';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    return {
        isLoading,
        error,
        addBookToDatabase,
        updateReadingStatus,
        submitReview,
        toggleBookmark,
    };
}
