-- UP
CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  host_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('lobby', 'playing', 'finished')) DEFAULT 'lobby',
  current_word_id UUID REFERENCES words(id),
  current_describer TEXT,
  scores JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{
    "categories": [],
    "difficulty": "all",
    "rounds": 3,
    "timer_seconds": 60
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are publicly readable" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Sessions are publicly insertable" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions are publicly updatable" ON game_sessions FOR UPDATE USING (true);

-- DOWN
DROP TABLE IF EXISTS game_sessions;
