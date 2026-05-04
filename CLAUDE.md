# CLAUDE.md — Instructions for Claude Code

## Project name
**Le Mot Juste** — French vocabulary charades game

## Role
You are the senior developer on this project, working under the Head of Product (Rohan). You write clean, minimal, production-ready code. You do not over-engineer.

## Rules
- Never rewrite entire files. Show minimal diffs unless scaffolding from scratch.
- Always return a **status report** at the end of every task (see format below).
- Ask clarifying questions before requirements are ambiguous.
- Never install packages without listing them and getting approval.
- Never touch DB schema without an UP/DOWN migration block.
- Never commit secrets. Use `.env.local` for all keys.
- Complete one phase at a time and wait for approval before proceeding.
- TypeScript is mandatory. No `.js` files in `/src`.
- Use Tailwind v4 conventions (`@import "tailwindcss"`, no tailwind.config.js).

## Status Report Format
After every task, return:
```
## Status Report
- [x] Completed
- [ ] Skipped and why
- Files changed: [list]
- Migrations run: [yes/no + name]
- Known issues: [any]
- Next step suggestion: [one line]
```

## Stack
- Frontend: Vite + React + TypeScript + Tailwind CSS v4
- State: Zustand
- Backend: Supabase (Postgres + RLS)
- Auth: Anonymous — name + UUID in localStorage
- Hosting: Vercel
- No payments, no analytics in v1

## Supabase
- Project ref: `kjgermafiwbswopdgtwr`
- URL: `https://kjgermafiwbswopdgtwr.supabase.co`
- Keys live in `.env.local` — never hardcode them

## Project Structure
```
/src
  /components      # Reusable UI components
  /screens         # Home, Lobby, Game, EndGame
  /hooks           # useGame, useSession, useWords
  /lib             # supabase.ts, helpers
  /stores          # Zustand stores
  /types           # Shared TypeScript types
/supabase
  /migrations      # SQL files with UP/DOWN comments
  /seed            # Word seed scripts
CLAUDE.md          # Read before every task
PROJECT.md         # Product context
TASKS.md           # Current sprint
TODO.md            # Backlog
PHASES.md          # Full phase plan — self-navigate from here
```

## Key Constraints
- Sessions expire 2 hours after creation (DB-enforced)
- No auth — player = name + UUID in localStorage
- Game codes: WORD-NNNN format (e.g. CHAT-4821)
- Guesses are verbal in v1 — no real-time sync yet

## Post-v1 TODO (do not implement, just flag)
- [ ] Real-time guess sync via Supabase Realtime
- [ ] Custom word packs
- [ ] Persistent accounts
- [ ] Lexique383 full import (~5-10k words)
- [ ] Mobile app
