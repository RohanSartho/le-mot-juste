// Short French words used as the word-prefix in game codes (e.g. CHAT-4821)
const CODE_WORDS = [
  'CHAT', 'LOUP', 'CERF', 'OURS', 'CHOU',
  'DUNE', 'FETE', 'GARE', 'HOUX', 'IRIS',
  'JOIE', 'KIWI', 'LUNE', 'MARE', 'NOIX',
  'ROSE', 'SAGE', 'TOUR', 'VEAU', 'PAON',
]

export function generateGameCode(): string {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}-${num}`
}
