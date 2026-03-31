/**
 * seed_lexique.cjs — Import 5,000 French words from Lexique4 into Firestore
 *
 * SETUP:
 * 1. Download Lexique4 TSV from http://www.lexique.org/?page_id=194
 *    → "Lexique4.tsv" (tab-separated, ~142k rows)
 * 2. Place it at: moteur/seed/Lexique4.tsv
 * 3. Copy .env.local keys into seed/.env  (same key names, no VITE_ prefix needed here
 *    since we init Firebase directly — or just set the vars inline below in firebaseConfig)
 * 4. Run: node seed/seed_lexique.cjs
 *
 * The script uploads in batches of 400 (Firestore max batch = 500).
 * Re-running is safe — uses word as the doc ID so duplicates overwrite.
 */

const fs = require('fs')
const path = require('path')
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore')

// ── Load env ──────────────────────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ── Category maps — words matching these lists get semantic categories ────
// Lists are lowercase, accents stripped for matching ease
const CATEGORY_LISTS = {
  'Animaux': [
    'chat', 'chien', 'oiseau', 'poisson', 'cheval', 'vache', 'mouton', 'cochon', 'lapin', 'souris',
    'rat', 'lion', 'tigre', 'éléphant', 'girafe', 'singe', 'serpent', 'grenouille', 'tortue', 'canard',
    'poule', 'coq', 'loup', 'renard', 'cerf', 'biche', 'sanglier', 'ours', 'aigle', 'hibou', 'corbeau',
    'perroquet', 'dauphin', 'baleine', 'requin', 'pieuvre', 'crabe', 'homard', 'papillon', 'abeille',
    'fourmi', 'mouche', 'moustique', 'araignée', 'ver', 'escargot', 'écureuil', 'hérisson', 'taupe',
    'chauve-souris', 'cigogne', 'flamant', 'manchot', 'pingouin', 'crocodile', 'alligator', 'hippo',
    'rhinocéros', 'zèbre', 'panthère', 'léopard', 'jaguar', 'guépard', 'puma', 'lynx', 'bison',
    'chameau', 'dromadaire', 'lama', 'alpaga', 'kangourou', 'koala', 'panda', 'gorille', 'chimpanzé',
    'âne', 'mulet', 'poney', 'taureau', 'boeuf', 'cochon', 'truie', 'agneau', 'veau', 'poussin',
  ],
  'Lieux & Nourriture': [
    'pain', 'fromage', 'vin', 'beurre', 'lait', 'oeuf', 'sucre', 'sel', 'farine', 'huile',
    'viande', 'poulet', 'boeuf', 'porc', 'poisson', 'légume', 'fruit', 'pomme', 'poire', 'banane',
    'orange', 'citron', 'fraise', 'cerise', 'raisin', 'tomate', 'pomme de terre', 'carotte', 'oignon',
    'ail', 'salade', 'soupe', 'fromage', 'gâteau', 'tarte', 'crêpe', 'biscuit', 'chocolat', 'café',
    'thé', 'eau', 'jus', 'bière', 'champagne', 'restaurant', 'boulangerie', 'épicerie', 'marché',
    'supermarché', 'café', 'brasserie', 'bistrot', 'cantine', 'cuisine', 'réfrigérateur', 'four',
    'casserole', 'assiette', 'verre', 'fourchette', 'couteau', 'cuillère', 'table', 'chaise',
  ],
  'Nature': [
    'soleil', 'lune', 'étoile', 'nuage', 'pluie', 'neige', 'vent', 'orage', 'arc-en-ciel', 'mer',
    'océan', 'rivière', 'lac', 'montagne', 'forêt', 'arbre', 'fleur', 'herbe', 'feuille', 'plante',
    'rocher', 'sable', 'plage', 'désert', 'volcan', 'île', 'jungle', 'prairie', 'champ', 'jardin',
    'ciel', 'horizon', 'vague', 'marée', 'avalanche', 'tremblement', 'tornade', 'tempête', 'brouillard',
    'givre', 'glace', 'glacier', 'cascade', 'fleuve', 'ruisseau', 'étang', 'colline', 'vallée', 'plaine',
    'grotte', 'falaise', 'dune', 'récif', 'forêt', 'bois', 'bosquet', 'savane', 'toundra', 'taïga',
  ],
  'Émotions': [
    'joie', 'tristesse', 'peur', 'colère', 'surprise', 'dégoût', 'amour', 'haine', 'jalousie',
    'fierté', 'honte', 'culpabilité', 'nostalgie', 'mélancolie', 'anxiété', 'stress', 'enthousiasme',
    'ennui', 'curiosité', 'espoir', 'désespoir', 'bonheur', 'malheur', 'rage', 'tendresse', 'douceur',
    'courage', 'lâcheté', 'confiance', 'méfiance', 'soulagement', 'frustration', 'impatience',
    'gratitude', 'admiration', 'indignation', 'compassion', 'envie', 'solitude', 'timidité',
  ],
  'Voyage': [
    'avion', 'train', 'voiture', 'bateau', 'bus', 'métro', 'vélo', 'moto', 'taxi', 'tramway',
    'aéroport', 'gare', 'port', 'hôtel', 'auberge', 'camping', 'valise', 'sac', 'passeport', 'billet',
    'visa', 'carte', 'guide', 'touriste', 'voyage', 'vacances', 'destination', 'itinéraire', 'escale',
    'décalage', 'frontière', 'douane', 'ambassade', 'consulat', 'croisière', 'safari', 'randonnée',
    'backpacker', 'résidence', 'appartement', 'chambre', 'réservation', 'excursion', 'circuit',
  ],
  'Objets': [
    'téléphone', 'ordinateur', 'télévision', 'radio', 'appareil', 'lampe', 'miroir', 'horloge',
    'montre', 'clé', 'serrure', 'porte', 'fenêtre', 'rideau', 'tapis', 'tableau', 'vase', 'bougie',
    'parapluie', 'sac', 'portefeuille', 'lunettes', 'chapeau', 'ceinture', 'bijou', 'bague', 'collier',
    'bracelet', 'stylo', 'cahier', 'livre', 'journal', 'enveloppe', 'timbre', 'machine', 'outil',
    'marteau', 'clou', 'vis', 'ciseaux', 'aiguille', 'fil', 'tissu', 'coussin', 'couverture',
    'tiroir', 'armoire', 'étagère', 'bureau', 'lit', 'canapé', 'fauteuil', 'chaise', 'table',
    'réfrigérateur', 'four', 'lave-linge', 'aspirateur', 'balai', 'brosse', 'savon', 'shampoing',
  ],
  'Vêtements': [
    'robe', 'pantalon', 'jupe', 'chemise', 'pull', 'manteau', 'veste', 'blouson', 'imperméable',
    'costume', 'cravate', 'chaussure', 'botte', 'sandale', 'chaussette', 'collant', 'sous-vêtement',
    'pyjama', 'maillot', 'short', 'jean', 'chapeau', 'bonnet', 'écharpe', 'gant', 'ceinture',
    'sac', 'lunettes', 'montre', 'bijou', 'robe de chambre', 'tablier', 'uniforme', 'tenue',
  ],
  'Verbes': [],  // filled by POS filter below
  'Adjectifs': [], // filled by POS filter below
}

// ── Difficulty bands (freqlemlivres = occurrences per million words) ───────
function getDifficulty(freq) {
  if (freq >= 50) return 'easy'
  if (freq >= 5) return 'medium'
  return 'hard'
}

// ── Assign category from word + POS ───────────────────────────────────────
function getCategory(lemme, cgram) {
  const lower = lemme.toLowerCase()
  for (const [cat, words] of Object.entries(CATEGORY_LISTS)) {
    if (cat === 'Verbes' || cat === 'Adjectifs') continue
    if (words.some(w => lower === w || lower.startsWith(w))) return cat
  }
  if (cgram === 'VER') return 'Verbes'
  if (cgram === 'ADJ') return 'Adjectifs'
  return 'Divers'
}

// ── Generate basic hints from grammatical info ────────────────────────────
function getHints(cgram, genre, difficulty) {
  const hints = []
  if (cgram === 'NOM') hints.push(genre === 'm' ? 'nom masculin' : genre === 'f' ? 'nom féminin' : 'nom')
  if (cgram === 'VER') hints.push('verbe')
  if (cgram === 'ADJ') hints.push('adjectif')
  if (difficulty === 'easy') hints.push('mot courant')
  if (difficulty === 'hard') hints.push('mot rare')
  return hints
}

// ── Hint question templates by category × POS ────────────────────────────
// Each template is an open-ended coaching prompt that helps the describer
// without revealing the word. Templates use "cela" / "cette chose" / "cette
// action" as neutral stand-ins so the word never appears.
const HINT_TEMPLATES = {
  'Animaux': [
    "Dans quel environnement naturel trouve-t-on cet être vivant ?",
    "Comment cet être vivant se déplace-t-il habituellement ?",
    "Quelle particularité physique distingue cet être des autres ?",
    "Quel son fait cet être vivant pour communiquer ?",
    "Est-ce un animal qu'on trouve plutôt en ville, à la campagne ou dans la nature sauvage ?",
    "Comment les humains interagissent-ils généralement avec cet animal ?",
    "Quelle est la taille approximative de cet animal — tient-il dans la main ou est-il plus grand qu'une personne ?",
  ],
  'Lieux & Nourriture': [
    "Dans quelle situation ressent-on le besoin de cela ?",
    "Comment cela se prépare-t-il ou où le trouve-t-on ?",
    "Quelle est la texture ou la saveur caractéristique de cela ?",
    "À quel moment de la journée utilise-t-on ou consomme-t-on cela ?",
    "Quel endroit évoque immédiatement cela ?",
    "Comment se sent-on après avoir consommé ou visité cela ?",
    "Est-ce quelque chose qu'on trouve partout dans le monde ou plutôt en France ?",
  ],
  'Nature': [
    "Dans quelle condition météo ou géographique observe-t-on cela ?",
    "Comment cela affecte-t-il les personnes ou les animaux à proximité ?",
    "Est-ce quelque chose qu'on voit, qu'on entend ou qu'on ressent physiquement ?",
    "À quelle saison associe-t-on le plus souvent cela ?",
    "Quelle émotion ressent-on généralement en présence de cela ?",
    "Cela est-il dangereux, beau, ou les deux à la fois ?",
    "Où dans le monde peut-on observer cela de façon spectaculaire ?",
  ],
  'Émotions': [
    "Dans quelle situation de vie ressent-on généralement cela ?",
    "Comment cette émotion se manifeste-t-elle physiquement dans le corps ?",
    "Est-ce une émotion qu'on cherche à prolonger ou à éviter ?",
    "Qu'est-ce qui peut provoquer cette émotion chez la plupart des gens ?",
    "Comment réagit-on face à quelqu'un qui exprime cette émotion ?",
    "Cette émotion est-elle plutôt agréable, douloureuse, ou ambiguë ?",
    "Quel souvenir ou quelle situation déclenche souvent cette émotion ?",
  ],
  'Voyage': [
    "Dans quel contexte de déplacement utilise-t-on cela ?",
    "Est-ce quelque chose qu'on porte, qu'on prend, ou qu'on visite ?",
    "Quel problème résout cela lorsqu'on part loin de chez soi ?",
    "À quel moment précis d'un voyage a-t-on besoin de cela ?",
    "Que se passe-t-il si on oublie ou perd cela en voyage ?",
    "Est-ce propre à certains types de transport ou universel ?",
    "Quelle émotion ressent-on la première fois qu'on fait cela ?",
  ],
  'Objets': [
    "Dans quelle pièce de la maison trouve-t-on généralement cela ?",
    "Quel problème quotidien cela résout-il ?",
    "Avec quelle partie du corps utilise-t-on principalement cela ?",
    "Est-ce quelque chose qu'on utilise tous les jours ou occasionnellement ?",
    "Que se passe-t-il si cet objet tombe en panne ou disparaît ?",
    "Depuis combien de temps les humains utilisent-ils cet objet — depuis toujours ou récemment ?",
    "Comment cet objet a-t-il changé avec la technologie moderne ?",
  ],
  'Vêtements': [
    "Dans quelle situation ou quelle saison porte-t-on généralement cela ?",
    "Quelle partie du corps cela couvre-t-il ou protège-t-il ?",
    "Comment se sent-on lorsqu'on porte cela pour la première fois ?",
    "Est-ce un vêtement du quotidien ou réservé à des occasions spéciales ?",
    "Quels matériaux utilise-t-on typiquement pour fabriquer cela ?",
    "Comment le style de cet article a-t-il évolué au fil des décennies ?",
    "Cet article vestimentaire est-il plutôt porté par les hommes, les femmes, ou tout le monde ?",
  ],
  'Verbes': [
    "Dans quelle situation de la vie quotidienne effectue-t-on cette action ?",
    "Quelles parties du corps sont impliquées dans cette action ?",
    "Est-ce une action volontaire ou involontaire ?",
    "Comment se sent-on après avoir accompli cette action ?",
    "Cette action se fait-elle seul ou avec d'autres personnes ?",
    "À quelle fréquence une personne ordinaire effectue-t-elle cette action ?",
    "Quel objet ou quel endroit est souvent associé à cette action ?",
  ],
  'Adjectifs': [
    "À quel objet, personne ou situation applique-t-on souvent cette qualité ?",
    "Est-ce généralement perçu comme positif, négatif, ou neutre ?",
    "Comment reconnaît-on cette qualité chez quelqu'un ou quelque chose ?",
    "Quel est le contraire de cette qualité ?",
    "Dans quel contexte cette qualité est-elle particulièrement appréciée ?",
    "Cette qualité se voit-elle, s'entend-elle, ou se ressent-elle ?",
    "Donne un exemple de personne célèbre ou de chose connue qui incarne cette qualité.",
  ],
  'Divers': [
    "Dans quel contexte utilise-t-on ce mot en français ?",
    "À quoi cela sert-il ou à quoi cela fait-il référence ?",
    "Comment ce mot est-il lié à la vie quotidienne en France ?",
    "Quelle image mentale ce mot évoque-t-il immédiatement ?",
    "Est-ce quelque chose de concret qu'on peut toucher, ou une idée abstraite ?",
    "Dans quelle situation entend-on souvent ce mot ?",
    "Quel sentiment ou quelle réaction ce mot provoque-t-il ?",
  ],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getHintQuestion(category, cgram) {
  const pool = HINT_TEMPLATES[category] ?? HINT_TEMPLATES['Divers']
  return pick(pool)
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const tsvPath = path.join(__dirname, 'Lexique4.tsv')
  if (!fs.existsSync(tsvPath)) {
    console.error('❌  Lexique4.tsv not found at seed/Lexique4.tsv')
    console.error('   Download from: http://www.lexique.org/?page_id=194')
    process.exit(1)
  }

  console.log('📖  Reading Lexique4.tsv…')
  const lines = fs.readFileSync(tsvPath, 'utf8').split('\n')
  const header = lines[0].split('\t')

  // Column indices — Lexique4 uses capitalized names and slightly different layout
  const COL = {
    ortho:   header.indexOf('1_Mot'),
    lemme:   header.indexOf('4_Lemme'),
    cgram:   header.indexOf('5_Cgram'),
    genre:   header.indexOf('7_Genre'),
    nombre:  header.indexOf('8_Nombre'),
    freqLiv: header.indexOf('12_FreqLemme'),
  }

  // Parse + filter
  const seen = new Set()
  const words = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length < 8) continue

    const cgram = cols[COL.cgram]?.trim()
    const nombre = cols[COL.nombre]?.trim()
    const lemme = cols[COL.lemme]?.trim()
    const freqRaw = parseFloat(cols[COL.freqLiv])
    const genre = cols[COL.genre]?.trim()

    // Keep nouns (singular), verbs, adjectives with decent frequency
    if (!['NOM', 'VER', 'ADJ'].includes(cgram)) continue
    if (cgram === 'NOM' && nombre !== 's' && nombre !== '') continue
    if (!lemme || lemme.length < 3) continue
    if (lemme.includes('/')) continue   // skip tokens like km/h — invalid Firestore path segment
    if (isNaN(freqRaw) || freqRaw < 1) continue
    if (seen.has(lemme)) continue
    seen.add(lemme)

    const difficulty = getDifficulty(freqRaw)
    const category = getCategory(lemme, cgram)
    const hints = getHints(cgram, genre, difficulty)
    const hint_question = getHintQuestion(category, cgram)

    words.push({
      word: lemme,
      category,
      difficulty,
      forbidden_words: [],
      hints,
      hint_question,
      language: 'fr',
      frequency_rank: Math.round(freqRaw * 100) / 100,
      created_at: new Date().toISOString(),
    })

    if (words.length >= 5000) break
  }

  // Sort by frequency desc so we get the most useful words first
  words.sort((a, b) => b.frequency_rank - a.frequency_rank)

  console.log(`✅  Parsed ${words.length} words — uploading to Firestore…`)

  // Batch write (Firestore max = 500 ops per batch)
  const BATCH_SIZE = 400
  let uploaded = 0

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = words.slice(i, i + BATCH_SIZE)

    for (const w of chunk) {
      // Use lemme as doc ID so re-runs are idempotent
      const ref = doc(collection(db, 'words'), `lex-${w.word.replace(/\s+/g, '-')}`)
      batch.set(ref, w)
    }

    await batch.commit()
    uploaded += chunk.length
    console.log(`   ${uploaded} / ${words.length}`)
  }

  console.log(`🎉  Done! ${uploaded} words uploaded to Firestore collection 'words'.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
