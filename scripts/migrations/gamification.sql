-- Gamification System Tables

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name or internal reference
    category TEXT NOT NULL CHECK (category IN ('reading', 'social', 'indie', 'special')),
    condition_type TEXT, -- e.g., 'books_read', 'pages_read', 'indie_books_read'
    condition_value INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges (Public read, Admin write)
CREATE POLICY "Badges are viewable by everyone" ON badges
    FOR SELECT USING (true);

-- Policies for user_badges (Public read, System/Admin write)
CREATE POLICY "User badges are viewable by everyone" ON user_badges
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own badges (via trigger usually, but allowing for now)" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed Initial Badges
INSERT INTO badges (name, description, icon_name, category, condition_type, condition_value, xp_reward) VALUES
('Primeiros Passos', 'Leu seu primeiro livro no Lido.', 'BookOpen', 'reading', 'books_read', 1, 50),
('Devorador de Páginas', 'Leu mais de 1000 páginas.', 'Layers', 'reading', 'pages_read', 1000, 100),
('Apoiador Indie', 'Leu seu primeiro livro independente.', 'Sparkles', 'indie', 'indie_books_read', 1, 150),
('Maratona Literária', 'Leu 10 livros.', 'Trophy', 'reading', 'books_read', 10, 300),
('Voz da Comunidade', 'Escreveu 5 reviews.', 'MessageSquare', 'social', 'reviews_count', 5, 100),
('Curador', 'Criou 3 listas de leitura.', 'List', 'social', 'lists_created', 3, 100);
