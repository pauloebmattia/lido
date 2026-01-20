-- =============================================================================
-- LIDO - Social Reading Platform
-- Supabase Database Schema
-- =============================================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES (Extends auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  favorite_genre TEXT,
  
  -- Gamification
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Stats
  books_read INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')),
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. BOOKS (Catalog)
-- =============================================================================
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Identifiers
  isbn TEXT UNIQUE,
  google_books_id TEXT UNIQUE,
  
  -- Metadata
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT[] DEFAULT '{}',
  publisher TEXT,
  published_date DATE,
  description TEXT,
  page_count INTEGER,
  language TEXT DEFAULT 'pt',
  
  -- Images
  cover_url TEXT,
  cover_thumbnail TEXT,
  
  -- Categories
  categories TEXT[] DEFAULT '{}',
  
  -- Stats (denormalized for performance)
  avg_rating DECIMAL(2,1) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Audit
  added_by UUID REFERENCES public.profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Books are viewable by everyone" 
  ON public.books FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add books" 
  ON public.books FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update books" 
  ON public.books FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND level >= 10)
  );

-- Indexes
CREATE INDEX idx_books_title ON public.books USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_books_authors ON public.books USING gin(authors);
CREATE INDEX idx_books_isbn ON public.books(isbn);

-- =============================================================================
-- 3. VIBES (Emotional Tags Catalog)
-- =============================================================================
CREATE TABLE public.vibes (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,           -- CSS color class
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Vibes are viewable by everyone" 
  ON public.vibes FOR SELECT USING (true);

-- Insert default vibes
INSERT INTO public.vibes (name, slug, emoji, color, description) VALUES
  ('Tensão', 'tensao', '🔥', 'vibe-tensao', 'Livros que te deixam na ponta da cadeira'),
  ('Choro', 'choro', '😢', 'vibe-choro', 'Prepare os lenços'),
  ('Leve', 'leve', '🌸', 'vibe-leve', 'Leitura confortável e agradável'),
  ('Plot Twist', 'plottwist', '🎭', 'vibe-plottwist', 'Reviravoltas de cair o queixo'),
  ('Sombrio', 'sombrio', '🌑', 'vibe-sombrio', 'Atmosfera dark e intensa'),
  ('Inspirador', 'inspirador', '✨', 'vibe-inspirador', 'Te motiva a ser melhor');

-- =============================================================================
-- 4. REVIEWS
-- =============================================================================
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relations
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  content TEXT,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  
  -- Reading info
  started_reading_at DATE,
  finished_reading_at DATE,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" 
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_reviews_book ON public.reviews(book_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);

-- =============================================================================
-- 5. REVIEW_VIBES (N:N Relationship)
-- =============================================================================
CREATE TABLE public.review_vibes (
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  vibe_id INTEGER REFERENCES public.vibes(id) ON DELETE CASCADE,
  
  PRIMARY KEY (review_id, vibe_id)
);

-- Enable RLS
ALTER TABLE public.review_vibes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Review vibes are viewable by everyone" 
  ON public.review_vibes FOR SELECT USING (true);

CREATE POLICY "Users can add vibes to own reviews" 
  ON public.review_vibes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid())
  );

-- =============================================================================
-- 6. USER_BOOKS (Reading Status)
-- =============================================================================
CREATE TYPE reading_status AS ENUM ('want_to_read', 'reading', 'read', 'dnf');

CREATE TABLE public.user_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  
  status reading_status NOT NULL DEFAULT 'want_to_read',
  
  -- Progress
  current_page INTEGER DEFAULT 0,
  progress_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Dates
  added_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "User books are viewable by everyone" 
  ON public.user_books FOR SELECT USING (true);

CREATE POLICY "Users can manage own book list" 
  ON public.user_books FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_books_user ON public.user_books(user_id);
CREATE INDEX idx_user_books_status ON public.user_books(user_id, status);

-- =============================================================================
-- 7. FOLLOWS (Social Graph)
-- =============================================================================
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Follows are viewable by everyone" 
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" 
  ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Indexes
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- =============================================================================
-- 8. ACTIVITY_FEED (Social Events)
-- =============================================================================
CREATE TYPE activity_type AS ENUM (
  'user_reviewed',
  'user_started_reading', 
  'user_finished_book',
  'user_added_to_list',
  'user_followed',
  'book_trending'
);

CREATE TABLE public.activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Actor
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Event
  activity_type activity_type NOT NULL,
  
  -- References (nullable based on activity type)
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public activities are viewable by everyone" 
  ON public.activity_feed FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own activities" 
  ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_activity_user ON public.activity_feed(user_id);
CREATE INDEX idx_activity_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_type ON public.activity_feed(activity_type);

-- =============================================================================
-- 9. EARLY_ACCESS_BOOKS (Indie First - Gamification)
-- =============================================================================
CREATE TABLE public.early_access_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Book reference
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  
  -- Author/Uploader
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- File storage (Supabase Storage)
  file_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'epub')) NOT NULL,
  file_size_bytes BIGINT,
  
  -- Access control
  is_free BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,
  
  -- Gamification
  xp_bonus INTEGER DEFAULT 50,  -- Extra XP for reviewing indie books
  
  -- Status
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.early_access_books ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Approved early access books are viewable" 
  ON public.early_access_books FOR SELECT USING (is_approved = true);

CREATE POLICY "Authors can upload early access books" 
  ON public.early_access_books FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own early access books" 
  ON public.early_access_books FOR UPDATE USING (auth.uid() = author_id);

-- =============================================================================
-- 10. HELPER FUNCTIONS
-- =============================================================================

-- Function to update book stats after review
CREATE OR REPLACE FUNCTION public.update_book_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.books SET
      avg_rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE book_id = NEW.book_id),
      ratings_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = NEW.book_id),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = NEW.book_id AND content IS NOT NULL),
      updated_at = NOW()
    WHERE id = NEW.book_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.books SET
      avg_rating = COALESCE((SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE book_id = OLD.book_id), 0),
      ratings_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = OLD.book_id),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = OLD.book_id AND content IS NOT NULL),
      updated_at = NOW()
    WHERE id = OLD.book_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_book_stats();

-- Function to add XP to user
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE public.profiles 
  SET xp_points = xp_points + p_xp
  WHERE id = p_user_id
  RETURNING xp_points INTO new_xp;
  
  -- Level up every 1000 XP
  new_level := (new_xp / 1000) + 1;
  
  UPDATE public.profiles
  SET level = new_level
  WHERE id = p_user_id AND level < new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity on review
CREATE OR REPLACE FUNCTION public.create_review_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, book_id, review_id)
  VALUES (NEW.user_id, 'user_reviewed', NEW.book_id, NEW.id);
  
  -- Award XP (base + bonus for indie books)
  PERFORM public.add_user_xp(
    NEW.user_id, 
    10 + COALESCE((SELECT xp_bonus FROM public.early_access_books WHERE book_id = NEW.book_id), 0)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.create_review_activity();

-- =============================================================================
-- 11. VIEWS (Convenience Queries)
-- =============================================================================

-- Trending books (last 7 days)
CREATE OR REPLACE VIEW public.trending_books AS
SELECT 
  b.*,
  COUNT(r.id) as recent_reviews,
  AVG(r.rating) as recent_avg_rating
FROM public.books b
LEFT JOIN public.reviews r ON b.id = r.book_id 
  AND r.created_at > NOW() - INTERVAL '7 days'
GROUP BY b.id
HAVING COUNT(r.id) > 0
ORDER BY recent_reviews DESC, recent_avg_rating DESC
LIMIT 20;

-- User feed (activities from followed users)
CREATE OR REPLACE VIEW public.user_feed AS
SELECT 
  af.*,
  p.username,
  p.display_name,
  p.avatar_url,
  b.title as book_title,
  b.cover_thumbnail as book_cover
FROM public.activity_feed af
JOIN public.profiles p ON af.user_id = p.id
LEFT JOIN public.books b ON af.book_id = b.id
WHERE af.is_public = true
ORDER BY af.created_at DESC;

-- =============================================================================
-- =============================================================================
-- 12. NOTIFICATIONS
-- =============================================================================
CREATE TYPE notification_type AS ENUM (
  'like_review',
  'comment_review',
  'new_follower',
  'system_alert'
);

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  
  -- Metadata (who did it, where)
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID, -- Generic reference to review_id, etc.
  data JSONB DEFAULT '{}', -- Extra data like link, message
  
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Trigger: Notify on Follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id, data)
  VALUES (
    NEW.following_id, 
    'new_follower', 
    NEW.follower_id, 
    jsonb_build_object('link', '/profile/' || (SELECT username FROM public.profiles WHERE id = NEW.follower_id))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- =============================================================================
-- 13. STORAGE (Buckets & Policies)
-- =============================================================================
-- Insert buckets if they don't exist (this might fail if not superuser, but good for reference)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-files', 'book-files', false) -- Private bucket for book files
ON CONFLICT (id) DO NOTHING;

-- Policies for book-covers
CREATE POLICY "Public covers are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

-- Policies for book-files (PDFs/EPUBs)
-- Only authors can upload/view their own files, and approved users (readers) can view approved books
-- For now, allow authors to read own files
CREATE POLICY "Authors can view own book files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-files' AND owner = auth.uid());

CREATE POLICY "Authors can upload book files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'book-files' AND auth.role() = 'authenticated');

-- =============================================================================
-- SETUP COMPLETE! 
-- =============================================================================
-- Para testar, execute:
-- SELECT * FROM public.vibes;
-- =============================================================================
