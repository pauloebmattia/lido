
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'tester@lido.com';
    const password = 'password123';

    console.log(`Creating/Checking user ${email}...`);

    // 1. Try to sign in to check existence (not perfect but okay for script)
    // Or just create and catch error
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Tester Admin' }
    });

    let userId = data.user?.id;

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('User already exists. Fetching ID...');
            // Need to fetch user ID by email via admin list (or just updating by email if possible? No, need ID for profiles)
            // Listing users is expensive but fine for one
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users.users.find(u => u.email === email);
            if (existing) userId = existing.id;
        } else {
            console.error('Error creating user:', error);
            return;
        }
    }

    if (!userId) {
        console.error('Could not determine User ID');
        return;
    }

    console.log(`User ID: ${userId}`);

    // Start with a clean slate for profile? No, just update level
    // Wait a sec for profile trigger if created
    if (!error) await new Promise(r => setTimeout(r, 2000));

    // Promote
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ level: 10, xp_points: 10000 })
        .eq('id', userId);

    if (updateError) {
        console.error('Error promoting:', updateError);
    } else {
        console.log('User promoted to Admin. Credentials: tester@lido.com / password123');
    }
}

main();
