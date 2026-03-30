-- UP
-- Required for Supabase Realtime postgres_changes UPDATE filters to work.
-- Without FULL replica identity, Postgres only broadcasts the PK on UPDATE,
-- so channel filters like `id=eq.ROSE-3810` silently receive nothing.
ALTER TABLE game_sessions REPLICA IDENTITY FULL;

-- DOWN
ALTER TABLE game_sessions REPLICA IDENTITY DEFAULT;
