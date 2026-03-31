import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../lib/sessions'
import { useSessionStore } from '../stores/sessionStore'
import { CATEGORIES } from '../lib/words'

const CATEGORY_FR: Record<string, string> = {
  'Food & places': 'Nourriture & lieux',
  'Animals':       'Animaux',
  'Objects':       'Objets',
  'Travel':        'Voyage',
  'Emotions':      'Émotions',
  'Verbs':         'Verbes',
  'Nature':        'Nature',
  'Clothing':      'Vêtements',
}
import type { GameSettings } from '../types'

const DEFAULT_SETTINGS: GameSettings = {
  categories: [],
  difficulty: 'all',
  rounds: 1,
  words_per_round: 5,
  timer_seconds: 60,
  taboo_enabled: true,
  max_players: 4,
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
        active
          ? 'bg-stone-800 text-white'
          : 'bg-stone-100 text-stone-500'
      }`}
    >
      {children}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm font-medium text-stone-600 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5 justify-end">{children}</div>
    </div>
  )
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

  function set<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  function toggleCategory(cat: string) {
    setSettings(s => ({
      ...s,
      categories: s.categories.includes(cat)
        ? s.categories.filter(c => c !== cat)
        : [...s.categories, cat],
    }))
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Entre ton prénom'); return }
    setLoading(true)
    setError('')
    try {
      const session = await createSession(name.trim(), settings)
      setPlayerName(name.trim())
      setSession(session)
      navigate(`/game/${session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  function handleJoin() {
    if (!name.trim()) { setError('Entre ton prénom'); return }
    if (!joinCode.trim()) { setError('Entre le code de la partie'); return }
    setPlayerName(name.trim())
    navigate(`/game/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-dvh bg-[#fdf7ef] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col flex-1">

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-5">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Le Mot Juste</h1>
          <p className="text-stone-400 text-xs mt-0.5">Charades en français</p>
        </div>

        {/* Tab switcher */}
        <div className="px-5 mb-3">
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab('create'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'create' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => { setTab('join'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'join' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              Rejoindre
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2.5 pb-28">

          {/* Name field */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-amber-100 shadow-sm">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
              Ton prénom
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              placeholder="ex. Marie"
              autoFocus
              className="w-full bg-transparent text-stone-900 text-base font-medium placeholder-stone-300 focus:outline-none"
            />
          </div>

          {tab === 'join' && (
            <div className="bg-white rounded-2xl px-4 py-3 border border-amber-100 shadow-sm">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
                Code de la partie
              </label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="ex. CHAT-4821"
                className="w-full bg-transparent text-stone-900 text-base font-mono font-semibold tracking-widest placeholder-stone-300 focus:outline-none"
              />
            </div>
          )}

          {tab === 'create' && (
            /* Single settings card with dividers — much tighter than separate cards */
            <div className="bg-white rounded-2xl px-4 border border-amber-100 shadow-sm divide-y divide-stone-100">

              <Row label="Mots / tour">
                {[3, 5, 7].map(n => (
                  <Pill key={n} active={settings.words_per_round === n} onClick={() => set('words_per_round', n)}>{n}</Pill>
                ))}
              </Row>

              <Row label="Manches">
                {[1, 2, 3].map(n => (
                  <Pill key={n} active={settings.rounds === n} onClick={() => set('rounds', n)}>{n}</Pill>
                ))}
              </Row>

              <Row label="Timer">
                {([10, 20, 40, 60] as const).map(s => (
                  <Pill key={s} active={settings.timer_seconds === s} onClick={() => set('timer_seconds', s)}>{s}s</Pill>
                ))}
              </Row>

              <Row label="Joueurs">
                <select
                  value={settings.max_players}
                  onChange={e => set('max_players', Number(e.target.value))}
                  className="bg-stone-100 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} joueurs</option>
                  ))}
                </select>
              </Row>

              <Row label="Difficulté">
                {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                  <Pill key={d} active={settings.difficulty === d} onClick={() => set('difficulty', d)}>
                    {d === 'all' ? 'Tous' : d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}
                  </Pill>
                ))}
              </Row>

              {/* Categories — full width row */}
              <div className="py-2.5 space-y-2">
                <span className="text-sm font-medium text-stone-600">
                  Catégories <span className="text-xs text-stone-300 font-normal">(toutes si vide)</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <Pill key={cat} active={settings.categories.includes(cat)} onClick={() => toggleCategory(cat)}>
                      {CATEGORY_FR[cat] ?? cat}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Taboo toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-stone-600">Mode Tabou</p>
                  <p className="text-xs text-stone-400">Mots interdits visibles</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('taboo_enabled', !settings.taboo_enabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    settings.taboo_enabled ? 'bg-stone-800' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      settings.taboo_enabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

            </div>
          )}

          {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
        </div>

        {/* Sticky CTA */}
        <div className="px-5 pb-8 pt-3 bg-[#fdf7ef] border-t border-stone-100">
          {tab === 'create' ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full h-13 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la partie →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              className="w-full h-13 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform"
            >
              Rejoindre →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
