import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { fetchWordById, pickNextWordId } from '../lib/words'
import { awardPoints } from '../lib/scoring'
import { advanceCard } from '../lib/sessions'
import type { Word } from '../types'

interface Props { code: string }

function DifficultyDot({ d }: { d: Word['difficulty'] }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${
        d === 'easy' ? 'bg-emerald-500' : d === 'medium' ? 'bg-amber-400' : 'bg-rose-500'
      }`}
      title={d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}
    />
  )
}

export default function GameScreen({ code }: Props) {
  const { session, playerName } = useSessionStore()
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(session?.settings.timer_seconds ?? 60)
  const [hintUsed, setHintUsed] = useState(false)
  const [hintRevealed, setHintRevealed] = useState(false)
  const advancing = useRef(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const isDescriber = session?.current_describer === playerName

  // ── Fetch word whenever current_word_id changes ───────────────────────────
  const prevWordId = useRef<string | null>(null)
  useEffect(() => {
    if (!session?.current_word_id) return
    if (session.current_word_id === prevWordId.current) return
    prevWordId.current = session.current_word_id
    setTimeLeft(session.settings.timer_seconds)
    setHintUsed(false)
    setHintRevealed(false)
    fetchWordById(session.current_word_id).then(setCurrentWord)
  }, [session?.current_word_id])

  // ── Countdown — only the describer's device auto-skips ───────────────────
  useEffect(() => {
    if (timeLeft <= 0) {
      if (isDescriber && !advancing.current) handleAdvance(false)
      return
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, isDescriber])

  // ── Advance card — runs on describer's device ─────────────────────────────
  async function handleAdvance(correct: boolean) {
    if (!session || !isDescriber || advancing.current) return
    advancing.current = true
    setIsAdvancing(true)
    try {
      const players = Object.keys(session.scores)
      const dIdx = players.indexOf(session.current_describer!)

      // Score
      let newScores = { ...session.scores }
      if (correct) {
        if (players.length === 1) {
          // Solo mode — only the describer scores, flat +1
          newScores[session.current_describer!] = (newScores[session.current_describer!] ?? 0) + 1
        } else {
          const guesserName = players[(dIdx + 1) % players.length]
          newScores = awardPoints(newScores, session.current_describer!, guesserName, hintUsed)
        }
      }

      // words_this_turn: did this describer finish their allotted words?
      const newWordsThisTurn = session.words_this_turn + 1
      const rotate = newWordsThisTurn >= session.settings.words_per_round

      let nextDescriber = session.current_describer!
      let newRoundsPlayed = session.rounds_played
      let nextWordsThisTurn = newWordsThisTurn

      if (rotate) {
        nextDescriber = players[(dIdx + 1) % players.length]
        nextWordsThisTurn = 0
        // A full rotation completed when we wrap back to index 0
        if ((dIdx + 1) % players.length === 0) {
          newRoundsPlayed = session.rounds_played + 1
        }
      }

      // Game over?
      if (newRoundsPlayed >= session.settings.rounds) {
        await advanceCard(code, null, newScores, nextDescriber, session.used_word_ids, newRoundsPlayed, nextWordsThisTurn, 'finished')
        return
      }

      // Next word from pre-loaded pool
      const nextId = pickNextWordId(session.word_pool, session.used_word_ids)
      if (!nextId) {
        await advanceCard(code, null, newScores, nextDescriber, session.used_word_ids, newRoundsPlayed, nextWordsThisTurn, 'finished')
        return
      }

      await advanceCard(
        code, nextId, newScores, nextDescriber,
        [...session.used_word_ids, nextId],
        newRoundsPlayed, nextWordsThisTurn,
      )
    } finally {
      advancing.current = false
      setIsAdvancing(false)
    }
  }

  if (!session) return null

  const timerPct = (timeLeft / session.settings.timer_seconds) * 100
  const timerColor = timeLeft > session.settings.timer_seconds * 0.4
    ? 'bg-emerald-500'
    : timeLeft > session.settings.timer_seconds * 0.2
    ? 'bg-amber-400'
    : 'bg-rose-500'

  const wordsLeft = session.settings.words_per_round - session.words_this_turn
  const roundLabel = `Tour ${Math.min(session.rounds_played + 1, session.settings.rounds)} / ${session.settings.rounds}`

  // ── Shared top bar ────────────────────────────────────────────────────────
  const TopBar = (
    <div className="px-5 pt-5 pb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-stone-400">{roundLabel}</span>
        <span className={`text-lg font-black tabular-nums ${timeLeft <= 10 ? 'text-rose-600' : 'text-stone-700'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>
    </div>
  )

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-dvh bg-[#fdf7ef] flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col flex-1">{children}</div>
    </div>
  )

  // ── DESCRIBER VIEW ────────────────────────────────────────────────────────
  if (isDescriber) {
    return (
      <Shell>
        {TopBar}

        {/* Word indicator */}
        <div className="px-5 pb-2 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Mot <span className="font-bold text-stone-600">{session.words_this_turn + 1}</span> / {session.settings.words_per_round}
          </p>
          <p className="text-xs text-stone-500 font-medium">
            {session.current_describer} — c'est ton tour
          </p>
        </div>

        {/* Word card */}
        <div className="flex-1 px-5 flex flex-col justify-center gap-4">
          {currentWord ? (
            <div className="bg-white rounded-3xl p-6 shadow-md border border-amber-100 space-y-5">

              {/* Category + difficulty */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-3 py-1">
                  {currentWord.category}
                </span>
                <DifficultyDot d={currentWord.difficulty} />
              </div>

              {/* THE WORD */}
              <p className="text-6xl font-black text-stone-900 text-center leading-none py-3 break-words">
                {currentWord.word}
              </p>

              {/* Interdit */}
              {session.settings.taboo_enabled && currentWord.forbidden_words.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-2">
                    🚫 Interdit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.forbidden_words.map(w => (
                      <span key={w} className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1 font-medium">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Indices */}
              {currentWord.hints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
                    💡 Indices
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.hints.map(h => (
                      <span key={h} className="text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint question — revealed on demand, costs -1 pt each */}
              {currentWord.hint_question && (
                <div className="border-t border-stone-100 pt-4">
                  {hintRevealed ? (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1.5">
                        🪄 Question guide
                      </p>
                      <p className="text-sm text-violet-800 font-medium leading-snug">
                        {currentWord.hint_question}
                      </p>
                      <p className="text-xs text-violet-400 mt-2">−1 pt appliqué</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setHintRevealed(true); setHintUsed(true) }}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-violet-300 text-violet-500 text-sm font-semibold active:scale-95 [touch-action:manipulation]"
                    >
                      🪄 Révéler la question guide (−1 pt)
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 shadow-md border border-amber-100 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin mx-auto" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 pb-8 pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => handleAdvance(false)}
            disabled={isAdvancing}
            className="flex-1 h-16 bg-white border-2 border-stone-200 text-stone-600 rounded-2xl text-base font-bold active:scale-95 [touch-action:manipulation] shadow-sm disabled:opacity-40"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={() => handleAdvance(true)}
            disabled={isAdvancing}
            className="flex-[2] h-16 bg-emerald-600 text-white rounded-2xl text-base font-bold active:scale-95 [touch-action:manipulation] shadow-sm disabled:opacity-40"
          >
            ✓ Correct !
          </button>
        </div>
      </Shell>
    )
  }

  // ── GUESSER VIEW ──────────────────────────────────────────────────────────
  return (
    <Shell>
      {TopBar}

      <div className="flex-1 px-5 flex flex-col justify-center gap-4">

        {/* Who is describing */}
        <div className="bg-white rounded-3xl p-8 shadow-md border border-amber-100 text-center space-y-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Décrit par</p>
          <p className="text-4xl font-black text-stone-900">{session.current_describer}</p>
          <p className="text-stone-400 text-sm">Écoute et crie ta réponse !</p>
          <div className="pt-1">
            <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
              Mot {session.words_this_turn + 1} / {session.settings.words_per_round}
            </span>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Scores</p>
          <ul className="space-y-2.5">
            {Object.entries(session.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([name, score], i) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="text-xs text-stone-300 font-mono w-4">{i + 1}</span>
                  <span className={`flex-1 text-sm ${name === playerName ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                    {name}
                    {name === session.current_describer && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">🎤</span>
                    )}
                  </span>
                  <span className="font-black text-stone-700 tabular-nums">{score}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="px-5 pb-8 pt-2">
        <p className="text-center text-xs text-stone-400">{wordsLeft} mot{wordsLeft !== 1 ? 's' : ''} restant{wordsLeft !== 1 ? 's' : ''} pour {session.current_describer}</p>
      </div>
    </Shell>
  )
}
