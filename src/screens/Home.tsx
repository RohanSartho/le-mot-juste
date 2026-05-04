import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../lib/sessions'
import { useSessionStore } from '../stores/sessionStore'
import { CATEGORIES } from '../lib/words'
import HowToPlayModal from '../components/HowToPlayModal'
import { Subtitle } from '../components/Subtitle'
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

const CATEGORY_EN: Record<string, string> = {
  'Food & places': 'Food & places',
  'Animals':       'Animals',
  'Objects':       'Objects',
  'Travel':        'Travel',
  'Emotions':      'Emotions',
  'Verbs':         'Verbs',
  'Nature':        'Nature',
  'Clothing':      'Clothing',
}

const DIFFICULTY_EN: Record<string, string> = {
  'all': 'All',
  'easy': 'Easy',
  'medium': 'Medium',
  'hard': 'Hard',
}

const DEFAULT_SETTINGS: GameSettings = {
  categories: [],
  difficulty: 'all',
  rounds: 1,
  words_per_round: 5,
  timer_seconds: 60,
  taboo_enabled: false,
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
function Row({ label, english, children }: { label: string; english?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <div>
        <span className="text-sm font-semibold text-stone-700 shrink-0 block">{label}</span>
        {english && <span className="text-xs text-gray-400">{english}</span>}
      </div>
      <div className="flex gap-1.5">{children}</div>
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
  const [showHowToPlay, setShowHowToPlay] = useState(false)

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
      <style>{`
        @keyframes radiate {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
        .animate-radiate {
          animation: radiate 2s infinite;
        }
      `}</style>
      <div className="w-full max-w-sm flex flex-col flex-1">

        {/* Header */}
        <div className="text-center pt-10 pb-5 px-5 relative">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="absolute top-10 right-5 w-10 h-10 flex items-center justify-center text-xl rounded-full transition-colors active:scale-95 animate-pulse animate-radiate"
            title="How to play"
          >
            ❓
          </button>
          <h1 className="text-4xl font-black text-stone-900 tracking-tighter">🇫🇷 Le Mot Juste</h1>
          <Subtitle french="Charades en français" english="French charades game" />
        </div>

        {/* Tab switcher */}
        <div className="px-5 mb-4">
          <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab('create'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-all ${
                tab === 'create' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
              }`}
            >
              <div>Créer</div>
              <div className="text-[11px] text-gray-400">Create</div>
            </button>
            <button
              type="button"
              onClick={() => { setTab('join'); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-base font-bold transition-all ${
                tab === 'join' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
              }`}
            >
              <div>Rejoindre</div>
              <div className="text-[11px] text-gray-400">Join</div>
            </button>
          </div>
        </div>

        {/* Scrollable content — pb-6 is enough, button lives outside this div */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2.5 pb-6">

          {/* Name */}
          <div className="bg-white rounded-2xl px-4 py-3 border border-amber-100 shadow-sm">
            <Subtitle french="Ton prénom" english="Your name" className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 text-left" smaller />
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
              <Subtitle french="Code de la partie" english="Game code" className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 text-left" smaller />
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
              <Row label="Mots / tour" english="Words per round">
                {[3, 5, 7].map(n => (
                  <Pill key={n} active={settings.words_per_round === n} onClick={() => set('words_per_round', n)}>{n}</Pill>
                ))}
              </Row>

              <Row label="Manches" english="Rounds">
                {[1, 2, 3].map(n => (
                  <Pill key={n} active={settings.rounds === n} onClick={() => set('rounds', n)}>{n}</Pill>
                ))}
              </Row>

              <Row label="Timer" english="Timer (seconds)">
                {([10, 20, 40, 60] as const).map(s => (
                  <Pill key={s} active={settings.timer_seconds === s} onClick={() => set('timer_seconds', s)}>{s}s</Pill>
                ))}
              </Row>

              <Row label="Joueurs" english="Players">
                <select
                  value={settings.max_players}
                  onChange={e => set('max_players', Number(e.target.value))}
                  className="bg-stone-100 rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 focus:outline-none"
                >
                  <option value={1}>Solo</option>
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} joueurs</option>
                  ))}
                </select>
              </Row>

              {/* Difficulté — 4 equal columns */}
              <div className="py-3 space-y-2">
                <div>
                  <span className="text-sm font-semibold text-stone-700 block">Difficulté</span>
                  <span className="text-xs text-gray-400">Difficulty</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['all', 'easy', 'medium', 'hard'] as const).map(d => {
                    const frenchName = d === 'all' ? 'Tous' : d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Dur'
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set('difficulty', d)}
                        className={`py-2 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 text-center flex flex-col items-center ${
                          settings.difficulty === d ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <div>{frenchName}</div>
                        <div className={`text-[10px] ${settings.difficulty === d ? 'text-gray-300' : 'text-gray-400'}`}>
                          {DIFFICULTY_EN[d]}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Catégories — 2 equal columns */}
              <div className="py-3 space-y-2">
                <div>
                  <span className="text-sm font-semibold text-stone-700 block">
                    Catégories <span className="text-xs text-stone-400 font-normal ml-1.5">(toutes si vide)</span>
                  </span>
                  <span className="text-xs text-gray-400">Categories (all if empty)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`py-2 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 text-center flex flex-col items-center ${
                        settings.categories.includes(cat) ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <div>{CATEGORY_FR[cat] ?? cat}</div>
                      <div className={`text-[10px] ${settings.categories.includes(cat) ? 'text-gray-300' : 'text-gray-400'}`}>
                        {CATEGORY_EN[cat] ?? cat}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Taboo toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700 block">Mode Tabou</p>
                    <p className="text-xs text-gray-400">Taboo Mode</p>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-stone-400 block">Mots interdits visibles</p>
                    <p className="text-[10px] text-gray-400">Show forbidden words</p>
                  </div>
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
              className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
            >
              <div>
                <div>{loading ? 'Création...' : 'Créer la partie →'}</div>
                {!loading && <div className="text-xs text-gray-400">Create game</div>}
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform flex items-center justify-center"
            >
              <div>
                <div>Rejoindre →</div>
                <div className="text-xs text-gray-400">Join game</div>
              </div>
            </button>
          )}
        </div>

      </div>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  )
}
