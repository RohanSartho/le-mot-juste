import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../lib/sessions'
import { useSessionStore } from '../stores/sessionStore'
import { CATEGORIES } from '../lib/words'
import type { GameSettings } from '../types'

const CATEGORY_FR: Record<string, string> = {
  'Food & places': 'Nourriture',
  'Animals':       'Animaux',
  'Objects':       'Objets',
  'Travel':        'Voyage',
  'Emotions':      'Émotions',
  'Verbs':         'Verbes',
  'Nature':        'Nature',
  'Clothing':      'Vêtements',
}

const DEFAULT_SETTINGS: GameSettings = {
  categories: [],
  difficulty: 'all',
  rounds: 1,
  words_per_round: 5,
  timer_seconds: 60,
  taboo_enabled: true,
  max_players: 2,
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3.5 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 whitespace-nowrap ${
        active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
      }`}
    >
      {children}
    </button>
  )
}

// Inline row: label on left, controls on right
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <span className="text-sm font-semibold text-stone-700 shrink-0">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  )
}

// Stacked: label on top, options wrap below
function Block({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="py-3 space-y-2">
      <span className="text-sm font-semibold text-stone-700">
        {label}{sub && <span className="text-xs text-stone-400 font-normal ml-1.5">{sub}</span>}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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
        <div className="text-center pt-10 pb-5 px-5">
          <h1 className="text-4xl font-black text-stone-900 tracking-tighter">Le Mot Juste</h1>
          <p className="text-stone-400 text-sm mt-1 font-medium">Charades en français</p>
        </div>

        {/* Tab switcher */}
        <div className="px-5 mb-4">
          <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab('create'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'create' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
              }`}
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => { setTab('join'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'join' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
              }`}
            >
              Rejoindre
            </button>
          </div>
        </div>

        {/* Scrollable content — pb-6 is enough, button lives outside this div */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2.5 pb-6">

          {/* Name */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-amber-100 shadow-sm">
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
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
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
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
            <div className="bg-white rounded-2xl px-4 border border-amber-100 shadow-sm divide-y divide-stone-100">

              {/* Inline rows — label + pills fit on one line */}
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

              {/* Difficulté — 4 equal columns */}
              <div className="py-3 space-y-2">
                <span className="text-sm font-semibold text-stone-700">Difficulté</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('difficulty', d)}
                      className={`py-2 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 text-center ${
                        settings.difficulty === d ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {d === 'all' ? 'Tous' : d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Dur'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégories — 2 equal columns */}
              <div className="py-3 space-y-2">
                <span className="text-sm font-semibold text-stone-700">
                  Catégories <span className="text-xs text-stone-400 font-normal ml-1.5">(toutes si vide)</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`py-2 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 text-center ${
                        settings.categories.includes(cat) ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {CATEGORY_FR[cat] ?? cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taboo toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-stone-700">Mode Tabou</p>
                  <p className="text-xs text-stone-400 mt-0.5">Mots interdits visibles</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('taboo_enabled', !settings.taboo_enabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    settings.taboo_enabled ? 'bg-stone-800' : 'bg-stone-200'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    settings.taboo_enabled ? 'left-5' : 'left-0.5'
                  }`} />
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
              className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la partie →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform"
            >
              Rejoindre →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
