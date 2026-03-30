const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const words = [
  { word:'boulangerie', category:'Food & places', difficulty:'easy', forbidden_words:['pain','farine','four'], hints:['un lieu','nom féminin','nourriture'], frequency_rank:1 },
  { word:'croissant', category:'Food & places', difficulty:'easy', forbidden_words:['beurre','farine','petit-déjeuner'], hints:['nourriture','forme courbée','boulangerie'], frequency_rank:2 },
  { word:'fromage', category:'Food & places', difficulty:'easy', forbidden_words:['lait','vache','camembert'], hints:['nourriture','nom masculin','France'], frequency_rank:3 },
  { word:'marché', category:'Food & places', difficulty:'easy', forbidden_words:['vendre','acheter','légumes'], hints:['un lieu','nom masculin','plein air'], frequency_rank:4 },
  { word:'restaurant', category:'Food & places', difficulty:'easy', forbidden_words:['manger','dîner','menu'], hints:['un lieu','nom masculin','cuisine'], frequency_rank:5 },
  { word:'grenouille', category:'Animals', difficulty:'medium', forbidden_words:['saut','mare','vert'], hints:['animal','nom féminin','amphibien'], frequency_rank:6 },
  { word:'papillon', category:'Animals', difficulty:'easy', forbidden_words:['ailes','fleur','voler'], hints:['insecte','nom masculin','coloré'], frequency_rank:7 },
  { word:'écureuil', category:'Animals', difficulty:'hard', forbidden_words:['noix','arbre','queue'], hints:['animal','nom masculin','forêt'], frequency_rank:8 },
  { word:'dauphin', category:'Animals', difficulty:'easy', forbidden_words:['mer','nager','intelligent'], hints:['animal marin','nom masculin','saute'], frequency_rank:9 },
  { word:'hibou', category:'Animals', difficulty:'medium', forbidden_words:['nuit','forêt','sage'], hints:['oiseau','nom masculin','yeux ronds'], frequency_rank:10 },
  { word:'parapluie', category:'Objects', difficulty:'medium', forbidden_words:['pluie','eau','mouillé'], hints:['objet','nom masculin','météo'], frequency_rank:11 },
  { word:'cuillère', category:'Objects', difficulty:'easy', forbidden_words:['soupe','manger','bol'], hints:['objet','nom féminin','cuisine'], frequency_rank:12 },
  { word:'miroir', category:'Objects', difficulty:'easy', forbidden_words:['reflet','voir','verre'], hints:['objet','nom masculin','maison'], frequency_rank:13 },
  { word:'tiroir', category:'Objects', difficulty:'medium', forbidden_words:['meuble','ranger','ouvrir'], hints:['objet','nom masculin','bureau'], frequency_rank:14 },
  { word:'bougie', category:'Objects', difficulty:'easy', forbidden_words:['feu','flamme','lumière'], hints:['objet','nom féminin','romantique'], frequency_rank:15 },
  { word:'aéroport', category:'Travel', difficulty:'easy', forbidden_words:['avion','voler','valise'], hints:['lieu','nom masculin','voyage'], frequency_rank:16 },
  { word:'passeport', category:'Travel', difficulty:'easy', forbidden_words:['frontière','voyage','identité'], hints:['document','nom masculin','officiel'], frequency_rank:17 },
  { word:'hôtel', category:'Travel', difficulty:'easy', forbidden_words:['chambre','nuit','dormir'], hints:['lieu','nom masculin','séjour'], frequency_rank:18 },
  { word:'valise', category:'Travel', difficulty:'easy', forbidden_words:['voyage','bagages','emporter'], hints:['objet','nom féminin','roulettes'], frequency_rank:19 },
  { word:'itinéraire', category:'Travel', difficulty:'hard', forbidden_words:['route','voyage','plan'], hints:['nom masculin','organiser','étapes'], frequency_rank:20 },
  { word:'escale', category:'Travel', difficulty:'hard', forbidden_words:['avion','arrêt','aéroport'], hints:['voyage','pause','vol'], frequency_rank:21 },
  { word:'billet', category:'Travel', difficulty:'easy', forbidden_words:['train','bus','payer'], hints:['document','nom masculin','transport'], frequency_rank:22 },
  { word:'douane', category:'Travel', difficulty:'medium', forbidden_words:['frontière','contrôle','déclaration'], hints:['lieu','nom féminin','aéroport'], frequency_rank:23 },
  { word:'croisière', category:'Travel', difficulty:'medium', forbidden_words:['bateau','mer','vacances'], hints:['voyage','nom féminin','navire'], frequency_rank:24 },
  { word:'jalousie', category:'Emotions', difficulty:'medium', forbidden_words:['envie','autre','vouloir'], hints:['émotion','nom féminin','négatif'], frequency_rank:25 },
  { word:'nostalgie', category:'Emotions', difficulty:'hard', forbidden_words:['passé','souvenir','ancien'], hints:['émotion','nom féminin','mélancolie'], frequency_rank:26 },
  { word:'fierté', category:'Emotions', difficulty:'medium', forbidden_words:['fier','réussite','succès'], hints:['émotion','nom féminin','positif'], frequency_rank:27 },
  { word:'mélancolie', category:'Emotions', difficulty:'hard', forbidden_words:['tristesse','sombre','pensif'], hints:['émotion','nom féminin','poétique'], frequency_rank:28 },
  { word:'enthousiasme', category:'Emotions', difficulty:'medium', forbidden_words:['excité','énergie','passion'], hints:['émotion','nom masculin','positif'], frequency_rank:29 },
  { word:'honte', category:'Emotions', difficulty:'easy', forbidden_words:['rouge','gêne','erreur'], hints:['émotion','nom féminin','négatif'], frequency_rank:30 },
  { word:'soulagement', category:'Emotions', difficulty:'hard', forbidden_words:['stress','terminer','fin'], hints:['émotion','nom masculin','après inquiétude'], frequency_rank:31 },
  { word:'tendresse', category:'Emotions', difficulty:'medium', forbidden_words:['amour','doux','câlin'], hints:['émotion','nom féminin','affection'], frequency_rank:32 },
  { word:'curiosité', category:'Emotions', difficulty:'easy', forbidden_words:['savoir','questions','apprendre'], hints:['émotion','nom féminin','explorer'], frequency_rank:33 },
  { word:'courage', category:'Emotions', difficulty:'easy', forbidden_words:['peur','brave','fort'], hints:['qualité','nom masculin','positif'], frequency_rank:34 },
  { word:'chuchoter', category:'Verbs', difficulty:'hard', forbidden_words:['voix','doucement','oreille'], hints:['verbe','parler très bas','bibliothèque'], frequency_rank:35 },
  { word:'trébucher', category:'Verbs', difficulty:'hard', forbidden_words:['tomber','pied','sol'], hints:['verbe','mouvement','accident'], frequency_rank:36 },
  { word:'applaudir', category:'Verbs', difficulty:'medium', forbidden_words:['mains','bravo','concert'], hints:['verbe','geste','approbation'], frequency_rank:37 },
  { word:'bâiller', category:'Verbs', difficulty:'medium', forbidden_words:['fatigué','bouche','sommeil'], hints:['verbe','corps','involontaire'], frequency_rank:38 },
  { word:'ronfler', category:'Verbs', difficulty:'easy', forbidden_words:['dormir','nuit','bruit'], hints:['verbe','corps','sommeil'], frequency_rank:39 },
  { word:'fredonner', category:'Verbs', difficulty:'hard', forbidden_words:['chanter','musique','bouche'], hints:['verbe','mélodie','doucement'], frequency_rank:40 },
  { word:'grimacer', category:'Verbs', difficulty:'medium', forbidden_words:['visage','douleur','expression'], hints:['verbe','corps','émotion'], frequency_rank:41 },
  { word:'savourer', category:'Verbs', difficulty:'medium', forbidden_words:['goûter','apprécier','lentement'], hints:['verbe','nourriture','plaisir'], frequency_rank:42 },
  { word:'arc-en-ciel', category:'Nature', difficulty:'easy', forbidden_words:['couleurs','pluie','ciel'], hints:['phénomène','nom masculin','après pluie'], frequency_rank:43 },
  { word:'avalanche', category:'Nature', difficulty:'medium', forbidden_words:['neige','montagne','tomber'], hints:['phénomène','nom féminin','danger'], frequency_rank:44 },
  { word:'tornade', category:'Nature', difficulty:'medium', forbidden_words:['vent','tourbillon','détruire'], hints:['phénomène','nom féminin','météo'], frequency_rank:45 },
  { word:'marée', category:'Nature', difficulty:'medium', forbidden_words:['mer','eau','lune'], hints:['phénomène','nom féminin','côte'], frequency_rank:46 },
  { word:'volcan', category:'Nature', difficulty:'easy', forbidden_words:['lave','feu','éruption'], hints:['géographie','nom masculin','montagne'], frequency_rank:47 },
  { word:'chaussures', category:'Clothing', difficulty:'easy', forbidden_words:['pied','marcher','lacets'], hints:['vêtement','nom féminin pluriel','mode'], frequency_rank:48 },
  { word:'miroir', category:'Objects', difficulty:'easy', forbidden_words:['reflet','voir','glass'], hints:['objet','maison','se regarder'], frequency_rank:49 },
  { word:'nuage', category:'Nature', difficulty:'easy', forbidden_words:['ciel','pluie','blanc'], hints:['nature','nom masculin','météo'], frequency_rank:50 },
]

async function seed() {
  console.log('Seeding words...')
  const chunks = []
  for (let i = 0; i < words.length; i += 20) chunks.push(words.slice(i, i + 20))
  for (const chunk of chunks) {
    const { error } = await supabase.from('words').insert(chunk)
    if (error) { console.error('Error:', error); process.exit(1) }
    console.log(`Inserted ${chunk.length} words`)
  }
  console.log('Seed complete.')
}

seed()
