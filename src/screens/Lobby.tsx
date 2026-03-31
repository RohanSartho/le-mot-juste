import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { joinSession, startGame } from '../lib/sessions'
import { fetchWordPool, pickNextWordId } from '../lib/words'
import { useSessionStore } from '../stores/sessionStore'
import type { GameSession } from '../types'
import GameScreen from './GameScreen'
import EndGameScreen from './EndGameScreen'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, playerName, setSession, setPlayerName, isHost } = useSessionStore()

  const [pageState, setPageState] = useState<'loading' | 'join' | 'lobby' | 'playing' | 'finished' | 'error'>('loading')
  const [nameInput, setNameInput] = useState(playerName)
  const [joining, setJoining] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const initialised = useRef(false)

  useEffect(() => {
    if (!code) { setPageState('error'); setError('Code invalide'); return }

    const unsub = onSnapshot(
      doc(db, 'game_sessions', code),
      (snap) => {
        if (!snap.exists()) { setPageState('error'); setError('Partie introuvable ou expirée'); return }

        const s = snap.data() as GameSession
        setSession(s)

        if (s.status === 'finished') { setPageState('finished'); return }
        if (s.status === 'playing') { setPageState('playing'); return }

        if (!initialised.current) {
          initialised.current = true
          const alreadyIn = !!(playerName && playerName in s.scores)
          setPageState(alreadyIn ? 'lobby' : 'join')
        }
      },
      (err) => {
        console.error('[Lobby] snapshot error:', err)
        setPageState('error')
        setError('Erreur de connexion — vérifie ta connexion internet')
      }
    )

    return () => { unsub(); initialised.current = false }
  }, [code])

  async function handleJoin() {
    if (!nameInput.trim()) { setError('Entre ton prénom'); return }
    if (!code) return
    setJoining(true)
    setError('')
    try {
      const updated = await joinSession(code, nameInput.trim())
      setPlayerName(nameInput.trim())
      setSession(updated)
      setPageState('lobby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de rejoindre')
    } finally {
      setJoining(false)
    }
  }

  async function handleStart() {
    if (!code || !session) return
    setStarting(true)
    setError('')
    try {
      // Fetch word pool from Firestore, fall back to static list
      const wordPool = await fetchWordPool(session.settings)
      const players = Object.keys(session.scores)
      const firstDescriber = players[0]
      const firstWordId = pickNextWordId(wordPool, [])
      if (!firstWordId) throw new Error('Aucun mot disponible pour ces filtres')

      await startGame(code, firstWordId, firstDescriber, wordPool)
      // onSnapshot will fire for all devices
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de démarrer')
      setStarting(false)
    }
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-dvh bg-[#fdf7ef] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col flex-1">{children}</div>
    </div>
  )

  if (pageState === 'playing') return <GameScreen code={code!} />
  if (pageState === 'finished') return <EndGameScreen />

  if (pageState === 'loading') {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
        </div>
      </Shell>
    )
  }

  if (pageState === 'error') {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
          <p className="text-rose-500 text-center">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-stone-400 text-sm underline"
          >
            ← Retour
          </button>
        </div>
      </Shell>
    )
  }

  if (pageState === 'join') {
    return (
      <Shell>
        <div className="flex-1 flex flex-col justify-center px-5 gap-5">
          <div className="text-center">
            <p className="text-stone-400 text-xs uppercase tracking-widest mb-1">Rejoindre la partie</p>
            <h2 className="text-4xl font-black font-mono tracking-widest text-stone-900">{code}</h2>
            {session && (
              <p className="text-stone-400 text-sm mt-1">Organisée par {session.host_name}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl px-4 py-3 border border-amber-100 shadow-sm">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1.5">
              Ton prénom
            </label>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ex. Marie"
              autoFocus
              className="w-full bg-transparent text-stone-900 text-base font-medium placeholder-stone-300 focus:outline-none"
            />
          </div>

          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
        </div>

        <div className="px-5 pb-8 pt-3">
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {joining ? 'Connexion...' : 'Rejoindre →'}
          </button>
        </div>
      </Shell>
    )
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  const players = session ? Object.entries(session.scores) : []
  const expectedCount = session?.settings.max_players ?? '?'

  return (
    <Shell>
      <div className="flex-1 overflow-y-auto px-5 py-8 space-y-4">

        {/* Game code */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Code de la partie</p>
          <h2 className="text-5xl font-black font-mono tracking-widest text-stone-900">{code}</h2>
          <p className="text-stone-400 text-sm">Partage ce code à tes amis</p>
        </div>

        {/* Players list */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Joueurs</p>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {players.length} / {expectedCount}
            </span>
          </div>
          <ul className="space-y-2.5">
            {players.map(([name]) => (
              <li key={name} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className={`flex-1 text-sm ${name === playerName ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                  {name}
                </span>
                {name === session?.host_name && (
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">host</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Settings summary */}
        {session && (
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Paramètres</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-stone-400">Mots / tour</span>
              <span className="font-semibold text-stone-700">{session.settings.words_per_round}</span>
              <span className="text-stone-400">Manches</span>
              <span className="font-semibold text-stone-700">{session.settings.rounds}</span>
              <span className="text-stone-400">Timer</span>
              <span className="font-semibold text-stone-700">{session.settings.timer_seconds}s</span>
              <span className="text-stone-400">Difficulté</span>
              <span className="font-semibold text-stone-700">
                {session.settings.difficulty === 'all' ? 'Tous niveaux' : session.settings.difficulty}
              </span>
              <span className="text-stone-400">Tabou</span>
              <span className="font-semibold text-stone-700">{session.settings.taboo_enabled ? 'Activé' : 'Désactivé'}</span>
            </div>
          </div>
        )}

        {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
      </div>

      <div className="px-5 pb-8 pt-3">
        {isHost() ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || players.length < 2}
            className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {starting ? 'Démarrage...' : players.length < 2 ? 'En attente de joueurs…' : 'Démarrer la partie →'}
          </button>
        ) : (
          <div className="h-14 flex items-center justify-center">
            <p className="text-stone-400 text-sm text-center">
              En attente de <span className="font-semibold text-stone-600">{session?.host_name}</span>…
            </p>
          </div>
        )}
      </div>
    </Shell>
  )
}
