-- Remove indie status from all books authored by the current user
-- Use this if you accidentally seeded "Indie" books or want to reset your author profile
-- This does NOT delete the books from the catalog, only removes the "Indie" marking.

DELETE FROM early_access_books 
WHERE author_id = auth.uid();
