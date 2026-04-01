/**
 * update_words.cjs — Batch UPDATE existing Firestore words (never overwrites unrelated fields)
 *
 * Operations (run one at a time to manage Firestore write quota):
 *
 *   node seed/update_words.cjs fix_forbidden
 *     → Re-generates forbidden_words[] for any word where the array is empty.
 *       Uses the same category-pool logic as seed_lexique.cjs.
 *       Safe to re-run — skips words that already have forbidden_words set.
 *
 *   node seed/update_words.cjs add_hint2
 *     → Fetches a short definition from French Wiktionary for each word
 *       and writes it as the `hint2` field.
 *       Skips words that already have hint2 set (resumable after interruption).
 *       Rate-limited to 1 req/s — expect ~90 min for 5,000 words.
 *       Words not found on Wiktionary are skipped (hint2 left unset).
 *
 * BEFORE RUNNING:
 *   Firebase console → Firestore → Rules → temporarily allow words writes:
 *     match /databases/{db}/documents/words/{id} { allow write: if true; }
 *   Restore the rule after the script completes.
 *
 * QUOTA NOTE:
 *   fix_forbidden  → ~5,000 writes  (5k of 20k free daily limit)
 *   add_hint2      → ~5,000 writes  (5k of 20k free daily limit)
 *   Run them on separate days if needed.
 */

const path = require('path')
const https = require('https')
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

// ── Category pools — same as seed_lexique.cjs ─────────────────────────────
const CATEGORY_LISTS = {
  'Animaux': [
    'chat', 'chien', 'oiseau', 'poisson', 'cheval', 'vache', 'mouton', 'cochon', 'lapin', 'souris',
    'rat', 'lion', 'tigre', 'éléphant', 'girafe', 'singe', 'serpent', 'grenouille', 'tortue', 'canard',
    'poule', 'coq', 'loup', 'renard', 'cerf', 'biche', 'sanglier', 'ours', 'aigle', 'hibou', 'corbeau',
    'perroquet', 'dauphin', 'baleine', 'requin', 'pieuvre', 'crabe', 'homard', 'papillon', 'abeille',
    'fourmi', 'mouche', 'moustique', 'araignée', 'ver', 'escargot', 'écureuil', 'hérisson', 'taupe',
    'chauve-souris', 'cigogne', 'flamant', 'manchot', 'pingouin', 'crocodile', 'alligator',
    'rhinocéros', 'zèbre', 'panthère', 'léopard', 'jaguar', 'guépard', 'puma', 'lynx', 'bison',
    'chameau', 'dromadaire', 'lama', 'alpaga', 'kangourou', 'koala', 'panda', 'gorille', 'chimpanzé',
    'âne', 'mulet', 'poney', 'taureau', 'boeuf', 'truie', 'agneau', 'veau', 'poussin',
  ],
  'Lieux & Nourriture': [
    'pain', 'fromage', 'vin', 'beurre', 'lait', 'oeuf', 'sucre', 'sel', 'farine', 'huile',
    'viande', 'poulet', 'porc', 'légume', 'fruit', 'pomme', 'poire', 'banane',
    'orange', 'citron', 'fraise', 'cerise', 'raisin', 'tomate', 'carotte', 'oignon',
    'ail', 'salade', 'soupe', 'gâteau', 'tarte', 'crêpe', 'biscuit', 'chocolat', 'café',
    'thé', 'eau', 'jus', 'bière', 'champagne', 'restaurant', 'boulangerie', 'épicerie', 'marché',
    'supermarché', 'brasserie', 'bistrot', 'cantine', 'cuisine', 'réfrigérateur', 'four',
    'casserole', 'assiette', 'verre', 'fourchette', 'couteau', 'cuillère',
  ],
  'Nature': [
    'soleil', 'lune', 'étoile', 'nuage', 'pluie', 'neige', 'vent', 'orage', 'arc-en-ciel', 'mer',
    'océan', 'rivière', 'lac', 'montagne', 'forêt', 'arbre', 'fleur', 'herbe', 'feuille', 'plante',
    'rocher', 'sable', 'plage', 'désert', 'volcan', 'île', 'jungle', 'prairie', 'champ', 'jardin',
    'ciel', 'horizon', 'vague', 'marée', 'avalanche', 'tornade', 'tempête', 'brouillard',
    'givre', 'glace', 'glacier', 'cascade', 'fleuve', 'ruisseau', 'étang', 'colline', 'vallée',
    'grotte', 'falaise', 'dune', 'récif', 'bois', 'bosquet', 'savane',
  ],
  'Émotions': [
    'joie', 'tristesse', 'peur', 'colère', 'surprise', 'dégoût', 'amour', 'haine', 'jalousie',
    'fierté', 'honte', 'culpabilité', 'nostalgie', 'mélancolie', 'anxiété', 'stress', 'enthousiasme',
    'ennui', 'curiosité', 'espoir', 'désespoir', 'bonheur', 'malheur', 'rage', 'tendresse',
    'courage', 'lâcheté', 'confiance', 'méfiance', 'soulagement', 'frustration', 'impatience',
    'gratitude', 'admiration', 'indignation', 'compassion', 'envie', 'solitude', 'timidité',
  ],
  'Voyage': [
    'avion', 'train', 'voiture', 'bateau', 'bus', 'métro', 'vélo', 'moto', 'taxi', 'tramway',
    'aéroport', 'gare', 'port', 'hôtel', 'auberge', 'camping', 'valise', 'sac', 'passeport', 'billet',
    'visa', 'guide', 'touriste', 'voyage', 'vacances', 'destination', 'itinéraire', 'escale',
    'frontière', 'douane', 'ambassade', 'consulat', 'croisière', 'safari', 'randonnée',
    'appartement', 'chambre', 'réservation', 'excursion', 'circuit',
  ],
  'Objets': [
    'téléphone', 'ordinateur', 'télévision', 'radio', 'lampe', 'miroir', 'horloge',
    'montre', 'clé', 'serrure', 'porte', 'fenêtre', 'rideau', 'tapis', 'tableau', 'vase', 'bougie',
    'parapluie', 'portefeuille', 'lunettes', 'chapeau', 'ceinture', 'bijou', 'bague', 'collier',
    'bracelet', 'stylo', 'cahier', 'livre', 'journal', 'enveloppe', 'timbre', 'outil',
    'marteau', 'clou', 'vis', 'ciseaux', 'aiguille', 'fil', 'tissu', 'coussin', 'couverture',
    'tiroir', 'armoire', 'étagère', 'bureau', 'lit', 'canapé', 'fauteuil',
    'réfrigérateur', 'lave-linge', 'aspirateur', 'balai', 'brosse', 'savon', 'shampoing',
  ],
  'Vêtements': [
    'robe', 'pantalon', 'jupe', 'chemise', 'pull', 'manteau', 'veste', 'blouson', 'imperméable',
    'costume', 'cravate', 'chaussure', 'botte', 'sandale', 'chaussette', 'collant',
    'pyjama', 'maillot', 'short', 'jean', 'bonnet', 'écharpe', 'gant',
    'robe de chambre', 'tablier', 'uniforme',
  ],
  'Verbes': [
    'manger', 'boire', 'dormir', 'courir', 'marcher', 'parler', 'écrire', 'lire', 'chanter',
    'danser', 'rire', 'pleurer', 'crier', 'sauter', 'tomber', 'voler', 'nager', 'conduire',
    'travailler', 'jouer', 'regarder', 'écouter', 'toucher', 'sentir', 'goûter', 'penser',
    'rêver', 'attendre', 'chercher', 'trouver', 'donner', 'prendre', 'ouvrir', 'fermer',
    'monter', 'descendre', 'entrer', 'sortir', 'partir', 'arriver', 'commencer', 'finir',
    'apprendre', 'enseigner', 'construire', 'détruire', 'acheter', 'vendre', 'cuisiner', 'nettoyer',
  ],
  'Adjectifs': [
    'grand', 'petit', 'beau', 'laid', 'rapide', 'lent', 'fort', 'faible', 'chaud', 'froid',
    'doux', 'dur', 'léger', 'lourd', 'propre', 'sale', 'neuf', 'vieux', 'jeune', 'nouveau',
    'heureux', 'triste', 'calme', 'agité', 'courageux', 'peureux', 'intelligent', 'bête',
    'généreux', 'avare', 'patient', 'impatient', 'gentil', 'méchant', 'drôle', 'sérieux',
    'brillant', 'terne', 'coloré', 'terne', 'lisse', 'rugueux', 'silencieux', 'bruyant',
    'célèbre', 'inconnu', 'riche', 'pauvre', 'simple', 'compliqué', 'naturel', 'artificiel',
  ],
  'Divers': [
    'maison', 'rue', 'ville', 'pays', 'monde', 'histoire', 'temps', 'argent', 'travail',
    'famille', 'ami', 'enfant', 'homme', 'femme', 'vie', 'mort', 'guerre', 'paix',
    'loi', 'droit', 'art', 'musique', 'sport', 'science', 'médecine', 'école', 'université',
    'gouvernement', 'société', 'culture', 'religion', 'nature', 'environnement', 'technologie',
    'internet', 'téléphone', 'voiture', 'avion', 'nourriture', 'santé', 'bonheur', 'liberté',
  ],
}

// Regenerate forbidden_words — picks 3 related words from the same category pool
function makeForbiddenWords(word, category, n = 3) {
  const pool = CATEGORY_LISTS[category] ?? []
  const lower = word.toLowerCase()
  const candidates = pool.filter(w => w !== lower && !lower.startsWith(w) && !w.startsWith(lower))
  if (candidates.length === 0) return null  // null = no change possible
  const shuffled = candidates.slice().sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

// ── Wiktionary fetch ──────────────────────────────────────────────────────
// Uses prop=revisions (raw wikitext) which genuinely supports batch requests.
// prop=extracts only processes ONE page per request — do NOT use it for batching.
const sleep = ms => new Promise(r => setTimeout(r, ms))
const fs    = require('fs')

// Parse the first French definition from raw Wiktionary wikitext.
// Wikitext definitions use `# ` prefix (numbered list items).
// Examples use `#: ` or `#* `, sub-definitions use `## ` — all skipped.
function parseWikitext(wikitext) {
  if (!wikitext) return null

  // Isolate the French section — stop at the next language section
  const frMatch = wikitext.match(/== Français ==([\s\S]*?)(?:\n==[^=]|$)/)
  const section = frMatch ? frMatch[1] : wikitext

  for (const line of section.split('\n')) {
    // Must start with exactly `# ` (definition), not `## ` (sub) or `#: ` (example)
    if (!line.startsWith('# ') || line.startsWith('## ') || line.startsWith('#: ') || line.startsWith('#* ')) continue

    let def = line.slice(2).trim()

    // Strip wikitext markup — templates {{...}}, links [[...|text]], bold/italic '''
    def = def.replace(/\{\{[^}]*\}\}/g, '')          // remove {{templates}}
    def = def.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')  // [[link|label]] → label
    def = def.replace(/\[\[([^\]]*)\]\]/g, '$1')     // [[link]] → link
    def = def.replace(/'{2,3}/g, '')                  // remove '' and '''
    def = def.replace(/\s+/g, ' ').trim()

    if (def.length > 10) return def
  }
  return null
}

// Fetch up to 50 words in a single API call using prop=revisions.
// Returns { results: { word: definition|null }, rateLimited: bool }
async function fetchBatch(wordList) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      action:   'query',
      titles:   wordList.join('|'),
      prop:     'revisions',
      rvprop:   'content',
      rvslots:  'main',
      redirects: '1',
      format:   'json',
    })
    const options = {
      hostname: 'fr.wiktionary.org',
      path:     `/w/api.php?${params.toString()}`,
      headers:  { 'User-Agent': 'le-mot-juste-seed/1.0 (vocab learning game)' },
      timeout:  20000,
    }
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode === 429 || data.includes('too many requests') || data.includes('making too many')) {
          resolve({ rateLimited: true, results: {} }); return
        }
        try {
          const json  = JSON.parse(data)
          const pages = json.query?.pages ?? {}

          // Build a map: canonical_title_lower → definition
          const byTitle = {}
          for (const page of Object.values(pages)) {
            if (page.missing !== undefined) continue
            // Content is in slots.main['*'] (newer API) or revisions[0]['*'] (older)
            const rev     = page.revisions?.[0]
            const content = rev?.slots?.main?.['*'] ?? rev?.['*'] ?? ''
            const def     = parseWikitext(content)
            if (def) byTitle[page.title.toLowerCase()] = def
          }

          // Map back to the original queried words using normalized/redirect info
          const aliasMap = {}
          for (const n of json.query?.normalized ?? []) aliasMap[n.from.toLowerCase()] = n.to.toLowerCase()
          for (const r of json.query?.redirects  ?? []) aliasMap[r.from.toLowerCase()] = r.to.toLowerCase()

          const results = {}
          for (const word of wordList) {
            const lower    = word.toLowerCase()
            const resolved = aliasMap[lower] ?? lower
            results[word]  = byTitle[resolved] ?? byTitle[lower] ?? null
          }
          resolve({ rateLimited: false, results })
        } catch(e) { resolve({ rateLimited: false, results: {} }) }
      })
    })
    req.on('error',   () => resolve({ rateLimited: false, results: {} }))
    req.on('timeout', () => { req.destroy(); resolve({ rateLimited: false, results: {} }) })
  })
}

// ── Load all words from Firestore ─────────────────────────────────────────
async function loadAllWords() {
  console.log('📥  Loading words from Firestore…')
  const snap = await getDocs(collection(db, 'words'))
  console.log(`   ${snap.size} documents found`)
  return snap.docs.map(d => ({ ref: d.ref, ...d.data() }))
}

// ── Batch write helper — uses update() to preserve all other fields ────────
async function flushBatch(ops) {
  if (ops.length === 0) return
  const batch = writeBatch(db)
  for (const { ref, fields } of ops) batch.update(ref, fields)
  await batch.commit()
}

// ── Parse CLI args ────────────────────────────────────────────────────────
// --limit N  cap writes this run (default 4000, leaving headroom for app writes)
function parseArgs() {
  const args = process.argv.slice(2)
  const op = args[0]
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 4000
  if (isNaN(limit) || limit < 1) { console.error('--limit must be a positive integer'); process.exit(1) }
  return { op, limit }
}

// ─────────────────────────────────────────────────────────────────────────
// OPERATION 1: fix_forbidden
// Re-generates forbidden_words[] for docs that have an empty array.
// Skips words that already have forbidden_words set — safe to resume.
// Stops after `limit` writes to stay under the free-tier daily quota.
// ─────────────────────────────────────────────────────────────────────────
async function fixForbidden(limit) {
  const words = await loadAllWords()
  const toFix = words.filter(w => !w.forbidden_words || w.forbidden_words.length === 0)
  const willWrite = Math.min(toFix.length, limit)

  console.log(`\n🔧  fix_forbidden`)
  console.log(`   ${words.length} total words  |  ${toFix.length} need fixing  |  ${words.length - toFix.length} already done`)
  console.log(`   This run: up to ${willWrite} writes  (--limit ${limit})`)

  if (toFix.length === 0) { console.log('   Nothing to do.'); return }

  console.log('   Proceeding in 3 seconds… Ctrl-C to abort.')
  await sleep(3000)

  const BATCH_SIZE = 400
  let written = 0
  let skipped = 0
  let pending = []

  for (const w of toFix) {
    if (written + pending.length >= limit) {
      console.log(`   ⏸  Write limit (${limit}) reached — stopping early. Re-run tomorrow to continue.`)
      break
    }

    const newForbidden = makeForbiddenWords(w.word, w.category)
    if (!newForbidden) { skipped++; continue }
    pending.push({ ref: w.ref, fields: { forbidden_words: newForbidden } })

    if (pending.length >= BATCH_SIZE) {
      await flushBatch(pending)
      written += pending.length
      pending = []
      console.log(`   ${written} written so far`)
    }
  }

  if (pending.length > 0) {
    await flushBatch(pending)
    written += pending.length
  }

  const remaining = toFix.length - skipped - written
  console.log(`✅  fix_forbidden — ${written} written, ${skipped} skipped (no pool), ${remaining} remaining for next run`)
}

const CACHE_PATH = path.join(__dirname, 'hint2_cache.json')

// ── Cache helpers ─────────────────────────────────────────────────────────
function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {}
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) } catch { return {} }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

// ─────────────────────────────────────────────────────────────────────────
// OPERATION 2: fetch_hint2
// Fetches definitions in batches of 50 words per API request (~100 requests
// total for 5000 words). No Firestore writes — purely a local file operation.
// Resumable: words already in the cache are skipped.
// ─────────────────────────────────────────────────────────────────────────
async function fetchHint2() {
  const words = await loadAllWords()
  const cache = loadCache()

  const toFetch = words.filter(w => !(w.word in cache))
  const BATCH = 50
  const totalBatches = Math.ceil(toFetch.length / BATCH)

  console.log(`\n🌐  fetch_hint2`)
  console.log(`   ${words.length} total words  |  ${toFetch.length} to fetch  |  ${Object.keys(cache).length} already cached`)
  console.log(`   Batching 50 words/request → ${totalBatches} requests total  |  ~${Math.ceil(totalBatches / 6)} min`)
  console.log(`   Output: ${CACHE_PATH}`)

  if (toFetch.length === 0) { console.log('   Nothing to do — cache is complete.'); return }

  console.log('   Proceeding in 3 seconds… Ctrl-C to abort safely (progress is saved).')
  await sleep(3000)

  const RATE_MS  = 2000   // 2s between batch requests
  const MAX_BACK = 300000 // max 5 min backoff on rate limit
  let found = 0
  let notFound = 0

  for (let i = 0; i < toFetch.length; i += BATCH) {
    const chunk     = toFetch.slice(i, i + BATCH).map(w => w.word)
    let   backoff   = 60000
    let   result

    // Retry loop for rate limiting
    while (true) {
      result = await fetchBatch(chunk)
      if (!result.rateLimited) break
      console.log(`   ⏳ Rate limited — waiting ${backoff / 1000}s…`)
      await sleep(backoff)
      backoff = Math.min(backoff * 2, MAX_BACK)
    }

    // Store results — mark misses explicitly so we don't re-fetch them
    for (const word of chunk) {
      cache[word] = result.results[word] ?? null
      if (result.results[word]) found++ ; else notFound++
    }

    const batchNum = Math.floor(i / BATCH) + 1
    saveCache(cache)
    console.log(`   batch ${batchNum}/${totalBatches}  |  ${found} found  |  ${notFound} not on Wiktionary`)

    if (i + BATCH < toFetch.length) await sleep(RATE_MS)
  }

  saveCache(cache)
  // Summary: only count non-null entries as usable definitions
  const usable = Object.values(cache).filter(v => v !== null).length
  console.log(`\n✅  fetch_hint2 done — ${usable} definitions cached`)
  console.log(`   Review ${CACHE_PATH} then run: node seed/update_words.cjs write_hint2`)
}

// ─────────────────────────────────────────────────────────────────────────
// OPERATION 3: write_hint2
// Reads hint2_cache.json and writes definitions to Firestore.
// Skips words that already have hint2 set in Firestore — safe to resume.
// Respects --limit to stay under the daily free-tier quota.
// ─────────────────────────────────────────────────────────────────────────
async function writeHint2(limit) {
  const cache = loadCache()
  if (Object.keys(cache).length === 0) {
    console.log('❌  hint2_cache.json is empty or missing. Run fetch_hint2 first.')
    process.exit(1)
  }

  const words = await loadAllWords()
  // Only write words that: have a cached definition AND don't already have hint2 in Firestore
  const toWrite = words.filter(w => cache[w.word] && !w.hint2)
  const willWrite = Math.min(toWrite.length, limit)

  console.log(`\n✍️   write_hint2`)
  console.log(`   ${Object.keys(cache).length} words in cache  |  ${toWrite.length} need writing to Firestore  |  ${words.length - toWrite.length} already done`)
  console.log(`   This run: up to ${willWrite} writes  (--limit ${limit})`)
  if (toWrite.length > willWrite) {
    console.log(`   ${Math.ceil((toWrite.length - willWrite) / limit)} more run(s) needed tomorrow to finish`)
  }

  if (toWrite.length === 0) { console.log('   Nothing to do.'); return }

  console.log('   Proceeding in 3 seconds… Ctrl-C to abort.')
  await sleep(3000)

  const BATCH_SIZE = 400
  let written = 0
  let pending = []

  for (const w of toWrite) {
    if (written + pending.length >= limit) {
      console.log(`   ⏸  Write limit (${limit}) reached — re-run tomorrow to continue.`)
      break
    }
    pending.push({ ref: w.ref, fields: { hint2: cache[w.word] } })

    if (pending.length >= BATCH_SIZE) {
      await flushBatch(pending)
      written += pending.length
      pending = []
      console.log(`   ${written} written so far`)
    }
  }

  if (pending.length > 0) {
    await flushBatch(pending)
    written += pending.length
  }

  const remaining = toWrite.length - written
  console.log(`✅  write_hint2 — ${written} written to Firestore, ${Math.max(0, remaining)} remaining for next run`)
}

// ── Entry point ───────────────────────────────────────────────────────────
const { op, limit } = parseArgs()

if (!op || !['fix_forbidden', 'fetch_hint2', 'write_hint2'].includes(op)) {
  console.log('Usage:')
  console.log('  node seed/update_words.cjs fix_forbidden          — fill empty forbidden_words[]')
  console.log('  node seed/update_words.cjs fetch_hint2            — fetch definitions from Wiktionary → hint2_cache.json')
  console.log('  node seed/update_words.cjs write_hint2 [--limit N] — write cache to Firestore (default limit: 4000)')
  console.log('')
  console.log('  --limit N   max Firestore writes per run (write_hint2 only)')
  process.exit(0)
}

const ops = {
  fix_forbidden: () => fixForbidden(limit),
  fetch_hint2:   () => fetchHint2(),        // no limit — no Firestore writes
  write_hint2:   () => writeHint2(limit),
}
ops[op]().catch(e => { console.error('❌', e); process.exit(1) }).then(() => process.exit(0))
