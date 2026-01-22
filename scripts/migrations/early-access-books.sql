-- Early Access Books Table (Indie Books)
-- This table tracks books uploaded by independent authors

CREATE TABLE IF NOT EXISTS early_access_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'epub')),
    file_size_bytes BIGINT,
    xp_bonus INTEGER DEFAULT 50,
    is_approved BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_access_author ON early_access_books(author_id);
CREATE INDEX IF NOT EXISTS idx_early_access_approved ON early_access_books(is_approved);

-- Enable RLS
ALTER TABLE early_access_books ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view approved books
CREATE POLICY "Approved early access books are viewable" ON early_access_books
    FOR SELECT USING (is_approved = true);

-- Authors can view their own books (even if not approved)
CREATE POLICY "Authors can view their own books" ON early_access_books
    FOR SELECT USING (auth.uid() = author_id);

-- Authors can insert their own books
CREATE POLICY "Authors can insert their books" ON early_access_books
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Authors can update their own books
CREATE POLICY "Authors can update their books" ON early_access_books
    FOR UPDATE USING (auth.uid() = author_id);

-- Note: DELETE policy not added - books should be managed by admins
