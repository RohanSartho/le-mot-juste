import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../stores/sessionStore'
import { resetSession } from '../lib/sessions'
import { Subtitle } from '../components/Subtitle'

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
          <Subtitle french="Fin du jeu !" english="Game Over!" className="text-3xl font-black text-stone-900" />
          {winner && (
            <>
              <Subtitle french="Félicitations à" english="Congratulations to" className="text-stone-500 text-sm" />
              <p className="text-2xl font-black text-amber-700">{winner[0]}</p>
              <p className="text-stone-400 text-sm font-medium">
                <div>{winner[1]} point{winner[1] !== 1 ? 's' : ''}</div>
                <div className="text-gray-400">{winner[1]} point{winner[1] !== 1 ? 's' : ''}</div>
              </p>
            </>
          )}
        </div>

        {/* Score list */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <Subtitle french="Classement final" english="Final Rankings" className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4" />
          <ul className="space-y-3">
            {ranked.map(([name, score], i) => (
              <li key={name} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{MEDALS[i] ?? `${i + 1}`}</span>
                <div className={`flex-1 text-base ${name === playerName ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                  <div>{name}</div>
                  {name === playerName && (
                    <div className="text-xs text-gray-400">(you)</div>
                  )}
                </div>
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
            className="w-full h-14 bg-stone-900 text-white rounded-2xl text-base font-bold active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            <div>
              <div>Rejouer (mêmes joueurs) →</div>
              <div className="text-xs text-gray-400">Play again (same players)</div>
            </div>
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className={`w-full h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform flex items-center justify-center ${
            isHost()
              ? 'bg-stone-100 text-stone-600'
              : 'bg-stone-900 text-white'
          }`}
        >
          <div>
            <div>Nouvelle partie →</div>
            <div className={`text-xs ${isHost() ? 'text-gray-400' : 'text-gray-400'}`}>New game</div>
          </div>
        </button>
      </div>
    </div>{/* max-w-sm */}
    </div>
  )
}
