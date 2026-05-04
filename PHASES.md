# PHASES.md — Le Mot Juste Build Plan

## How to use this file
This file contains the complete build plan for Le Mot Juste.
Claude Code should read this file at the start of every session.
Execute one phase at a time. After each phase, return a status report (see CLAUDE.md for format).
Do not proceed to the next phase without explicit approval from Rohan (Head of Product).

---

## Current status
- Phase 1: ✅ Complete
- Phase 2: ✅ Complete
- Phase 3: ✅ Complete
- Phase 4: ✅ Complete
- Phase 5: ✅ Complete
- Phase 6: ✅ Complete (live at https://le-mot-juste.vercel.app)
- Phase 7: ✅ Complete (bug fixes + solo mode + scoring overhaul)
- Phase 8: ✅ Complete (word data enrichment — forbidden_words, hint2, taboo-off clues)

---

## Phase 1 — Scaffold + Schema + Seed ✅
Already complete. Remaining manual steps:
1. Run migrations in Supabase dashboard SQL editor (in order):
   - `supabase/migrations/001_create_words.sql`
   - `supabase/migrations/002_create_game_sessions.sql`
2. Run seed: `node supabase/seed/seed_words.cjs`
3. Verify 50 rows in `words` table in Supabase dashboard

---

## Phase 2 — Home Screen + Join Flow + Lobby

### Goal
Players can create a room, share a link, join by code, enter their name, and wait in a lobby.

### Context
- No auth. Player = { name: string, id: string (UUID) } stored in localStorage key `lmj_player`
- Game session stored in Supabase `game_sessions` table
- Game code format: `WORD-NNNN` — pick a random French word (4-6 chars) + 4 random digits
- Shareable URL: `https://[domain]/game/CHAT-4821`
- Host is the player who created the session — stored as `host_name` in session
- Settings (category, difficulty, rounds) set in lobby by host, stored in `settings` JSONB

### TypeScript types to create at `/src/types/index.ts`
```ts
export type Difficulty = 'easy' | 'medium' | 'hard' | 'all'

export type GameStatus = 'lobby' | 'playing' | 'finished'

export type Player = {
  id: string
  name: string
}

export type GameSettings = {
  categories: string[]
  difficulty: Difficulty
  rounds: number
  timer_seconds: number
}

export type GameSession = {
  id: string
  host_name: string
  status: GameStatus
  current_word_id: string | null
  current_describer: string | null
  scores: Record<string, number>
  settings: GameSettings
  created_at: string
  expires_at: string
}

export type Word = {
  id: string
  word: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  forbidden_words: string[]
  hints: string[]
}
```

### Zustand store at `/src/stores/useGameStore.ts`
```ts
import { create } from 'zustand'
import { GameSession, Player, Word } from '../types'

type GameStore = {
  session: GameSession | null
  player: Player | null
  currentWord: Word | null
  setSession: (s: GameSession) => void
  setPlayer: (p: Player) => void
  setCurrentWord: (w: Word) => void
  reset: () => void
}
```
Implement with `create<GameStore>()(...)` — no persist middleware yet.

### Routes — use React Router v6
Install: `npm install react-router-dom`
```
/              → HomeScreen
/game/:code    → reads session status from Supabase
               → if 'lobby'   → LobbyScreen
               → if 'playing' → GameScreen (host or player view)
               → if 'finished'→ EndGameScreen
```

### Screens to build

#### `/src/screens/HomeScreen.tsx`
Two panels:
1. **Create game** — input for host name → button "Create game" → generates code → inserts session → navigates to `/game/:code`
2. **Join game** — input for game code + player name → button "Join" → validates session exists → adds player to scores JSONB → navigates to `/game/:code`

Game code generation helper at `/src/lib/gameCode.ts`:
```ts
const WORDS = ['CHAT', 'LUNE', 'ROSE', 'VERT', 'BLEU', 'BOIS', 'FLEUR', 'NUIT']
export function generateGameCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}-${num}`
}
```

Supabase operations in `/src/lib/sessions.ts`:
```ts
// createSession(hostName, code) → inserts game_sessions row, returns session
// joinSession(code, player) → adds player to scores JSONB, returns session
// getSession(code) → fetches session by id
```

#### `/src/screens/LobbyScreen.tsx`
- Show game code prominently with a copy link button
- Show player list (from `scores` JSONB keys)
- Show settings panel (host only): category multi-select, difficulty select, rounds slider (1-5), timer select (30s/60s/90s)
- "Start game" button — host only — updates status to 'playing' in Supabase
- Poll Supabase every 3 seconds for new players joining (no realtime yet)
- Non-host players see "Waiting for host to start..." message

### After building
- Test: create a game on one browser tab, join from another tab with different name
- Confirm both players appear in lobby
- Confirm host can update settings
- Confirm "Start game" transitions status to 'playing'

---

## Phase 3 — Gameplay Screens

### Goal
Host sees the word and controls. Players see who is describing and a timer.

### Context
- `current_describer` in session = player name whose turn it is
- `current_word_id` in session = active word UUID
- Host is the only one who can advance cards (Correct / Skip)
- Describer role rotates through all players after each full round
- A "round" = each player has described once

### Host view `/src/screens/GameScreen.tsx` (host branch)
- Fetch word from Supabase by `current_word_id`
- Show: word (large), category pill, difficulty dot, forbidden word chips, hint chips
- 60s countdown timer (from `settings.timer_seconds`)
- "Correct" button → +3 to guesser (next player), +2 to describer → advance card
- "Skip" button → no points → advance card
- On advance: pick next word by category/difficulty filter, update `current_word_id` in session
- After all rounds done → update status to 'finished'

### Player view `/src/screens/GameScreen.tsx` (player branch)
- Show current describer name
- Show timer (synced by polling session every 2s)
- Show guess input (stores guess locally, display only — no DB write in v1)
- Clear message: "Listen and shout your answer!"

### Word selection logic in `/src/lib/words.ts`
```ts
// getNextWord(settings) → fetches random word from Supabase filtered by category + difficulty
// Exclude already-used words in this session (track in Zustand store: usedWordIds: string[])
```

### Scoring logic in `/src/lib/scoring.ts`
```ts
// awardPoints(session, describerName, guesserName, correct: boolean)
// Updates scores JSONB in Supabase
```

### Describer rotation
Track in Zustand: `playerOrder: string[]`, `currentDescriberIndex: number`
On game start: set `playerOrder` from scores keys, `currentDescriberIndex = 0`
After each card: check if all players have described once → increment round count
After `settings.rounds` rounds → end game

---

## Phase 4 — End Game + Polish + Bug Fixes

### Goal
Complete end game flow, sepia theme, and fix describer visibility.

### End game screen `/src/screens/EndGameScreen.tsx`
- Show final scores ranked
- Highlight winner
- "Play again" button → reset session: status → 'lobby', scores → {}, current_word_id → null
- "New game" button → navigate home

### Cleanup
- Session already has `expires_at = NOW() + 2 hours` from creation
- On game finish: update `expires_at = NOW() + 1 hour` (already done in advanceCard)
- Add cleanup query to run at app start: delete sessions where expires_at < NOW()

### Sepia theme (all screens)
- Replace dark gray palette with warm sepia across Home, Lobby, GameScreen, EndGameScreen
- Page background: warm cream (`bg-amber-50`)
- Cards: `bg-stone-100`, inputs: `bg-stone-200`
- Text: `text-stone-900` / `text-stone-600` / `text-stone-400`
- CTA buttons: `bg-stone-800 text-amber-50`
- Correct button: `bg-emerald-700`; forbidden chips: rose tones; hints: stone tones

### Describer sees their word
- In GameScreen, the current describer should see the word on their own device
- Current describer view: same word card as host view, but **no Correct/Skip buttons**
- Guesser view (everyone else): describer name + "Listen and shout!"
- Host always keeps the Correct/Skip controls regardless of who is describing

---

---

## Phase 8 — Word Data Enrichment ✅

### What was built
- `seed/update_words.cjs` — batch update script with 3 operations:
  - `fix_forbidden` — fills `forbidden_words[]` for all 5k Lexique words using category pools
  - `fetch_hint2` — fetches French definitions from Wiktionary → `seed/hint2_cache.json` (4987/5000 found)
  - `write_hint2` — writes cache to Firestore, quota-safe with `--limit` flag
- `hint2` field added to `Word` type — Wiktionary definition, now the default hint reveal
- `forbidden_words` shown as `🔑 Mots associés` when taboo is off (instead of hidden)
- UI: two hint reveal buttons collapsed into one (`📖 Révéler la définition`)

### Key decisions
- Used `prop=revisions` (raw wikitext) for Wiktionary batch fetch — `prop=extracts` silently returns only 1 page per batch
- Definitions stored locally first (`hint2_cache.json`) then written to Firestore separately — safe from crashes and rate limits
- `hint_question` (generic templates) kept as silent fallback for the 13 words not on Wiktionary

---

## Phase 7 — Bug Fixes + Solo Mode + Scoring Overhaul ✅

### Bugs fixed
- **404 on direct URL** — added `vercel.json` SPA rewrite rule (`/(.*) → /index.html`)
- **React hooks error #310** — `copied`/`handleCopy` hooks were after early returns in Lobby; moved before all conditional returns
- **Button double-tap on mobile** — `transition-transform` was shifting hit targets during animation; fixed with global `button { transition: none }` in `index.css`
- **Play again button disabled** — `setStarting(false)` was only in `catch`; game started successfully so it stayed `true` forever; moved to `finally`
- **Play again showed stuck lobby** — `initialised.current` guard in `onSnapshot` prevented re-deriving lobby state after reset; removed guard, state now always derived from snapshot

### Features added
- **Solo (1-player) mode** — "Solo" option in player selector; lobby allows 1-player start; describer rotation stays on same player
- **Copy button** — next to game code in lobby with "Copié ✓" feedback
- **Dynamic word font size** — long words scale down instead of wrapping mid-word (`whitespace-nowrap` + JS font-size formula)

### Scoring overhaul
- Removed guesser points entirely — describer earns all points
- New scale: +2 correct, +1 correct with hint, 0 pass (same for solo and multiplayer)
- Guesser tracking added to post-v1 backlog in TASKS.md

---

## Deployment (after Phase 4)

### Vercel
```
npm install -g vercel
vercel login
vercel --prod
```
Set env vars in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase RLS check before going live
- `words` table: SELECT only, public ✅
- `game_sessions` table: SELECT/INSERT/UPDATE public — review before launch
- No DELETE policy needed (expiry handles cleanup)
