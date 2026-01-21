-- COMPLETE FIX for Books Table RLS
-- Run this ENTIRE script in Supabase SQL Editor

-- First, check if RLS is enabled (it should be, but let's make sure)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on books table to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'books'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON books', pol.policyname);
    END LOOP;
END $$;

-- Now create the correct policies

-- 1. Everyone can READ books (SELECT)
CREATE POLICY "public_read_books" ON books
    FOR SELECT
    USING (true);

-- 2. Authenticated users can INSERT books
CREATE POLICY "authenticated_insert_books" ON books
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Authenticated users can UPDATE books
CREATE POLICY "authenticated_update_books" ON books
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'books';
