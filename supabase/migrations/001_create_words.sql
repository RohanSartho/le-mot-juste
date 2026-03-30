-- UP
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  forbidden_words TEXT[] DEFAULT '{}',
  hints TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'fr',
  frequency_rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_words_category ON words(category);
CREATE INDEX idx_words_difficulty ON words(difficulty);
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Words are publicly readable" ON words FOR SELECT USING (true);

-- DOWN
DROP TABLE IF EXISTS words;
