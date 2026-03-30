-- UP
-- Required for Supabase Realtime subscriptions on game_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- DOWN
ALTER PUBLICATION supabase_realtime DROP TABLE game_sessions;
