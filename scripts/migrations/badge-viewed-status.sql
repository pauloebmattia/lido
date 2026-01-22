-- Add viewed status to user_badges to track new achievements
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT false;

-- Create API to mark badges as viewed
-- (This logic will be handled via direct Supabase client in the frontend or a specific RPC if needed, 
-- but usually simple update is fine if RLS allows it).

-- Update RLS to allow users to update their own badge status
CREATE POLICY "Users can update their own badge view status" ON user_badges
    FOR UPDATE USING (auth.uid() = user_id);
