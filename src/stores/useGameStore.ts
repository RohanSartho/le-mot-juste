import { create } from 'zustand'

// Host-authoritative game state. Only the host writes to Firestore;
// all clients read current_describer + current_word_id from the session.
// If the host refreshes mid-game, usedWordIds resets (words may repeat) — acceptable in v1.

interface GameStore {
  playerOrder: string[]
  currentDescriberIndex: number
  roundsPlayed: number    // increments each time the full player rotation completes
  usedWordIds: string[]

  init: (players: string[]) => void
  // Advance describer index and return the new state so the caller can write to Firestore
  advance: () => { nextDescriberIndex: number; newRoundsPlayed: number }
  markUsed: (id: string) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  playerOrder: [],
  currentDescriberIndex: 0,
  roundsPlayed: 0,
  usedWordIds: [],

  init: (players) => set({
    playerOrder: players,
    currentDescriberIndex: 0,
    roundsPlayed: 0,
    usedWordIds: [],
  }),

  advance: () => {
    const { playerOrder, currentDescriberIndex, roundsPlayed } = get()
    const nextIndex = (currentDescriberIndex + 1) % playerOrder.length
    // A full rotation completed when we wrap back to 0
    const newRoundsPlayed = nextIndex === 0 ? roundsPlayed + 1 : roundsPlayed
    set({ currentDescriberIndex: nextIndex, roundsPlayed: newRoundsPlayed })
    return { nextDescriberIndex: nextIndex, newRoundsPlayed }
  },

  markUsed: (id) => set((s) => ({ usedWordIds: [...s.usedWordIds, id] })),

  reset: () => set({ playerOrder: [], currentDescriberIndex: 0, roundsPlayed: 0, usedWordIds: [] }),
}))
