# 🇫🇷 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/40px-Flag_of_Quebec.svg.png" height="20" alt="Quebec flag" style="vertical-align:middle"/> Le Mot Juste — *"The Right Word"*

A real-time multiplayer French vocabulary game built around charades. One player describes a French word using only French sentences — no gestures, no translations — while everyone else shouts their guess. First to get it right wins the round.

Built for French learners and Francophiles — whether you're learning Parisian French 🇫🇷 or Québécois <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/40px-Flag_of_Quebec.svg.png" height="14" alt="Quebec" style="vertical-align:middle"/>.

**Live:** [le-mot-juste.vercel.app](https://le-mot-juste.vercel.app)

---

## How to Play

1. Create a game and share the code (e.g. `CHAT-4821`) or the URL with friends
2. Everyone joins by entering their name — no account needed
3. The describer sees a word and must explain it in French
4. Forbidden words are shown — you can't use them in your description
5. Hit **Correct** when someone guesses it, or **Passer** to skip
6. Roles rotate after each turn. Most points after all rounds wins.

**Solo mode** is also supported — practice your own vocabulary with just one player.

---

## Word Database

- **5,000 words** stored in Firebase Firestore, sourced and filtered from [Lexique 4](http://www.lexique.org/) — an open-source French lexical database
- Words are tagged with:
  - **Category** — one of 8 themes: Food & Places, Animals, Objects, Travel, Emotions, Verbs, Nature, Clothing
  - **Difficulty** — derived from word frequency rank in Lexique 4:
    - `easy` — frequency ≥ 50 per million words
    - `medium` — frequency ≥ 5 per million
    - `hard` — frequency < 5 per million

---

## Forbidden Words

Each word has up to 3 **forbidden words** — related terms the describer cannot say. These are generated at seed time by sampling other words from the same category in the Firestore collection, picking semantically close neighbours. Forbidden words make descriptions harder and more creative.

Example — *romantisme*: forbidden words might be `amour`, `sentiment`, `poème`

---

## Hint Phrases

Each word has an optional **hint question** — a coaching prompt the describer can reveal mid-turn at a cost of −1 point. These are generated from 10 template pools (one per category × part of speech), each with 7 prompt variants, randomly assigned per word during seeding.

Example templates:
- *"Quel sentiment évoque ce mot ?"* (Emotions)
- *"Dans quel lieu trouve-t-on cela ?"* (Food & Places)
- *"Est-ce un objet qu'on utilise à la maison ?"* (Objects)

---

## Scoring

| Situation | Points |
|---|---|
| Word guessed correctly | +2 to describer |
| Word guessed with hint revealed | +1 to describer |
| Passed or timed out | 0 |

Guesser point tracking is planned for a future version.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Database | Firebase Firestore |
| Auth | None — name only, stored in localStorage |
| Hosting | Vercel |

---

## Local Development

```bash
npm install
npm run dev        # starts on localhost:3000, exposed on local network for phone testing
```

Requires a `.env.local` with Firebase config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
