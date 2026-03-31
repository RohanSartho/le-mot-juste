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
- [x] `taboo_enabled` toggle — when off, forbidden words hidden from describer card
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

## ⚠️ Pending — Do Before Next Session

### Firestore seed re-run required
- [ ] Firestore daily write quota was exhausted on 2026-03-31
- [ ] Quota resets at **midnight UTC = 8:00 PM EDT**
- [ ] Steps:
  1. Firebase console → Firestore → Rules → set `words` write to `if true`
  2. `node seed/seed_lexique.cjs`
  3. Restore `words` write rule to `if false`
- [ ] This will populate `forbidden_words` for all 5k words (currently empty — taboo mode falls back to static 50 words)

---

## Known Issues
- [ ] `words_per_round` rotation: if host refreshes mid-game, `useGameStore` resets (acceptable v1)
- [ ] No PWA / offline support
- [ ] Game code collisions theoretically possible at scale
- [ ] Firestore words have `forbidden_words: []` until seed re-run completes (see above)

---

## Post-v1 Backlog (do not implement)
- [ ] **Guesser point tracking** — Currently only the describer scores. To award guessers: either (a) add a real-time "who guessed?" tap UI that appears after each correct word, or (b) implement team-based scoring where the describing team shares points. Requires deciding whether guesses are tracked per-player or per-team. Blocked on real-time sync design.
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
