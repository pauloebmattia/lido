-- Add more vibes to the database
INSERT INTO vibes (name, slug, emoji, color, description) VALUES
('Divertido', 'divertido', '😂', 'vibe-divertido', 'Te faz rir alto'),
('Reflexivo', 'reflexivo', '🤔', 'vibe-reflexivo', 'Te faz pensar muito'),
('Apaixonante', 'apaixonante', '😍', 'vibe-apaixonante', 'Romance de suspirar'),
('Chocante', 'chocante', '😱', 'vibe-chocante', 'Não acredito que isso aconteceu'),
('Assustador', 'assustador', '👻', 'vibe-assustador', 'De dar medo de verdade')
ON CONFLICT (slug) DO NOTHING;
