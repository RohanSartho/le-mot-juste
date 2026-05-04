# Le Mot Juste

A real-time multiplayer French vocabulary game — like Taboo/Charades, built for language learners.

**Live:** https://le-mot-juste.vercel.app

---

## How it works

1. Host creates a room → gets a short code (e.g. `CHAT-4821`) and a shareable URL
2. Players join on their own devices (or pass the phone) — no account needed, just a name
3. Each round: the **describer** sees a French word and describes it in French (no forbidden words allowed in Taboo mode)
4. Other players shout their guesses out loud
5. Describer taps **Correct** or **Skip** — role rotates after each player's turn
6. End screen shows scores and medals — play again or start a new game

---

## Modes

| Mode | Taboo | Clue chips shown |
|---|---|---|
| **Beginner** (default) | Off | 🔑 Mots associés — synonyms + related words shown as helpers |
| **Challenge** | On | 🚫 Interdit — those same words are forbidden to say |

Toggle in the lobby settings before starting.

---

## Features

- 5,000 French words (sourced from Lexique4, enriched with Wiktionary)
- Word categories: Animaux, Lieux & Nourriture, Nature, Émotions, Voyage, Objets, Vêtements, Verbes, Adjectifs, Divers
- Difficulty filter: Easy / Medium / Hard / All
- Configurable timer: 10s / 20s / 40s / 60s
- Configurable rounds and words per turn
- 📖 Reveal definition button — shows Wiktionary definition on demand (costs −1 pt)
- Real-time sync via Firestore — all devices stay in sync automatically
- Sessions auto-expire 2 hours after creation
- 🌍 **Bilingual UI** — English subtitles throughout for English speakers (game content remains French-only)

---

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Backend:** Firebase Firestore
- **State:** Zustand
- **Hosting:** Vercel
- **Auth:** None — player = name in localStorage

---

## Local dev

```bash
cd app
npm install
npm run dev
# → http://localhost:3000 (also accessible on local network for phone testing)
```

Requires a `.env.local` with Firebase credentials (not committed):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Word data

Words live in Firestore (`words` collection). Seed scripts are in `app/seed/`:

| Script | Purpose |
|---|---|
| `seed_lexique.cjs` | Initial 5k-word import from Lexique4 TSV |
| `update_words.cjs` | Batch update operations — forbidden words, Wiktionary definitions, synonyms |

Run with `--limit N` to stay within the Firestore free tier (20k writes/day).

---

## Repo

https://github.com/RohanSartho/le-mot-juste
