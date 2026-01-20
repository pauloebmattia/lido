
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal valid PDF (1 page, empty)
const minimalPdf = Buffer.from(
    'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgdGhlIFBhZ2VzCiA8PAogICAvVHlwZSAvUGFnZXwKICAgL0NvdW50IDEKICAgL0tpZHMgWyAzIDAgUiBdCiA+PgplbmRvYmoKCjMgMCBvYmogICUgcGFnZSAxCiA8PAogICAvVHlwZSAvUGFnZQogICAvUGFyZW50IDIgMCBSCiAgIC9NZWRpYUJveCBbIDAgMCA1MDAgODAwIF0KICAgL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iagoKNCAwIG9i2CAgJSBjb250ZW50Cjw8CiAgL0xlbmd0aCA0NDwKPj4Kc3RyZWFtCjAuMSAwIDAgMC4xIDAgMCBjbQovSGVsdmV0aWNlIDEwMCBUZgoxIDAgMCAxIDUwIDcwMCBUbQooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDEwIDAwMDAwIG4KMDAwMDAwMDA2MCAwMDAwMCBuCjAwMDAwMDAxMTEgMDAwMDAgbgowMDAwMDAwMjE0IDAwMDAwIG4KdHJhaWxlcgo8PAogIC9TaXplIDUKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzEzCiUlRU9GCg==',
    'base64'
);

async function main() {
    console.log('Fetching users...');
    // Get paulobraga to be the author
    const { data: users } = await supabase.from('profiles').select('id, username').eq('username', 'paulobraga').single();

    if (!users) {
        console.error('User paulobraga not found. Run admin-tools.ts first.');
        return;
    }

    const userId = users.id;
    console.log(`Author: ${users.username} (${userId})`);

    // 1. Create a Book Record (in books table first)
    console.log('Creating book record...');
    const { data: book, error: bookError } = await supabase.from('books').insert({
        title: 'Test Indie Book ' + Date.now(),
        authors: ['Paulo Braga'],
        description: 'A test book for admin approval',
        cover_thumbnail: 'https://placehold.co/400x600/png',
        added_by: userId
    }).select().single();

    if (bookError) {
        console.error('Error creating book:', bookError);
        return;
    }
    console.log(`Book created: ${book.title} (${book.id})`);

    // 2. Upload File
    console.log('Uploading PDF...');
    const filePath = `${userId}/${book.id}.pdf`;
    const { error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(filePath, minimalPdf, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Continue anyway if file exists might be fine?
    }

    // 3. Create Early Access Record
    console.log('Creating submission...');
    const { data: submission, error: subError } = await supabase.from('early_access_books').insert({
        book_id: book.id,
        author_id: userId,
        file_path: filePath,
        file_type: 'pdf',
        is_approved: false
    }).select().single();

    if (subError) {
        console.error('Error creating submission:', subError);
        return;
    }

    console.log('Submission created!');
    console.log(`ID: ${submission.id}`);
    console.log('Go to /admin to approve it.');
    console.log(`Then read at /read/${book.id}`);
}

main();
