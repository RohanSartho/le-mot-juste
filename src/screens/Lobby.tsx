import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { joinSession, startGame } from '../lib/sessions'
import { useSessionStore } from '../stores/sessionStore'
import type { GameSession } from '../types'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, playerName, setSession, setPlayerName, isHost } = useSessionStore()

  const [pageState, setPageState] = useState<'loading' | 'join' | 'lobby' | 'playing' | 'error'>('loading')
  const [nameInput, setNameInput] = useState(playerName)
  const [joining, setJoining] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Track whether we've set the initial page view — subsequent snapshots
  // should update session data without resetting which screen is shown
  const initialised = useRef(false)

  useEffect(() => {
    if (!code) {
      setPageState('error')
      setError('Invalid game code')
      return
    }

    // onSnapshot handles both initial load AND real-time updates in one subscription
    const unsub = onSnapshot(
      doc(db, 'game_sessions', code),
      (snap) => {
        if (!snap.exists()) {
          setPageState('error')
          setError('Game not found or expired')
          return
        }

        const s = snap.data() as GameSession
        setSession(s)

        // Game started — Phase 3 will replace this placeholder
        if (s.status === 'playing' || s.status === 'finished') {
          setPageState('playing')
          return
        }

        // Only decide join vs lobby on the first snapshot
        if (!initialised.current) {
          initialised.current = true
          const alreadyIn = !!(playerName && playerName in s.scores)
          setPageState(alreadyIn ? 'lobby' : 'join')
        }
        // Subsequent snapshots (other players joining) just update session via setSession above
      },
      (err) => {
        console.error('[Lobby] snapshot error:', err)
        setPageState('error')
        setError('Connection error — check your internet and try again')
      }
    )

    return () => {
      unsub()
      initialised.current = false
    }
  }, [code])

  async function handleJoin() {
    if (!nameInput.trim()) { setError('Enter your name'); return }
    if (!code) return
    setJoining(true)
    setError('')
    try {
      const updated = await joinSession(code, nameInput.trim())
      setPlayerName(nameInput.trim())
      setSession(updated)
      setPageState('lobby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join game')
    } finally {
      setJoining(false)
    }
  }

  async function handleStart() {
    if (!code) return
    setStarting(true)
    setError('')
    try {
      await startGame(code)
      // onSnapshot will fire for other players — host transitions immediately
      setPageState('playing')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start game')
      setStarting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm underline">
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Game in progress — Phase 3 placeholder ───────────────────────────────
  if (pageState === 'playing') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-2xl font-bold">🎮 Game in progress</p>
          <p className="text-gray-400 text-sm">Game screen coming in Phase 3</p>
          <p className="text-gray-600 font-mono text-xs">{code}</p>
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white text-sm underline mt-4 block">
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Join form ────────────────────────────────────────────────────────────
  if (pageState === 'join') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-1">Joining game</p>
            <h2 className="text-4xl font-bold font-mono tracking-widest">{code}</h2>
            {session && (
              <p className="text-gray-500 text-sm mt-2">Hosted by {session.host_name}</p>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your name</label>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. Marie"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-white text-gray-950 font-semibold rounded-lg py-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {joining ? 'Joining...' : 'Join game →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Lobby ────────────────────────────────────────────────────────────────
  const players = session ? Object.entries(session.scores) : []

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Game code</p>
          <h2 className="text-4xl font-bold font-mono tracking-widest">{code}</h2>
          <p className="text-gray-500 text-sm mt-2">Share with friends to join</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            Players · {players.length}
          </p>
          <ul className="space-y-2">
            {players.map(([name]) => (
              <li key={name} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className={name === playerName ? 'font-semibold text-white' : 'text-gray-300'}>
                  {name}
                </span>
                {name === session?.host_name && (
                  <span className="ml-auto text-xs text-gray-600">host</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {session && (
          <div className="bg-gray-900 rounded-xl px-5 py-3 flex gap-4 text-sm text-gray-500">
            <span>{session.settings.difficulty === 'all' ? 'All levels' : session.settings.difficulty}</span>
            <span>·</span>
            <span>{session.settings.rounds} {session.settings.rounds === 1 ? 'round' : 'rounds'}</span>
            <span>·</span>
            <span>{session.settings.timer_seconds}s</span>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {isHost() ? (
          <button
            onClick={handleStart}
            disabled={starting || players.length < 1}
            className="w-full bg-white text-gray-950 font-semibold rounded-lg py-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {starting ? 'Starting...' : 'Start game →'}
          </button>
        ) : (
          <p className="text-center text-gray-500 text-sm py-3">
            Waiting for <span className="text-gray-300">{session?.host_name}</span> to start…
          </p>
        )}
      </div>
    </div>
  )
}
