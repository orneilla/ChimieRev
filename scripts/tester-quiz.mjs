/**
 * MET LE GÉNÉRATEUR DE QUIZ À L'ÉPREUVE, sur toutes les fiches à la fois.
 *
 * Pourquoi un script plutôt que des clics : une question fausse ne se voit
 * pas en jouant. Un quiz à deux bonnes réponses s'affiche parfaitement, se
 * répond, et compte un point en moins à l'élève qui avait raison. Il faut
 * donc engendrer TOUTES les questions possibles — une par réaction — et
 * les examiner une à une.
 *
 * Et comme pour le vérificateur de mécanismes, on teste d'abord le
 * TESTEUR : on lui tend des questions fautives, et il doit les refuser.
 * Un contrôle qu'on n'a jamais vu échouer ne prouve rien.
 */
import { readFileSync } from 'fs'

const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))
const structures = JSON.parse(readFileSync('src/data/structures.json', 'utf8'))

// Le module du quiz importe ses données par `import ... from './data/x.json'`,
// ce que Node ne fait pas sans réglage. On le charge donc par Vite, qui
// sait le faire — c'est le même code que celui qui tourne dans le
// navigateur, et non une copie qui pourrait diverger.
const { createServer } = await import('vite')
const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const quiz = await serveur.ssrLoadModule('/src/quiz.js')

const anomalies = []
const NB_CHOIX = 4

function examiner(q, ou) {
  if (!q) return anomalies.push(`${ou} : aucune question engendrée.`)

  const corrects = q.choix.filter((c) => c.correct)
  if (corrects.length !== 1) {
    anomalies.push(`${ou} : ${corrects.length} bonne(s) réponse(s) au lieu d'une.`)
  }
  if (q.choix.length !== NB_CHOIX) {
    anomalies.push(`${ou} : ${q.choix.length} choix au lieu de ${NB_CHOIX}.`)
  }

  // Deux choix montrant LA MÊME image sont indiscernables à l'écran, même
  // s'ils viennent de réactions différentes.
  const fichiers = q.choix.map((c) => c.fichier)
  if (new Set(fichiers).size !== fichiers.length) {
    anomalies.push(`${ou} : deux choix affichent le même schéma.`)
  }

  // Le fond du problème : deux choix chimiquement identiques.
  const formules = q.choix.map((c) => structures[c.id]?.produit_canonique)
  if (new Set(formules).size !== formules.length) {
    anomalies.push(`${ou} : deux choix sont LA MÊME molécule (${formules.join(' / ')}).`)
  }
  if (formules.some((f) => !f)) {
    anomalies.push(`${ou} : un choix n'a pas de formule canonique.`)
  }

  // Un choix doit pointer vers un fichier réellement dessiné.
  for (const c of q.choix) {
    if (!c.fichier) anomalies.push(`${ou} : le choix « ${c.id} » n'a pas de schéma.`)
  }
  if (!q.substrat) anomalies.push(`${ou} : pas de schéma de substrat.`)
  if (!q.reactifs?.length) anomalies.push(`${ou} : aucun réactif à montrer.`)
}

// ————— 1. toutes les questions possibles, sur plusieurs graines —————
const admissibles = reactions.filter((r) => quiz.admissibleProduit(r))
let engendrees = 0
for (const reaction of admissibles) {
  for (const graine of [1, 42, 1789, 20260830]) {
    const q = quiz.questionProduit(reaction, quiz.tirage(graine))
    examiner(q, `« ${reaction.id} » (graine ${graine})`)
    engendrees++
  }
}

// ————— 2. la même graine rend la même série —————
const a = JSON.stringify(quiz.serie({ graine: 7, combien: 10 }))
const b = JSON.stringify(quiz.serie({ graine: 7, combien: 10 }))
if (a !== b) anomalies.push('la même graine rend deux séries différentes : le tirage n\'est pas reproductible.')

// ————— 3. deux graines différentes ne rendent pas la même série —————
const c = JSON.stringify(quiz.serie({ graine: 8, combien: 10 }))
if (a === c) anomalies.push('deux graines différentes rendent la même série : le tirage ne varie pas.')

// ————— 4. une série ne repose jamais deux fois la même réaction —————
for (const graine of [1, 2, 3, 99]) {
  const s = quiz.serie({ graine, combien: 20 })
  const ids = s.map((q) => q.reaction)
  if (new Set(ids).size !== ids.length) {
    anomalies.push(`série (graine ${graine}) : une réaction revient deux fois.`)
  }
}

// ————— 5. par famille, le vivier tient ses promesses —————
for (const { famille, n } of quiz.famillesJouables()) {
  const s = quiz.serie({ graine: 5, combien: 50, famille })
  if (s.length !== Math.min(n, 50)) {
    anomalies.push(`famille « ${famille} » : ${s.length} question(s) pour ${n} réaction(s) admissibles.`)
  }
  for (const q of s) examiner(q, `famille « ${famille} » / ${q.reaction}`)
}

// ————— 6. ON TESTE LE TESTEUR : les fautes tendues sont-elles vues ? —————
const piegesRefuses = []
function doitRefuser(nom, question) {
  const avant = anomalies.length
  examiner(question, 'ESSAI')
  if (anomalies.length === avant) {
    piegesRefuses.push(`✗ « ${nom} » est passé — le contrôle ne le voit pas.`)
  } else {
    anomalies.length = avant   // on efface la faute injectée
    piegesRefuses.push(`✓ ${nom} : refusé, comme il se doit.`)
  }
}
const modele = quiz.questionProduit(admissibles[0], quiz.tirage(1))
const copie = () => JSON.parse(JSON.stringify(modele))

doitRefuser('Deux bonnes réponses', (() => {
  const q = copie(); q.choix[0].correct = true; q.choix[1].correct = true; return q
})())
doitRefuser('Aucune bonne réponse', (() => {
  const q = copie(); q.choix.forEach((c) => { c.correct = false }); return q
})())
doitRefuser('Trois choix au lieu de quatre', (() => {
  const q = copie(); q.choix.pop(); return q
})())
doitRefuser('Deux fois le même schéma', (() => {
  const q = copie(); q.choix[1].fichier = q.choix[0].fichier; return q
})())
doitRefuser('Deux choix chimiquement identiques', (() => {
  const q = copie(); q.choix[1].id = q.choix[0].id; return q
})())
doitRefuser('Un choix sans schéma', (() => {
  const q = copie(); q.choix[2].fichier = null; return q
})())
doitRefuser('Aucun réactif à montrer', (() => {
  const q = copie(); q.reactifs = []; return q
})())

await serveur.close()

for (const ligne of piegesRefuses) console.log(ligne)
const rates = piegesRefuses.filter((l) => l.startsWith('✗'))
if (rates.length) {
  console.error('\n✗ Le contrôle laisse passer des questions fausses.\n')
  process.exit(1)
}
console.log('✓ Le contrôle détecte bien les questions qu\'on lui tend.\n')

if (anomalies.length) {
  console.error(`✗ ${anomalies.length} anomalie(s) dans les questions engendrées :\n`)
  for (const a of anomalies.slice(0, 30)) console.error('  • ' + a)
  if (anomalies.length > 30) console.error(`  … et ${anomalies.length - 30} autres.`)
  console.error('\nLa construction s\'arrête : un quiz faux enseigne le faux.\n')
  process.exit(1)
}

console.log(
  `✓ ${engendrees} questions engendrées et contrôlées ` +
  `(${admissibles.length} réactions admissibles, ${quiz.famillesJouables().length} familles jouables).`
)
