import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../stores/sessionStore'
import { resetSession } from '../lib/sessions'

const MEDALS = ['🥇', '🥈', '🥉']

export default function EndGameScreen() {
  const navigate = useNavigate()
  const { session, playerName, isHost } = useSessionStore()

  if (!session) return null

  const ranked = Object.entries(session.scores).sort(([, a], [, b]) => b - a)
  const [winner] = ranked

  async function handlePlayAgain() {
    if (!session || !isHost()) return
    await resetSession(session.id)
    // onSnapshot in Lobby will pick up status='lobby'
  }

  return (
    <div className="min-h-dvh bg-[#fdf7ef] flex flex-col items-center">
    <div className="w-full max-w-sm flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto px-5 py-10 space-y-5">

        {/* Winner banner */}
        <div className="bg-white rounded-3xl p-7 shadow-md border border-amber-100 text-center space-y-2">
          <p className="text-5xl">🏆</p>
          <h1 className="text-3xl font-black text-stone-900">Fin du jeu !</h1>
          {winner && (
            <>
              <p className="text-stone-500 text-sm">Félicitations à</p>
              <p className="text-2xl font-black text-amber-700">{winner[0]}</p>
              <p className="text-stone-400 text-sm font-medium">{winner[1]} point{winner[1] !== 1 ? 's' : ''}</p>
            </>
          )}
        </div>

        {/* Score list */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Classement final</p>
          <ul className="space-y-3">
            {ranked.map(([name, score], i) => (
              <li key={name} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{MEDALS[i] ?? `${i + 1}`}</span>
                <span className={`flex-1 text-base ${name === playerName ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                  {name}
                  {name === playerName && (
                    <span className="ml-2 text-xs text-stone-400">(toi)</span>
                  )}
                </span>
                <span className="text-xl font-black text-stone-800 tabular-nums">{score}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isHost() && (
          <p className="text-center text-stone-400 text-sm">
            En attente de <span className="font-semibold text-stone-600">{session.host_name}</span> pour rejouer…
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-8 pt-3 space-y-3">
        {isHost() && (
          <button
            onClick={handlePlayAgain}
            className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform"
          >
            Rejouer (mêmes joueurs) →
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className={`w-full h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform ${
            isHost()
              ? 'bg-stone-100 text-stone-600'
              : 'bg-stone-900 text-white'
          }`}
        >
          Nouvelle partie →
        </button>
      </div>
    </div>{/* max-w-sm */}
    </div>
  )
}
