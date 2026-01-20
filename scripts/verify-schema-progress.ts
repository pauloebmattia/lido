import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
    console.log('Verifying user_books schema...');

    // Try to insert (and immediately delete/rollback or just check)
    // Actually, easiest way to check column existence without permissions to information_schema (which client might not have)
    // is to try a select with that column.

    const { data, error } = await supabase
        .from('user_books')
        .select('last_location')
        .limit(1);

    if (error) {
        console.error('Error selecting last_location:', error.message);
        if (error.message.includes('does not exist')) {
            console.error('❌ Column last_location does NOT exist. Please run the SQL migration.');
        } else {
            console.error('❌ Unexpected error.');
        }
    } else {
        console.log('✅ Column last_location exists!');
    }
}

verifySchema();
