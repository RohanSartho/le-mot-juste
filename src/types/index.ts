export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'lobby' | 'playing' | 'finished'

export interface Word {
  id: string
  word: string
  category: string
  difficulty: Difficulty
  forbidden_words: string[]
  hints: string[]
  language: string
  frequency_rank: number | null
  created_at: string
}

export interface GameSettings {
  categories: string[]
  difficulty: Difficulty | 'all'
  rounds: number
  timer_seconds: number
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
}

// Derived type — used in UI only, not stored in DB
export interface Player {
  name: string
  score: number
  isHost: boolean
}
