import { create } from 'zustand'
import type { GameSession } from '../types'

interface SessionState {
  session: GameSession | null
  playerName: string
  setSession: (session: GameSession | null) => void
  setPlayerName: (name: string) => void
  // Derived: true if current player is the session host
  isHost: () => boolean
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  // Restore name from localStorage so returning players don't re-type it
  playerName: localStorage.getItem('moteur_player_name') ?? '',

  setSession: (session) => set({ session }),

  setPlayerName: (playerName) => {
    localStorage.setItem('moteur_player_name', playerName)
    set({ playerName })
  },

  isHost: () => {
    const { session, playerName } = get()
    return !!session && session.host_name === playerName
  },
}))
