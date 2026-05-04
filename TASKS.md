# TASKS.md — Le Mot Juste
> Single source of truth for completed work and current status.
> Updated at the end of every session.

---

## Stack (actual, as built)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4
- **Backend**: Firebase Firestore (switched from Supabase during Phase 2)
- **State**: Zustand
- **Auth**: None — player = name in localStorage
- **App folder**: `/app`
- **Dev server**: `localhost:3000` (host: true in vite.config.ts — accessible on local network)
- **Repo**: https://github.com/RohanSartho/le-mot-juste
- **Live**: https://le-mot-juste.vercel.app

---

## Phase 1: Scaffold + Schema + Seed ✅ COMPLETE
- [x] Vite + React + TypeScript + Tailwind v4
- [x] Firebase Firestore client configured (`src/lib/firebase.ts`)
- [x] Folder structure: screens, lib, stores, types, hooks, components
- [x] 50-word hand-curated static word array (`src/lib/words.ts`)
- [x] Git initialized

---

## Phase 2: Home Screen + Join Flow + Lobby ✅ COMPLETE
- [x] TypeScript types: `GameSession`, `Player`, `Word`, `GameSettings` — `src/types/index.ts`
- [x] Zustand session store — `src/stores/sessionStore.ts`
- [x] Game code generator (WORD-NNNN format) — `src/lib/gameCode.ts`
- [x] Firestore session CRUD — `src/lib/sessions.ts`
- [x] Home screen — Create / Join tabs — `src/screens/Home.tsx`
- [x] Join flow — code + name → joinSession → lobby
- [x] Shareable URL: `/game/:code` — `src/App.tsx`
- [x] Lobby screen — player list, settings summary, Start button (host only)
- [x] Firebase `onSnapshot` real-time subscription on session doc
- [x] Route setup: `/` → Home, `/game/:code` → Lobby/Game/EndGame

---

## Phase 3: Gameplay Screens ✅ COMPLETE
- [x] `src/stores/useGameStore.ts` — player order, describer rotation, used word IDs
- [x] `src/lib/scoring.ts` — `awardPoints` (+3 guesser, +2 describer)
- [x] `src/lib/words.ts` — `getNextWord` filters by difficulty + category
- [x] `src/lib/sessions.ts` — `startGame` (word + describer), `advanceCard`
- [x] `GameScreen` — describer view: word card, forbidden chips, hint chips, timer, Correct/Skip
- [x] `GameScreen` — player view: describer name, timer, live scoreboard
- [x] `EndGameScreen` — ranked scores, winner highlight, New Game button
- [x] Lobby routes to GameScreen / EndGameScreen on status change

---

## Phase 4: Theme + Bug Fixes + End Game Polish ✅ COMPLETE
- [x] Warm sepia theme — `bg-amber-50`, `stone-*`, `bg-[#fdf7ef]` across all screens
- [x] `index.css` — mobile base: `touch-action`, `-webkit-tap-highlight-color`, `overscroll-behavior`
- [x] **Bug fix**: describer now sees their own word card on their device
- [x] **Bug fix**: Correct/Skip controls belong to the current describer, not the host
- [x] Guesser view — describer name + live scoreboard + words remaining indicator
- [x] `EndGameScreen` — medals (🥇🥈🥉), Play Again (host resets session), New Game
- [x] `resetSession` — back to lobby, scores cleared, word state cleared
- [x] `cleanExpiredSessions` — runs on app start, deletes expired Firestore docs
- [x] `used_word_ids` + `rounds_played` moved to Firestore (was local Zustand — multi-device bug)

---

## Phase 5: UX Overhaul + New Settings + Word Library ✅ COMPLETE

### 5A — Settings expansion
- [x] `words_per_round` (3/5/7) — words each describer does before rotating
- [x] `rounds` renamed to "Nombre de manches" (1/2/3)
- [x] `max_players` — dropdown 2–8, default 2, visual indicator in lobby (shows X / expected)
- [x] `timer_seconds` — pill selector: 10s / 20s / 40s / 60s
- [x] `taboo_enabled` toggle — when off, forbidden words shown as 🔑 Mots associés clues; **default: off (beginner-friendly)**
- [x] Category multi-select chips (all 8 categories, labels in French)
- [x] Settings order: words/turn → manches → players → timer → difficulty → categories → taboo
- [x] **Bug fix**: all `<button>` elements have `type="button"` — taboo toggle + game controls no longer misfire

### 5B — Mobile-first redesign
- [x] All screens: `max-w-sm mx-auto` centered shell — playable on desktop as fixed-width card
- [x] Large touch targets (h-14 CTAs, pill buttons)
- [x] Bottom-anchored sticky CTAs
- [x] Spinner loading states
- [x] `host: true` in vite.config — accessible via local network IP for phone testing

### 5C — French labels on cards
- [x] "🚫 Interdit" — forbidden words section
- [x] "💡 Indices" — hints section
- [x] "Catégorie" pill on word card

### 5D — 5,000 word Firestore library
- [x] `seed/seed_lexique.cjs` — processes Lexique4.tsv → 5k words → Firestore
- [x] Semantic category assignment from word lists
- [x] Difficulty from frequency rank (easy ≥50, medium ≥5, hard <5 per million)
- [x] `fetchWordPool` — async Firestore query at game start, falls back to static 50 words
- [x] `fetchWordById` — async fetch with in-memory cache
- [x] `word_pool` stored in Firestore session so all clients share the same pool
- [x] 5,000 words confirmed uploaded to Firestore `words` collection
- [x] `forbidden_words` generation added to seed script (picks 3 related words from category pool)

### 5E — Hint question feature
- [x] `hint_question: string` added to `Word` type
- [x] 10 template pools (by category + POS), 7 prompts each — randomly assigned per word
- [x] Describer card: "🪄 Révéler la question guide (−1 pt)" button
- [x] On reveal: coaching question shown, `hintUsed = true`, button disabled
- [x] Point penalty: hint used → +2 guesser / +1 describer (instead of +3 / +2)
- [x] Hint state resets on every new word

---

## Phase 6: Deployment ✅ COMPLETE
- [x] Git history cleaned — Supabase anon key scrubbed with git-filter-repo
- [x] Pushed to GitHub: https://github.com/RohanSartho/le-mot-juste
- [x] Deployed to Vercel: https://le-mot-juste.vercel.app
- [x] Root directory set to `app` in Vercel settings
- [x] All 6 Firebase env vars set in Vercel dashboard

---

## Phase 8: Word Data Enrichment ✅ COMPLETE

### 8A — forbidden_words populated
- [x] `seed/update_words.cjs` created — batch update script (uses `update()` not `set()`, preserves all fields)
- [x] Category pools added for Verbes, Adjectifs, Divers (were empty — caused 4796 skips)
- [x] `fix_forbidden` op — fills empty `forbidden_words[]` for all 5k Lexique words
- [x] 4000 written day 1, 796 remaining (run tomorrow)
- [x] `--limit N` flag — caps Firestore writes per run (default 4000, leaves headroom for app)

### 8B — hint2 (Wiktionary definitions)
- [x] `hint2?: string` added to `Word` type
- [x] `fetch_hint2` op — fetches from French Wiktionary using `prop=revisions` (raw wikitext, true batch support)
  - Batches 50 words/request → 100 requests total, ~3 min, no rate limiting
  - Saves to `seed/hint2_cache.json` — resumable, survives crashes
  - 4987 / 5000 definitions fetched (13 not on Wiktionary)
- [x] `write_hint2` op — writes cache to Firestore, respects `--limit`
  - 4000 written day 1, 987 remaining (run tomorrow)
- [x] `hint2` is now the **default hint reveal** in GameScreen — replaces the generic `hint_question` template
  - Falls back to `hint_question` for the 13 words without a Wiktionary definition
  - UI consolidated from 2 reveal buttons → 1 (`📖 Révéler la définition`)

### 8C — taboo words shown as clues
- [x] When `taboo_enabled = false`: `forbidden_words` now shown as `🔑 Mots associés` (teal chips) instead of being hidden
- [x] When `taboo_enabled = true`: shown as `🚫 Interdit` (rose chips) as before

---

## Phase 9: Infrastructure + Defaults ✅ COMPLETE

### 9A — Taboo default off
- [x] `taboo_enabled` default changed to `false` in `Home.tsx` `DEFAULT_SETTINGS`
- [x] New games now start in beginner mode — synonyms + related words shown as clues
- [x] Host can still enable Taboo in lobby settings for challenge mode

### 9B — Session purge cron
- [x] `api/purge-sessions.ts` — Vercel serverless function, Firebase Admin SDK
- [x] Queries `expires_at < (now - 22h)` — sessions created 24h+ ago
- [x] Batch-deletes in chunks of 500 (Firestore limit)
- [x] Auth: Vercel Cron header OR `Authorization: Bearer CRON_SECRET` for manual trigger
- [x] `vercel.json` cron: `0 6 * * *` (06:00 UTC daily)
- [x] `firebase-admin` + `@vercel/node` installed
- [x] Routing fixed: switched to `routes` with `handle: filesystem` so `/api/*` isn't swallowed by SPA rewrite
- [ ] **Requires setup**: add `FIREBASE_SERVICE_ACCOUNT` + `CRON_SECRET` to Vercel env vars
- [ ] **Vercel Pro** required for auto-fire; manual curl trigger works on Hobby

### 9C — README
- [x] `README.md` written — game overview, modes table, features, stack, local dev, word data

---

## Known Issues
- [ ] `words_per_round` rotation: if host refreshes mid-game, `useGameStore` resets (acceptable v1)
- [ ] No PWA / offline support
- [ ] Game code collisions theoretically possible at scale

---

### 8D — Synonyms in beginner mode ✅ COMPLETE
- [x] `synonyms?: string[]` added to `Word` type
- [x] `fetch_synonyms` op — batches 50 words/request, parses `{{S|synonymes}}` from Wiktionary wikitext → `synonyms_cache.json`
- [x] `write_synonyms` op — 1683 words written to Firestore (3317 have no Wiktionary synonyms — accepted, still show forbidden_words as clues)
- [x] GameScreen taboo-off: synonyms shown first, then forbidden_words, deduplicated into one `🔑 Mots associés` chip group

---

## Post-v1 Backlog (do not implement)
- [ ] Real-time guess sync via Firestore Realtime
- [ ] Custom word packs
- [ ] Persistent accounts + history
- [ ] Drawing / Pictionary mode
- [ ] Mobile app (React Native or PWA)
- [ ] Lexique full import (10k+ words with curated forbidden words)
- [ ] Word difficulty auto-tuning from play data
- [ ] Audio pronunciation hints
- [ ] CI/CD — GitHub Actions + Vercel deploy on push
- [ ] Admin dashboard to manage/edit words
