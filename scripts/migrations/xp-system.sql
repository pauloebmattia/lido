-- XP System Tables Migration
-- Run this SQL in Supabase SQL Editor

-- Table for tracking user total XP and level
CREATE TABLE IF NOT EXISTS user_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table for tracking individual XP events
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'review', 'indie_review', 'first_book', etc.
    xp_earned INTEGER NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_user ON user_xp(user_id);

-- Enable RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_xp
CREATE POLICY "Users can view their own XP" ON user_xp
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view any XP (public leaderboard)" ON user_xp
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage XP" ON user_xp
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for xp_events
CREATE POLICY "Users can view their own XP events" ON xp_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage XP events" ON xp_events
    FOR ALL USING (true) WITH CHECK (true);

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_event_type TEXT, p_xp INTEGER, p_book_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
    new_level INTEGER;
BEGIN
    -- Insert XP event
    INSERT INTO xp_events (user_id, event_type, xp_earned, book_id)
    VALUES (p_user_id, p_event_type, p_xp, p_book_id);
    
    -- Upsert user_xp
    INSERT INTO user_xp (user_id, total_xp, level, updated_at)
    VALUES (p_user_id, p_xp, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_xp.total_xp + p_xp,
        updated_at = NOW();
    
    -- Get new total
    SELECT total_xp INTO new_total FROM user_xp WHERE user_id = p_user_id;
    
    -- Calculate level (100 XP per level)
    new_level := GREATEST(1, FLOOR(new_total / 100) + 1);
    
    -- Update level
    UPDATE user_xp SET level = new_level WHERE user_id = p_user_id;
    
    RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
