-- List Followers System
-- Allows users to follow/save lists from other users

CREATE TABLE IF NOT EXISTS list_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES book_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_list_followers_list ON list_followers(list_id);
CREATE INDEX IF NOT EXISTS idx_list_followers_user ON list_followers(user_id);

-- Enable RLS
ALTER TABLE list_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view list followers" ON list_followers
    FOR SELECT USING (true);

CREATE POLICY "Users can follow lists" ON list_followers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow lists" ON list_followers
    FOR DELETE USING (auth.uid() = user_id);
