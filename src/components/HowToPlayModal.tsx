import { useState } from 'react'

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const [lang, setLang] = useState<'en' | 'fr'>('en')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-200 p-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-stone-900">
            {lang === 'en' ? '🎭 How to Play' : '🎭 Comment Jouer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-stone-400 hover:text-stone-600 active:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Language toggle */}
        <div className="border-b border-stone-200 px-5 py-3 flex gap-2">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              lang === 'en'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('fr')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              lang === 'fr'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            Français
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm text-stone-700">
          {lang === 'en' ? (
            <>
              <section>
                <h3 className="font-bold text-stone-900 mb-2">🎮 The Goal</h3>
                <p>
                  Guess French words while your teammate describes them — using only French sentences.
                  Like Taboo, but for language learning.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">📝 How to Create a Game</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter your name on the home screen</li>
                  <li>Choose your settings (difficulty, number of rounds, timer)</li>
                  <li>Tap "Créer la partie" (Create Game)</li>
                  <li>Share the game code with friends or play solo</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🔗 How to Join a Game</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the "Rejoindre" (Join) tab on the home screen</li>
                  <li>Enter your name</li>
                  <li>Enter the game code (e.g., CHAT-4821)</li>
                  <li>Tap "Rejoindre →" to join</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🎯 During the Game</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Describer:</strong> You see a French word. Describe it in French without
                    saying the forbidden words.
                  </li>
                  <li>
                    <strong>Others:</strong> Listen and shout out your guesses. Call out loud — the
                    describer will tell you if you're right.
                  </li>
                  <li>Use hints (💡) if you get stuck — they help teammates guess but cost points</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">✅ Marking Answers</h3>
                <p>
                  <strong>Describer:</strong> After your teammate guesses correctly, tap
                  <em> Correct</em> to mark it. Tap <em>Skip</em> to move to the next word.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🏆 Scoring</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>+2 points for each correct guess (describer only)</li>
                  <li>+1 point if a hint was used</li>
                  <li>0 points for passed words</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">💡 Pro Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Describe the word's meaning, not the word itself</li>
                  <li>Use simple French sentences everyone understands</li>
                  <li>Give hints gradually — don't reveal the answer too early</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-stone-900 mb-2">🎮 L'Objectif</h3>
                <p>
                  Devinez des mots français tandis que votre coéquipier les décrit — en utilisant
                  uniquement des phrases en français. Comme le Tabou, mais pour l'apprentissage du français.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">📝 Comment Créer une Partie</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Entrez votre prénom sur l'écran d'accueil</li>
                  <li>Choisissez vos paramètres (difficulté, nombre de tours, minuteur)</li>
                  <li>Appuyez sur "Créer la partie"</li>
                  <li>Partagez le code avec des amis ou jouez en solo</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🔗 Comment Rejoindre une Partie</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cliquez sur l'onglet "Rejoindre" sur l'écran d'accueil</li>
                  <li>Entrez votre prénom</li>
                  <li>Entrez le code de la partie (ex. CHAT-4821)</li>
                  <li>Appuyez sur "Rejoindre →" pour rejoindre</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🎯 Pendant la Partie</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Descripteur :</strong> Vous voyez un mot français. Décrivez-le en français
                    sans dire les mots interdits.
                  </li>
                  <li>
                    <strong>Les autres :</strong> Écoutez et criez vos devinettes. Cri loud — le
                    descripteur vous dira si vous avez raison.
                  </li>
                  <li>Utilisez les indices (💡) si vous êtes bloqué — ils aident mais coûtent des points</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">✅ Marquer les Réponses</h3>
                <p>
                  <strong>Descripteur :</strong> Après que votre coéquipier ait deviné correctement,
                  appuyez sur <em>Correct</em> pour le marquer. Appuyez sur <em>Passer</em> pour passer
                  au mot suivant.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">🏆 Notation</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>+2 points pour chaque devinette correcte (descripteur uniquement)</li>
                  <li>+1 point si un indice a été utilisé</li>
                  <li>0 point pour les mots passés</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-stone-900 mb-2">💡 Conseils Pratiques</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Décrivez le sens du mot, pas le mot lui-même</li>
                  <li>Utilisez des phrases françaises simples que tout le monde comprend</li>
                  <li>Donnez les indices progressivement — ne révélez pas la réponse trop tôt</li>
                </ul>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-stone-200 bg-stone-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            {lang === 'en' ? 'Got it!' : 'Compris !'}
          </button>
        </div>
      </div>
    </div>
  )
}
