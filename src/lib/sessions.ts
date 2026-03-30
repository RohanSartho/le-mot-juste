import { supabase } from './supabase'
import type { GameSession, GameSettings } from '../types'
import { generateGameCode } from './gameCode'

export async function createSession(
  hostName: string,
  settings: GameSettings
): Promise<GameSession> {
  const id = generateGameCode()

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      id,
      host_name: hostName,
      status: 'lobby',
      scores: { [hostName]: 0 }, // host is automatically the first player
      settings,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as GameSession
}

export async function getSession(code: string): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', code)
    .single()

  if (error) return null
  return data as GameSession
}

export async function joinSession(
  code: string,
  playerName: string
): Promise<GameSession> {
  // Fetch current scores then merge — acceptable race condition for v1 lobby sizes
  const session = await getSession(code)
  if (!session) throw new Error('Session not found or expired')
  if (session.status !== 'lobby') throw new Error('Game has already started')

  const newScores = { ...session.scores, [playerName]: 0 }

  const { data, error } = await supabase
    .from('game_sessions')
    .update({ scores: newScores })
    .eq('id', code)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as GameSession
}

export async function startGame(code: string): Promise<void> {
  const { error } = await supabase
    .from('game_sessions')
    .update({ status: 'playing' })
    .eq('id', code)

  if (error) throw new Error(error.message)
}
