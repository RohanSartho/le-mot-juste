# PROJECT.md — Le Mot Juste

## What is this?
Le Mot Juste is a real-time multiplayer French vocabulary learning game. Players describe French words using only French sentences while others guess — like Taboo/Charades but built for language learning.

## Core Game Loop
1. Host creates a room → gets a short code (e.g. CHAT-4821) and shareable URL
2. Players join by entering their name — no account needed
3. Each round: one player (the describer) sees a French word
4. They describe it in French — forbidden words shown, hints available as chips
5. Other players shout guesses out loud (v1: no digital sync)
6. Describer marks correct / skip
7. Points (describer only): +2 correct, +1 correct with hint used, 0 for pass
8. After X cards, describer role rotates
9. End screen shows scores → session auto-deleted 2 hours after creation

## Multiplayer
- **Same device:** pass-the-phone — host controls everything
- **Different devices:** host shares URL, others join by name

## Session Model
- No accounts in v1
- Player = name in localStorage
- Session = short code + Firestore document (switched from Supabase during Phase 2)
- Sessions auto-expire 2 hours after creation
- End-of-game stats shown on EndGameScreen, session cleaned up on next app start
- Vercel Cron (`api/purge-sessions.ts`) runs daily at 06:00 UTC to hard-delete sessions older than 24h

## Word Data
- Source: Lexique4 (open source French dictionary, ~142k entries)
- Seed: 5,000 words in Firestore (`seed/seed_lexique.cjs`)
- Schema: word, category, difficulty, forbidden_words[], hints[], hint_question, hint2, language, frequency_rank
- Categories: Animaux, Lieux & Nourriture, Nature, Émotions, Voyage, Objets, Vêtements, Verbes, Adjectifs, Divers
- `forbidden_words[]` — related words from same category pool (shown as 🚫 Interdit when taboo on, 🔑 Mots associés when taboo off — **default: taboo off**)
- `hint2` — Wiktionary definition, primary hint reveal in-game (4987/5000 words covered)
- Batch update tool: `seed/update_words.cjs` — quota-safe, resumable, never overwrites unrelated fields

## Screens
1. **Home** — Create game / Join by code
2. **Lobby** — Player list, settings (category, difficulty, rounds), Start button
3. **Game — Host view** — Word, forbidden words, hints, timer, Correct/Skip buttons
4. **Game — Player view** — Describer name, timer, guess input (display only in v1)
5. **End game** — Scores, Play again

## v1 Scope
- [x] Word cards with forbidden words + hints
- [x] Category and difficulty filters
- [x] Room creation with short code
- [x] Join by link or code
- [x] Name-only session (localStorage)
- [x] Describer vs guesser views
- [x] Configurable timer (10/20/40/60s)
- [x] Score tracking (describer only)
- [x] End game summary + play again
- [x] Session auto-cleanup
- [x] Solo (1-player) mode
- [x] 5,000-word Firestore library with hint questions
- [x] Copy game code button
- [x] SPA routing fix (Vercel rewrite)
- [x] forbidden_words populated for all 5k words
- [x] Wiktionary definitions (hint2) as default hint reveal
- [x] Taboo-off mode shows forbidden words as clues (🔑 Mots associés) — **default: taboo off**
- [x] Vercel Cron purges stale sessions daily (api/purge-sessions.ts)
- [x] **Bilingual UI**: English subtitles under all French labels and UI terms for English-speaking users
  - Form labels, buttons, section headers have English translations in smaller, lighter text
  - Game content (words, hints, forbidden words, categories) remains French-only for authenticity

## Post-v1 Backlog
- [ ] Guesser point tracking (see TASKS.md for design options)
- [ ] Real-time guess sync via Firestore Realtime
- [ ] Custom word packs
- [ ] Persistent accounts + history
- [ ] Drawing/Pictionary mode
- [ ] Mobile app
- [ ] Lexique383 full import (10k+ words)
