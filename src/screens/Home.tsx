import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../lib/sessions'
import { useSessionStore } from '../stores/sessionStore'
import type { GameSettings } from '../types'

const DEFAULT_SETTINGS: GameSettings = {
  categories: [],   // empty = all categories
  difficulty: 'all',
  rounds: 3,
  timer_seconds: 60,
}

export default function Home() {
  const navigate = useNavigate()
  const { setSession, setPlayerName, playerName: savedName } = useSessionStore()

  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState(savedName)
  const [joinCode, setJoinCode] = useState('')
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    setError('')
    try {
      const session = await createSession(name.trim(), settings)
      setPlayerName(name.trim())
      setSession(session)
      navigate(`/game/${session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleJoin() {
    if (!name.trim()) { setError('Enter your name'); return }
    if (!joinCode.trim()) { setError('Enter a game code'); return }
    // Save name now — join form on the next screen will use it
    setPlayerName(name.trim())
    navigate(`/game/${joinCode.trim().toUpperCase()}`)
  }

  function switchTab(next: 'create' | 'join') {
    setTab(next)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight mb-2">Le Mot Juste</h1>
          <p className="text-gray-400">French vocabulary charades</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-gray-900 p-1 mb-4">
          <button
            onClick={() => switchTab('create')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'create' ? 'bg-white text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            Create game
          </button>
          <button
            onClick={() => switchTab('join')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'join' ? 'bg-white text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            Join game
          </button>
        </div>

        {/* Form card */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">

          {/* Name — shared between both tabs */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              placeholder="e.g. Marie"
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
            />
          </div>

          {tab === 'create' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                <select
                  value={settings.difficulty}
                  onChange={e => setSettings(s => ({ ...s, difficulty: e.target.value as GameSettings['difficulty'] }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="all">All levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Rounds</label>
                <select
                  value={settings.rounds}
                  onChange={e => setSettings(s => ({ ...s, rounds: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gray-500 transition-colors"
                >
                  {[1, 2, 3, 5, 7].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'round' : 'rounds'}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-white text-gray-950 font-semibold rounded-lg py-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create game →'}
              </button>
            </>
          )}

          {tab === 'join' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Game code</label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. CHAT-4821"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 font-mono tracking-widest transition-colors"
                />
              </div>

              <button
                onClick={handleJoin}
                className="w-full bg-white text-gray-950 font-semibold rounded-lg py-3 hover:bg-gray-100 transition-colors"
              >
                Join game →
              </button>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}
