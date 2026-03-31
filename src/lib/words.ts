import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Word, GameSettings } from '../types'

// Static fallback — used if Firestore fetch fails or returns empty
export const WORDS: Word[] = [
  { id:'w-1',  word:'boulangerie', category:'Food & places', difficulty:'easy',   forbidden_words:['pain','farine','four'],              hints:['un lieu','nom féminin','nourriture'],         hint_question:'Dans quel contexte quotidien utilise-t-on ce mot ?', language:'fr', frequency_rank:1,  created_at:'' },
  { id:'w-2',  word:'croissant',   category:'Food & places', difficulty:'easy',   forbidden_words:['beurre','farine','petit-déjeuner'],  hints:['nourriture','forme courbée','boulangerie'],   hint_question:'Quelle est la forme ou la texture caractéristique de ce mot ?', language:'fr', frequency_rank:2,  created_at:'' },
  { id:'w-3',  word:'fromage',     category:'Food & places', difficulty:'easy',   forbidden_words:['lait','vache','camembert'],          hints:['nourriture','nom masculin','France'],          hint_question:'Quelle région ou culture est connue pour ce mot ?', language:'fr', frequency_rank:3,  created_at:'' },
  { id:'w-4',  word:'marché',      category:'Food & places', difficulty:'easy',   forbidden_words:['vendre','acheter','légumes'],        hints:['un lieu','nom masculin','plein air'],          hint_question:'Quelle activité se déroule généralement dans ce lieu ?', language:'fr', frequency_rank:4,  created_at:'' },
  { id:'w-5',  word:'restaurant',  category:'Food & places', difficulty:'easy',   forbidden_words:['manger','dîner','menu'],             hints:['un lieu','nom masculin','cuisine'],            hint_question:'Qu\'est-ce qu\'on fait typiquement dans ce lieu ?', language:'fr', frequency_rank:5,  created_at:'' },
  { id:'w-6',  word:'grenouille',  category:'Animals',       difficulty:'medium', forbidden_words:['saut','mare','vert'],                hints:['animal','nom féminin','amphibien'],            hint_question:'Dans quel environnement naturel trouve-t-on cet animal ?', language:'fr', frequency_rank:6,  created_at:'' },
  { id:'w-7',  word:'papillon',    category:'Animals',       difficulty:'easy',   forbidden_words:['ailes','fleur','voler'],             hints:['insecte','nom masculin','coloré'],             hint_question:'Quelle transformation remarquable est liée à cet animal ?', language:'fr', frequency_rank:7,  created_at:'' },
  { id:'w-8',  word:'écureuil',    category:'Animals',       difficulty:'hard',   forbidden_words:['noix','arbre','queue'],              hints:['animal','nom masculin','forêt'],               hint_question:'Quelle est la principale activité de cet animal en automne ?', language:'fr', frequency_rank:8,  created_at:'' },
  { id:'w-9',  word:'dauphin',     category:'Animals',       difficulty:'easy',   forbidden_words:['mer','nager','intelligent'],         hints:['animal marin','nom masculin','saute'],         hint_question:'Pourquoi cet animal est-il souvent associé à l\'intelligence ?', language:'fr', frequency_rank:9,  created_at:'' },
  { id:'w-10', word:'hibou',       category:'Animals',       difficulty:'medium', forbidden_words:['nuit','forêt','sage'],               hints:['oiseau','nom masculin','yeux ronds'],          hint_question:'À quelle période de la journée cet animal est-il actif ?', language:'fr', frequency_rank:10, created_at:'' },
  { id:'w-11', word:'parapluie',   category:'Objects',       difficulty:'medium', forbidden_words:['pluie','eau','mouillé'],             hints:['objet','nom masculin','météo'],                hint_question:'Dans quelles conditions météo utilise-t-on cet objet ?', language:'fr', frequency_rank:11, created_at:'' },
  { id:'w-12', word:'cuillère',    category:'Objects',       difficulty:'easy',   forbidden_words:['soupe','manger','bol'],              hints:['objet','nom féminin','cuisine'],               hint_question:'Pour quel type d\'aliment utilise-t-on principalement cet objet ?', language:'fr', frequency_rank:12, created_at:'' },
  { id:'w-13', word:'miroir',      category:'Objects',       difficulty:'easy',   forbidden_words:['reflet','voir','verre'],             hints:['objet','nom masculin','maison'],               hint_question:'Quelle action fait-on face à cet objet ?', language:'fr', frequency_rank:13, created_at:'' },
  { id:'w-14', word:'tiroir',      category:'Objects',       difficulty:'medium', forbidden_words:['meuble','ranger','ouvrir'],          hints:['objet','nom masculin','bureau'],               hint_question:'Où trouve-t-on généralement cet objet dans une maison ?', language:'fr', frequency_rank:14, created_at:'' },
  { id:'w-15', word:'bougie',      category:'Objects',       difficulty:'easy',   forbidden_words:['feu','flamme','lumière'],            hints:['objet','nom féminin','romantique'],            hint_question:'Dans quel contexte émotionnel utilise-t-on souvent cet objet ?', language:'fr', frequency_rank:15, created_at:'' },
  { id:'w-16', word:'aéroport',    category:'Travel',        difficulty:'easy',   forbidden_words:['avion','voler','valise'],            hints:['lieu','nom masculin','voyage'],                hint_question:'Quelle étape du voyage se passe dans ce lieu ?', language:'fr', frequency_rank:16, created_at:'' },
  { id:'w-17', word:'passeport',   category:'Travel',        difficulty:'easy',   forbidden_words:['frontière','voyage','identité'],     hints:['document','nom masculin','officiel'],          hint_question:'Pourquoi ce document est-il indispensable pour voyager ?', language:'fr', frequency_rank:17, created_at:'' },
  { id:'w-18', word:'hôtel',       category:'Travel',        difficulty:'easy',   forbidden_words:['chambre','nuit','dormir'],           hints:['lieu','nom masculin','séjour'],                hint_question:'Quelle prestation distingue ce lieu d\'un logement ordinaire ?', language:'fr', frequency_rank:18, created_at:'' },
  { id:'w-19', word:'valise',      category:'Travel',        difficulty:'easy',   forbidden_words:['voyage','bagages','emporter'],       hints:['objet','nom féminin','roulettes'],             hint_question:'Qu\'est-ce qu\'on met dans cet objet avant de partir ?', language:'fr', frequency_rank:19, created_at:'' },
  { id:'w-20', word:'itinéraire',  category:'Travel',        difficulty:'hard',   forbidden_words:['route','voyage','plan'],             hints:['nom masculin','organiser','étapes'],           hint_question:'Quand planifie-t-on généralement ce document ?', language:'fr', frequency_rank:20, created_at:'' },
  { id:'w-21', word:'escale',      category:'Travel',        difficulty:'hard',   forbidden_words:['avion','arrêt','aéroport'],          hints:['voyage','pause','vol'],                        hint_question:'Pourquoi s\'arrête-t-on lors de ce moment dans un voyage ?', language:'fr', frequency_rank:21, created_at:'' },
  { id:'w-22', word:'billet',      category:'Travel',        difficulty:'easy',   forbidden_words:['train','bus','payer'],               hints:['document','nom masculin','transport'],         hint_question:'Que prouve ce document lors d\'un trajet ?', language:'fr', frequency_rank:22, created_at:'' },
  { id:'w-23', word:'douane',      category:'Travel',        difficulty:'medium', forbidden_words:['frontière','contrôle','déclaration'],hints:['lieu','nom féminin','aéroport'],               hint_question:'Quelle vérification effectue-t-on à cet endroit ?', language:'fr', frequency_rank:23, created_at:'' },
  { id:'w-24', word:'croisière',   category:'Travel',        difficulty:'medium', forbidden_words:['bateau','mer','vacances'],           hints:['voyage','nom féminin','navire'],               hint_question:'Quel type de transport est associé à ce voyage ?', language:'fr', frequency_rank:24, created_at:'' },
  { id:'w-25', word:'jalousie',    category:'Emotions',      difficulty:'medium', forbidden_words:['envie','autre','vouloir'],           hints:['émotion','nom féminin','négatif'],             hint_question:'Dans quelle situation ressent-on généralement cette émotion ?', language:'fr', frequency_rank:25, created_at:'' },
  { id:'w-26', word:'nostalgie',   category:'Emotions',      difficulty:'hard',   forbidden_words:['passé','souvenir','ancien'],         hints:['émotion','nom féminin','mélancolie'],          hint_question:'À quoi pense-t-on quand on ressent cette émotion ?', language:'fr', frequency_rank:26, created_at:'' },
  { id:'w-27', word:'fierté',      category:'Emotions',      difficulty:'medium', forbidden_words:['fier','réussite','succès'],          hints:['émotion','nom féminin','positif'],             hint_question:'Après quel type d\'événement ressent-on cette émotion ?', language:'fr', frequency_rank:27, created_at:'' },
  { id:'w-28', word:'mélancolie',  category:'Emotions',      difficulty:'hard',   forbidden_words:['tristesse','sombre','pensif'],       hints:['émotion','nom féminin','poétique'],            hint_question:'Comment cette émotion se distingue-t-elle de la simple tristesse ?', language:'fr', frequency_rank:28, created_at:'' },
  { id:'w-29', word:'enthousiasme',category:'Emotions',      difficulty:'medium', forbidden_words:['excité','énergie','passion'],        hints:['émotion','nom masculin','positif'],            hint_question:'Quel type d\'activité provoque généralement cette émotion ?', language:'fr', frequency_rank:29, created_at:'' },
  { id:'w-30', word:'honte',       category:'Emotions',      difficulty:'easy',   forbidden_words:['rouge','gêne','erreur'],             hints:['émotion','nom féminin','négatif'],             hint_question:'Quelle réaction physique accompagne souvent cette émotion ?', language:'fr', frequency_rank:30, created_at:'' },
  { id:'w-31', word:'soulagement', category:'Emotions',      difficulty:'hard',   forbidden_words:['stress','terminer','fin'],           hints:['émotion','nom masculin','après inquiétude'],   hint_question:'Après quel événement ressent-on généralement cette émotion ?', language:'fr', frequency_rank:31, created_at:'' },
  { id:'w-32', word:'tendresse',   category:'Emotions',      difficulty:'medium', forbidden_words:['amour','doux','câlin'],              hints:['émotion','nom féminin','affection'],           hint_question:'Envers qui ressent-on généralement cette émotion ?', language:'fr', frequency_rank:32, created_at:'' },
  { id:'w-33', word:'curiosité',   category:'Emotions',      difficulty:'easy',   forbidden_words:['savoir','questions','apprendre'],    hints:['émotion','nom féminin','explorer'],            hint_question:'Qu\'est-ce qui déclenche naturellement cette émotion chez les enfants ?', language:'fr', frequency_rank:33, created_at:'' },
  { id:'w-34', word:'courage',     category:'Emotions',      difficulty:'easy',   forbidden_words:['peur','brave','fort'],               hints:['qualité','nom masculin','positif'],            hint_question:'Dans quelle situation difficile cette qualité est-elle indispensable ?', language:'fr', frequency_rank:34, created_at:'' },
  { id:'w-35', word:'chuchoter',   category:'Verbs',         difficulty:'hard',   forbidden_words:['voix','doucement','oreille'],        hints:['verbe','parler très bas','bibliothèque'],      hint_question:'Dans quel lieu ou situation parle-t-on de cette façon ?', language:'fr', frequency_rank:35, created_at:'' },
  { id:'w-36', word:'trébucher',   category:'Verbs',         difficulty:'hard',   forbidden_words:['tomber','pied','sol'],               hints:['verbe','mouvement','accident'],                hint_question:'Quelle partie du corps est impliquée dans cette action ?', language:'fr', frequency_rank:36, created_at:'' },
  { id:'w-37', word:'applaudir',   category:'Verbs',         difficulty:'medium', forbidden_words:['mains','bravo','concert'],           hints:['verbe','geste','approbation'],                 hint_question:'Dans quel contexte social réalise-t-on ce geste ?', language:'fr', frequency_rank:37, created_at:'' },
  { id:'w-38', word:'bâiller',     category:'Verbs',         difficulty:'medium', forbidden_words:['fatigué','bouche','sommeil'],        hints:['verbe','corps','involontaire'],                hint_question:'Quelle sensation physique précède souvent cette action ?', language:'fr', frequency_rank:38, created_at:'' },
  { id:'w-39', word:'ronfler',     category:'Verbs',         difficulty:'easy',   forbidden_words:['dormir','nuit','bruit'],             hints:['verbe','corps','sommeil'],                     hint_question:'Quand et où entend-on généralement ce son ?', language:'fr', frequency_rank:39, created_at:'' },
  { id:'w-40', word:'fredonner',   category:'Verbs',         difficulty:'hard',   forbidden_words:['chanter','musique','bouche'],        hints:['verbe','mélodie','doucement'],                 hint_question:'Comment cette action se distingue-t-elle du chant normal ?', language:'fr', frequency_rank:40, created_at:'' },
  { id:'w-41', word:'grimacer',    category:'Verbs',         difficulty:'medium', forbidden_words:['visage','douleur','expression'],     hints:['verbe','corps','émotion'],                     hint_question:'Quelle sensation ou émotion provoque cette réaction du visage ?', language:'fr', frequency_rank:41, created_at:'' },
  { id:'w-42', word:'savourer',    category:'Verbs',         difficulty:'medium', forbidden_words:['goûter','apprécier','lentement'],    hints:['verbe','nourriture','plaisir'],                hint_question:'Pourquoi fait-on cette action lentement ?', language:'fr', frequency_rank:42, created_at:'' },
  { id:'w-43', word:'arc-en-ciel', category:'Nature',        difficulty:'easy',   forbidden_words:['couleurs','pluie','ciel'],           hints:['phénomène','nom masculin','après pluie'],      hint_question:'Quelles conditions météo sont nécessaires pour voir ce phénomène ?', language:'fr', frequency_rank:43, created_at:'' },
  { id:'w-44', word:'avalanche',   category:'Nature',        difficulty:'medium', forbidden_words:['neige','montagne','tomber'],         hints:['phénomène','nom féminin','danger'],            hint_question:'Quel sport ou activité est particulièrement menacé par ce phénomène ?', language:'fr', frequency_rank:44, created_at:'' },
  { id:'w-45', word:'tornade',     category:'Nature',        difficulty:'medium', forbidden_words:['vent','tourbillon','détruire'],      hints:['phénomène','nom féminin','météo'],             hint_question:'Dans quelle région du monde ce phénomène est-il fréquent ?', language:'fr', frequency_rank:45, created_at:'' },
  { id:'w-46', word:'marée',       category:'Nature',        difficulty:'medium', forbidden_words:['mer','eau','lune'],                  hints:['phénomène','nom féminin','côte'],              hint_question:'Quel astre influence ce phénomène naturel ?', language:'fr', frequency_rank:46, created_at:'' },
  { id:'w-47', word:'volcan',      category:'Nature',        difficulty:'easy',   forbidden_words:['lave','feu','éruption'],             hints:['géographie','nom masculin','montagne'],        hint_question:'Quelle substance sort d\'un tel phénomène géologique ?', language:'fr', frequency_rank:47, created_at:'' },
  { id:'w-48', word:'chaussures',  category:'Clothing',      difficulty:'easy',   forbidden_words:['pied','marcher','lacets'],           hints:['vêtement','nom féminin pluriel','mode'],       hint_question:'Quelle partie du corps cet article vestimentaire protège-t-il ?', language:'fr', frequency_rank:48, created_at:'' },
  { id:'w-49', word:'nuage',       category:'Nature',        difficulty:'easy',   forbidden_words:['ciel','pluie','blanc'],              hints:['nature','nom masculin','météo'],               hint_question:'De quelle substance naturelle est composé ce phénomène ?', language:'fr', frequency_rank:49, created_at:'' },
  { id:'w-50', word:'chandelier',  category:'Objects',       difficulty:'medium', forbidden_words:['bougie','flamme','lumière'],         hints:['objet','nom masculin','décoratif'],            hint_question:'Dans quel type de lieu trouve-t-on traditionnellement cet objet ?', language:'fr', frequency_rank:50, created_at:'' },
]

export const CATEGORIES = [...new Set(WORDS.map(w => w.category))]

// In-memory cache so repeated fetchWordById calls don't re-hit Firestore
const wordCache = new Map<string, Word>()

// Fetch eligible word IDs from Firestore for this session's settings.
// Falls back to the static WORDS list if Firestore is empty or fails.
export async function fetchWordPool(settings: GameSettings): Promise<string[]> {
  try {
    let q = query(collection(db, 'words'))

    if (settings.difficulty !== 'all') {
      q = query(q, where('difficulty', '==', settings.difficulty))
    }
    if (settings.categories.length > 0) {
      q = query(q, where('category', 'in', settings.categories))
    }

    const snap = await getDocs(q)
    if (snap.empty) throw new Error('empty')

    // Shuffle so each game has a different word order
    const ids = snap.docs.map(d => d.id)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]]
    }
    return ids
  } catch {
    // Fallback: filter static words and return their IDs
    const filtered = WORDS.filter(w => {
      const diffOk = settings.difficulty === 'all' || w.difficulty === settings.difficulty
      const catOk = settings.categories.length === 0 || settings.categories.includes(w.category)
      return diffOk && catOk
    })
    return filtered.map(w => w.id)
  }
}

// Fetch a single word by ID — checks cache first, then Firestore, then static list
export async function fetchWordById(id: string): Promise<Word | null> {
  if (wordCache.has(id)) return wordCache.get(id)!

  // Static words use w-N IDs — no Firestore fetch needed
  const staticWord = WORDS.find(w => w.id === id)
  if (staticWord) {
    wordCache.set(id, staticWord)
    return staticWord
  }

  try {
    const snap = await getDoc(doc(db, 'words', id))
    if (!snap.exists()) return null
    const word = { id: snap.id, ...snap.data() } as Word
    wordCache.set(id, word)
    return word
  } catch {
    return null
  }
}

// Pick the next unused word ID from the session's pre-loaded pool (sync)
export function pickNextWordId(wordPool: string[], usedWordIds: string[]): string | null {
  const used = new Set(usedWordIds)
  return wordPool.find(id => !used.has(id)) ?? null
}

// Legacy helper — kept for any code still using the static list directly
export function getNextWord(
  usedIds: string[],
  difficulty: GameSettings['difficulty'],
  categories: string[],
): Word | null {
  const pool = WORDS.filter(w => {
    const diffOk = difficulty === 'all' || w.difficulty === difficulty
    const catOk = categories.length === 0 || categories.includes(w.category)
    const notUsed = !usedIds.includes(w.id)
    return diffOk && catOk && notUsed
  })
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
