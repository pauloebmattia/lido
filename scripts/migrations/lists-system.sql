-- Lists System Tables Migration
-- Run this SQL in Supabase SQL Editor

-- Table for book lists
CREATE TABLE IF NOT EXISTS book_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for list items (books in a list)
CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES book_lists(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    note TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, book_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_book_lists_user ON book_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_book ON list_items(book_id);

-- Enable RLS
ALTER TABLE book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_lists
CREATE POLICY "Public lists are viewable by all" ON book_lists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own lists" ON book_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create lists" ON book_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON book_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON book_lists
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for list_items
CREATE POLICY "List items viewable if list is public" ON list_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM book_lists WHERE id = list_id AND is_public = true)
    );

CREATE POLICY "Users can view their own list items" ON list_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM book_lists WHERE id = list_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage their list items" ON list_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM book_lists WHERE id = list_id AND user_id = auth.uid())
    );
