-- Fix permissions for authors to manage their own books
-- This allows authors to Delete and Update books they added

-- 1. Policies for 'books' table
-- Allow authors to view their own books (even if is_verified is false)
DROP POLICY IF EXISTS "Authors can view their own unverified books" ON books;
CREATE POLICY "Authors can view their own unverified books" ON books
    FOR SELECT USING (auth.uid() = added_by);

-- Allow authors to update their own books
DROP POLICY IF EXISTS "Authors can update their own books" ON books;
CREATE POLICY "Authors can update their own books" ON books
    FOR UPDATE USING (auth.uid() = added_by);

-- Allow authors to delete their own books
DROP POLICY IF EXISTS "Authors can delete their own books" ON books;
CREATE POLICY "Authors can delete their own books" ON books
    FOR DELETE USING (auth.uid() = added_by);

-- 2. Policies for 'early_access_books' table (Indie)
-- Allow authors to delete their own indie book entry
DROP POLICY IF EXISTS "Authors can delete their own early access books" ON early_access_books;
CREATE POLICY "Authors can delete their own early access books" ON early_access_books
    FOR DELETE USING (auth.uid() = author_id);
