# TODO.md — Le Mot Juste Backlog

## Post-v1 Features
- [ ] **Real-time guess sync** — Supabase Realtime channel so guesses appear live on all screens
- [ ] **Custom word packs** — players create and save their own word sets
- [ ] **Persistent accounts** — email/OAuth, game history, leaderboard
- [ ] **Drawing mode** — Pictionary-style round, describer draws the word
- [ ] **Mobile app** — React Native or PWA
- [ ] **Lexique383 full import** — filter ~140k entries to 5-10k common words by frequency rank
- [ ] **Word difficulty auto-scoring** — use play data to tune difficulty ratings
- [ ] **Audio hints** — pronunciation playback for each word
- [ ] **CI/CD** — GitHub Actions: lint + test + Vercel deploy on push

## Known v1 Limitations
- No real-time guess visibility across devices — by design, guesses are verbal
- Sessions expire after 2 hours — no resume after close
- Forbidden/hints are hand-curated for seed words only
- Game code collisions possible at high volume — fine for v1 scale

## Technical Debt to Watch
- `scores` as JSONB on `game_sessions` won't scale past ~10 players — extract to `players` table if needed
- RLS policies need security audit before public launch
- Lexique383 category mapping is manual — needs ML tagging at scale
