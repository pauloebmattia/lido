
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Fetching profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, level, xp_points'); // Removed email as it's not in profiles

    // Profiles table has: id, username, display_name, avatar_url, bio, favorite_genre, xp_points, level...
    // It does NOT have email usually, email is in auth.users. But we can identify by username.

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('Current Users:');

    if (!profiles || profiles.length === 0) {
        console.log('No users found. Creating admin user (admin@lido.com)...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'admin@lido.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: 'Admin User' }
        });

        if (createError) {
            console.error('Error creating admin user:', createError);
            return;
        }

        console.log('Admin user created with ID:', newUser.user.id);

        // Wait a bit for trigger
        await new Promise(r => setTimeout(r, 2000));

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ level: 10, xp_points: 10000 })
            .eq('id', newUser.user.id);

        if (updateError) {
            console.error('Error promoting new user:', updateError);
        } else {
            console.log('New user promoted to Admin!');
        }
        return;
    }

    console.log('--- USERS ---');
    profiles.forEach(p => console.log(`Username: ${p.username}`));
    console.log('-------------');

    const targetUsername = process.argv[2];
    if (targetUsername) {
        console.log(`Promoting '${targetUsername}'...`);
        const user = profiles.find(p => p.username === targetUsername);

        if (!user) {
            console.log(`User '${targetUsername}' NOT FOUND in list above.`);
            return;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ level: 10, xp_points: 10000 })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error:', updateError);
        } else {
            console.log('Success! User is now Admin.');
        }
    }
}

main();
