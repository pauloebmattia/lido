
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('Checking Storage Buckets...');

    const buckets = ['book-covers', 'book-files', 'avatars'];
    const publicity = { 'book-covers': true, 'book-files': false, 'avatars': true };

    for (const bucket of buckets) {
        const { data, error } = await supabase.storage.getBucket(bucket);

        if (error && error.message.includes('not found')) {
            console.log(`Bucket '${bucket}' not found. Creating...`);
            const { data: created, error: createError } = await supabase.storage.createBucket(bucket, {
                public: publicity[bucket as keyof typeof publicity],
                fileSizeLimit: 52428800, // 50MB
            });

            if (createError) console.error(`Error creating bucket '${bucket}':`, createError);
            else console.log(`Bucket '${bucket}' created successfully.`);
        } else if (data) {
            console.log(`Bucket '${bucket}' already exists.`);
        } else {
            console.error(`Error checking bucket '${bucket}':`, error);
        }
    }
    console.log('Storage setup check complete.');
}

setupStorage();
