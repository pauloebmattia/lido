-- Trigger to award badges when a book is marked as read

CREATE OR REPLACE FUNCTION check_book_completion_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_books_read INTEGER;
    v_is_indie BOOLEAN;
    v_badge_id UUID;
BEGIN
    -- Only run if status changed to 'read'
    IF NEW.status = 'read' AND (OLD.status IS DISTINCT FROM 'read') THEN
        
        -- 1. Badge: Primeiros Passos (1 book read)
        SELECT count(*) INTO v_books_read FROM user_books WHERE user_id = NEW.user_id AND status = 'read';
        
        IF v_books_read >= 1 THEN
            SELECT id INTO v_badge_id FROM badges WHERE name = 'Primeiros Passos';
            IF v_badge_id IS NOT NULL THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, v_badge_id) ON CONFLICT DO NOTHING;
            END IF;
        END IF;

        IF v_books_read >= 10 THEN
            SELECT id INTO v_badge_id FROM badges WHERE name = 'Maratona Literária';
            IF v_badge_id IS NOT NULL THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, v_badge_id) ON CONFLICT DO NOTHING;
            END IF;
        END IF;

        -- 2. Badge: Apoiador Indie (If book is indie)
        -- Check if book is in early_access_books
        SELECT EXISTS (
            SELECT 1 FROM early_access_books WHERE book_id = NEW.book_id
        ) INTO v_is_indie;

        IF v_is_indie THEN
            SELECT id INTO v_badge_id FROM badges WHERE name = 'Apoiador Indie';
            IF v_badge_id IS NOT NULL THEN
                INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, v_badge_id) ON CONFLICT DO NOTHING;
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_book_completion ON user_books;
CREATE TRIGGER on_book_completion
    AFTER INSERT OR UPDATE ON user_books
    FOR EACH ROW
    EXECUTE FUNCTION check_book_completion_badges();
