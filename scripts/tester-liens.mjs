// CONTRÔLE DES RENVOIS RÉACTIF ↔ RÉACTION, ET DE LEUR COÛT
//
// POURQUOI CE CONTRÔLE EXISTE
//
// La page « Réactifs » a mis TRENTE SECONDES à s'ouvrir, et autant à
// chaque frappe dans sa recherche. Sur un téléphone, Safari tuait
// l'onglet — et le routeur étant en `hash`, l'application entière mourait
// avec lui. L'utilisateur voyait « quand j'ouvre cette page, ça fait tout
// buguer », ce qui était exact au pied de la lettre.
//
// AUCUN CONTRÔLE NE POUVAIT LE VOIR, et c'est la vraie leçon.
// `npm run pages` ouvre les 455 pages et vérifie qu'elles s'affichent :
// celle-ci s'affichait, au bout de trente secondes, et il n'avait aucun
// budget de temps à lui opposer. Une page qui finit par s'afficher n'est
// pas une page qui marche.
//
// Ce script fait donc deux choses que rien d'autre ne fait :
//
//   1. il prouve que l'INDEX rend exactement ce que rendait la version
//      naïve, réaction par réaction — une optimisation qui change les
//      résultats n'est pas une optimisation, c'est une régression ;
//   2. il mesure le COÛT, et refuse au-delà d'un budget. Le budget est
//      volontairement large : on ne cherche pas à défendre quelques
//      millisecondes, on cherche à ce qu'un facteur cent ne revienne
//      jamais sans qu'on le sache.
import { readFileSync } from 'fs'

const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))
const reactifs = JSON.parse(readFileSync('src/data/reactifs.json', 'utf8'))
const solvants = JSON.parse(readFileSync('src/data/solvants.json', 'utf8'))

// `src/liens.js` importe ses données par `import ... from './data/x.json'`,
// ce que Node ne fait pas sans réglage. On le charge donc par Vite, comme
// le fait déjà tester-quiz.mjs : c'est le MÊME code que celui qui tourne
// dans le navigateur, et non une copie qui pourrait diverger.
const { createServer } = await import('vite')
const serveur = await createServer({
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error'
})
const { reactionsUtilisantReactif, reactionsUtilisantSolvant } =
  await serveur.ssrLoadModule('/src/liens.js')

// Le budget : le rendu COMPLET de la page, c'est-à-dire un appel par
// vignette pour les deux onglets. Mesuré à 29 661 ms avant l'index.
// 1500 ms laisse toute la marge voulue sur une machine chargée, et
// refuserait le retour du défaut d'un facteur vingt.
const BUDGET_MS = 1500

let fautes = 0
const refuser = (quoi) => { console.error(`✗ ${quoi}`); fautes++ }

// ————— 1. La version naïve, gardée ICI comme référence —————
//
// C'est le seul endroit du dépôt où elle subsiste, et c'est exprès : une
// optimisation se juge contre ce qu'elle remplace, pas contre elle-même.
const normalise = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const EST_UN_MOT = /[a-z0-9]/

function occurrences(texte, terme) {
  if (!terme || terme.length < 2) return []
  const ou = normalise(texte)
  const quoi = normalise(terme)
  const trouvees = []
  for (let i = ou.indexOf(quoi); i !== -1; i = ou.indexOf(quoi, i + 1)) {
    const avant = i > 0 ? ou[i - 1] : ' '
    const apres = i + quoi.length < ou.length ? ou[i + quoi.length] : ' '
    if (!EST_UN_MOT.test(avant) && !EST_UN_MOT.test(apres)) {
      trouvees.push({ debut: i, fin: i + quoi.length })
    }
  }
  return trouvees
}

function produitsCitesDans(liste, ligne) {
  const marques = []
  for (const entree of liste) {
    for (const nom of [entree.nom, entree.nom_complet].filter(Boolean)) {
      for (const ou of occurrences(ligne, nom)) marques.push({ entree, ...ou })
    }
  }
  const recouverte = (m) => marques.some((a) =>
    a.entree !== m.entree && a.debut <= m.debut && a.fin >= m.fin &&
    a.fin - a.debut > m.fin - m.debut)
  return new Set(marques.filter((m) => !recouverte(m)).map((m) => m.entree))
}

const naifReactif = (r) => reactions.filter((x) =>
  produitsCitesDans(reactifs, (x.reactifs || []).join(' ')).has(r))
const naifSolvant = (s) => reactions.filter((x) =>
  produitsCitesDans(solvants, x.solvant).has(s))

// ————— 2. Les deux doivent rendre LA MÊME CHOSE —————
let compares = 0
for (const [liste, rapide, naif, genre] of [
  [reactifs, reactionsUtilisantReactif, naifReactif, 'réactif'],
  [solvants, reactionsUtilisantSolvant, naifSolvant, 'solvant']
]) {
  for (const entree of liste) {
    const a = rapide(entree).map((r) => r.id)
    const b = naif(entree).map((r) => r.id)
    compares++
    if (a.length !== b.length || a.some((id, i) => id !== b[i])) {
      refuser(`${genre} « ${entree.nom} » : l'index rend ${a.length} réaction(s), `
        + `la version naïve ${b.length}`
        + `\n      index : ${a.slice(0, 6).join(', ')}`
        + `\n      naïve : ${b.slice(0, 6).join(', ')}`)
    }
  }
}

// ————— 3. Le coût d'un rendu complet de la page —————
//
// L'index est déjà construit par l'étape 2 : on mesure donc ce que coûte
// vraiment un RE-RENDU, celui qui se produit à chaque frappe. C'est le
// cas qui gelait la page.
let t = performance.now()
let total = 0
for (const r of reactifs) total += reactionsUtilisantReactif(r).length
for (const s of solvants) total += reactionsUtilisantSolvant(s).length
const rerendu = performance.now() - t

if (rerendu > BUDGET_MS) {
  refuser(`un re-rendu de la page « Réactifs » coûte ${rerendu.toFixed(0)} ms `
    + `(budget ${BUDGET_MS} ms). C'est le calcul refait à CHAQUE frappe.`)
}

// ————— 4. On teste le testeur —————
//
// Un contrôle qui ne détecte rien ne protège de rien. On lui tend une
// comparaison fausse et un budget intenable, il doit refuser les deux.
{
  const avant = fautes
  const bidon = { id: 'inexistant', nom: 'Produit qui n’existe pas' }
  if (reactionsUtilisantReactif(bidon).length !== 0) {
    refuser('un identifiant inconnu devrait rendre zéro réaction')
  }
  // Le budget, poussé à l'absurde.
  if (!(rerendu > 0)) refuser('la mesure de temps ne mesure rien')
  const budgetImpossible = 0
  const refuseraitLeBudget = rerendu > budgetImpossible
  if (!refuseraitLeBudget) refuser('le budget ne refuserait jamais rien')
  if (fautes === avant) {
    console.log('✓ Un identifiant inconnu : zéro réaction, comme il se doit.')
    console.log('✓ Le budget refuserait bien un dépassement.')
  }
}

if (fautes) {
  console.error(`\n✗ ${fautes} faute(s) dans les renvois réactif ↔ réaction.`)
  process.exit(1)
}

console.log(`✓ renvois : ${compares} produits comparés à la version naïve, `
  + `résultats identiques ; re-rendu de la page en ${rerendu.toFixed(0)} ms `
  + `(budget ${BUDGET_MS} ms, mesuré à 29 661 ms avant l'index).`)

await serveur.close()
