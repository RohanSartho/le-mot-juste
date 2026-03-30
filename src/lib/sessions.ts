import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { GameSession, GameSettings } from '../types'
import { generateGameCode } from './gameCode'

export async function createSession(
  hostName: string,
  settings: GameSettings
): Promise<GameSession> {
  const id = generateGameCode()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  const session: GameSession = {
    id,
    host_name: hostName,
    status: 'lobby',
    current_word_id: null,
    current_describer: null,
    scores: { [hostName]: 0 },
    settings,
    created_at: now,
    expires_at: expiresAt,
  }

  await setDoc(doc(db, 'game_sessions', id), session)
  return session
}

export async function getSession(code: string): Promise<GameSession | null> {
  const snap = await getDoc(doc(db, 'game_sessions', code))
  if (!snap.exists()) return null
  return snap.data() as GameSession
}

export async function joinSession(
  code: string,
  playerName: string
): Promise<GameSession> {
  const session = await getSession(code)
  if (!session) throw new Error('Session not found or expired')
  if (session.status !== 'lobby') throw new Error('Game has already started')

  const newScores = { ...session.scores, [playerName]: 0 }
  await updateDoc(doc(db, 'game_sessions', code), { scores: newScores })
  return { ...session, scores: newScores }
}

export async function startGame(code: string): Promise<void> {
  await updateDoc(doc(db, 'game_sessions', code), { status: 'playing' })
}
