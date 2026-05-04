import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { GameSession, GameSettings, GameStatus } from '../types'
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
    used_word_ids: [],
    rounds_played: 0,
    words_this_turn: 0,
    word_pool: [],
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Connexion lente — réessaie dans quelques secondes')), 30000)
  )
  await Promise.race([setDoc(doc(db, 'game_sessions', id), session), timeout])
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

// Host calls this after fetching the word pool — sets status to playing
export async function startGame(
  code: string,
  firstWordId: string,
  firstDescriber: string,
  wordPool: string[],
): Promise<void> {
  await updateDoc(doc(db, 'game_sessions', code), {
    status: 'playing',
    current_word_id: firstWordId,
    current_describer: firstDescriber,
    word_pool: wordPool,
    used_word_ids: [firstWordId],
    rounds_played: 0,
    words_this_turn: 0,
  })
}

// Describer's device writes next game state after correct/skip/timeout
export async function advanceCard(
  code: string,
  nextWordId: string | null,
  scores: Record<string, number>,
  nextDescriber: string,
  usedWordIds: string[],
  roundsPlayed: number,
  wordsThisTurn: number,
  status: GameStatus = 'playing',
): Promise<void> {
  await updateDoc(doc(db, 'game_sessions', code), {
    current_word_id: nextWordId,
    scores,
    current_describer: nextDescriber,
    used_word_ids: usedWordIds,
    rounds_played: roundsPlayed,
    words_this_turn: wordsThisTurn,
    status,
  })
}

// Host resets session back to lobby for a rematch (same players, scores cleared)
export async function resetSession(code: string): Promise<void> {
  const session = await getSession(code)
  if (!session) return
  const clearedScores = Object.fromEntries(
    Object.keys(session.scores).map(name => [name, 0])
  )
  await updateDoc(doc(db, 'game_sessions', code), {
    status: 'lobby',
    current_word_id: null,
    current_describer: null,
    scores: clearedScores,
    used_word_ids: [],
    rounds_played: 0,
    words_this_turn: 0,
    word_pool: [],
  })
}

// Run on app start to clean up expired sessions (best-effort, no-throw)
export async function cleanExpiredSessions(): Promise<void> {
  try {
    const now = new Date().toISOString()
    const q = query(
      collection(db, 'game_sessions'),
      where('expires_at', '<', now)
    )
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  } catch {
    // Non-critical — silently ignore cleanup failures
  }
}
