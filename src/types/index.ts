export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'lobby' | 'playing' | 'finished'

export interface Word {
  id: string
  word: string
  category: string
  difficulty: Difficulty
  forbidden_words: string[]
  hints: string[]
  hint_question: string   // open-ended coaching prompt — revealed on demand, costs points
  language: string
  frequency_rank: number | null
  created_at: string
}

export interface GameSettings {
  categories: string[]
  difficulty: Difficulty | 'all'
  rounds: number
  words_per_round: number       // how many words each describer does before rotating
  timer_seconds: 10 | 20 | 40 | 60
  taboo_enabled: boolean        // when false, forbidden words are hidden
  max_players: number           // visual indicator only — host sets expected player count
}

export interface GameSession {
  id: string
  host_name: string
  status: GameStatus
  current_word_id: string | null
  current_describer: string | null
  scores: Record<string, number>
  settings: GameSettings
  created_at: string
  expires_at: string
  used_word_ids: string[]
  rounds_played: number
  words_this_turn: number       // how many words the current describer has done this turn
  word_pool: string[]           // all eligible word IDs for this session, loaded at game start
}

// Derived type — used in UI only, not stored in DB
export interface Player {
  name: string
  score: number
  isHost: boolean
}
