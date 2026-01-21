-- Seed Data for Verifying Features

-- 1. Insert a dummy Indie Book (Early Access)
-- First, find a book to link to (or insert one if needed). We'll link to the most recent book.
WITH recent_book AS (
    SELECT id, added_by FROM books ORDER BY created_at DESC LIMIT 1
)
INSERT INTO early_access_books (book_id, author_id, file_path, file_type, xp_bonus, is_approved)
SELECT 
    id, 
    COALESCE(added_by, (SELECT id FROM profiles LIMIT 1)), -- Fallback to any user if added_by is null
    'https://example.com/dummy.pdf', 
    'pdf', 
    100, 
    true
FROM recent_book
WHERE NOT EXISTS (SELECT 1 FROM early_access_books WHERE book_id = recent_book.id);

-- 2. Award Badges to the first user (likely the one testing)
WITH target_user AS (
    SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
),
target_badges AS (
    SELECT id FROM badges WHERE name IN ('Primeiros Passos', 'Devorador de Páginas')
)
INSERT INTO user_badges (user_id, badge_id)
SELECT 
    target_user.id,
    target_badges.id
FROM target_user, target_badges
ON CONFLICT DO NOTHING;
