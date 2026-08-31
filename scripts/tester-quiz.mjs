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

/** Ce qui rend deux choix indistinguables, selon le type de question. */
function empreinteDuChoix(q, choix) {
  if (q.type === 'produit') return structures[choix.id]?.produit_canonique
  return (choix.texte || []).join(' | ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim()
}

function examiner(q, ou) {
  if (!q) return anomalies.push(`${ou} : aucune question engendrée.`)

  // Le type « ordre » n'est pas un QCM : il s'examine à part.
  if (q.format === 'ordre') return examinerOrdre(q, ou)

  const corrects = q.choix.filter((c) => c.correct)
  if (corrects.length !== 1) {
    anomalies.push(`${ou} : ${corrects.length} bonne(s) réponse(s) au lieu d'une.`)
  }
  if (q.choix.length !== NB_CHOIX) {
    anomalies.push(`${ou} : ${q.choix.length} choix au lieu de ${NB_CHOIX}.`)
  }

  // Deux choix montrant LA MÊME image sont indiscernables à l'écran, même
  // s'ils viennent de réactions différentes. Ne vaut que pour les
  // questions à choix dessinés : ailleurs, `fichier` est absent partout.
  if (q.format === 'choix-image') {
    const fichiers = q.choix.map((c) => c.fichier)
    if (new Set(fichiers).size !== fichiers.length) {
      anomalies.push(`${ou} : deux choix affichent le même schéma.`)
    }
  }

  // LE FOND DU PROBLÈME : deux choix qui sont la même réponse. Ce que
  // « la même » veut dire dépend du type — la même molécule pour un
  // produit, les mêmes conditions écrites autrement pour un réactif ou
  // un solvant.
  const empreintes = q.choix.map((c) => empreinteDuChoix(q, c))
  if (new Set(empreintes).size !== empreintes.length) {
    anomalies.push(`${ou} : deux choix sont LA MÊME réponse (${empreintes.join(' / ')}).`)
  }
  if (empreintes.some((e) => !e)) {
    anomalies.push(`${ou} : un choix n'a pas d'empreinte comparable.`)
  }

  // ET DEUX RÉPONSES TEXTUELLES DONT L'UNE COMMENCE PAR L'AUTRE se valent
  // à l'œil : « THF » contre « THF anhydre », « eau » contre « eau
  // tamponnée ». La règle ne vaut QUE pour du texte : sur un SMILES
  // canonique elle n'a aucun sens — « C=CC » est le propène et « C=CCC »
  // le butène, deux molécules parfaitement distinctes dont l'une s'écrit
  // par hasard comme le début de l'autre.
  if (q.format === 'choix-texte') {
  for (let i = 0; i < empreintes.length; i++) {
    for (let j = i + 1; j < empreintes.length; j++) {
      if (empreintes[i].startsWith(empreintes[j]) || empreintes[j].startsWith(empreintes[i])) {
        anomalies.push(
          `${ou} : « ${empreintes[i]} » et « ${empreintes[j]} » ne s'opposent pas.`)
      }
    }
  }
  }

  if (q.format === 'choix-image') {
    for (const c of q.choix) {
      if (!c.fichier) anomalies.push(`${ou} : le choix « ${c.id} » n'a pas de schéma.`)
    }
  } else {
    for (const c of q.choix) {
      if (!c.texte?.length || c.texte.some((t) => !t || !t.trim())) {
        anomalies.push(`${ou} : un choix n'a pas de texte à afficher.`)
      }
    }
  }
  if (!q.substrat) anomalies.push(`${ou} : pas de schéma de substrat.`)
  if (!q.intitule) anomalies.push(`${ou} : pas d'intitulé.`)

  // LE TYPE « PRODUIT » NE PEUT PAS SE PASSER DES RÉACTIFS : sans eux la
  // question n'a pas de réponse déterminée — un même substrat donne des
  // produits différents selon ce qu'on y met, et c'est précisément ce
  // qu'elle teste. Les autres types n'en ont pas besoin.
  if (q.type === 'produit' && !q.reactifs?.length) {
    anomalies.push(`${ou} : aucun réactif à montrer, la question n'a pas de réponse.`)
  }
}

/**
 * Le type « ordre » : il n'a pas de choix, mais des propositions et une
 * suite attendue.
 */
function examinerOrdre(q, ou) {
  if (q.propositions.length !== q.ordreAttendu.length) {
    anomalies.push(`${ou} : ${q.propositions.length} propositions pour ` +
      `${q.ordreAttendu.length} étapes attendues.`)
  }
  if (q.ordreAttendu.length < 3) {
    anomalies.push(`${ou} : ${q.ordreAttendu.length} étapes, c'est trop peu pour un ordre.`)
  }
  const trie = (l) => [...l].sort()
  if (trie(q.propositions).join('§') !== trie(q.ordreAttendu).join('§')) {
    anomalies.push(`${ou} : les propositions ne sont pas les étapes attendues mélangées.`)
  }
  if (new Set(q.propositions).size !== q.propositions.length) {
    anomalies.push(`${ou} : une étape figure deux fois dans les propositions.`)
  }
  // PROPOSER LES ÉTAPES DÉJÀ RANGÉES serait une question sans question.
  if (q.propositions.every((e, i) => e === q.ordreAttendu[i])) {
    anomalies.push(`${ou} : les étapes sont proposées dans le bon ordre.`)
  }
  if (!q.substrat) anomalies.push(`${ou} : pas de schéma de substrat.`)
}

// ————— 1. toutes les questions possibles, sur plusieurs graines —————
const admissibles = reactions.filter((r) => quiz.typesPossibles(r).length > 0)
let engendrees = 0
const parType = {}
for (const reaction of admissibles) {
  // CHAQUE type possible sur CHAQUE réaction, sur plusieurs graines : c'est
  // le seul moyen de voir une question à deux bonnes réponses, qui
  // s'afficherait parfaitement et compterait un point en moins à l'élève
  // qui avait raison.
  for (const t of quiz.typesPossibles(reaction)) {
    for (const graine of [1, 42, 1789, 20260830]) {
      const q = quiz.question(reaction, quiz.tirage(graine), t.nom)
      examiner(q, `« ${reaction.id} » / ${t.nom} (graine ${graine})`)
      if (q) parType[q.type] = (parType[q.type] || 0) + 1
      engendrees++
    }
  }
}
// Les cinq types doivent être effectivement engendrés : un type qu'aucune
// fiche n'admet passerait inaperçu.
for (const t of quiz.TYPES) {
  if (!parType[t.nom]) anomalies.push(`aucune question de type « ${t.nom} » n'a pu être engendrée.`)
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
// Les fautes se tendent sur une question de type « produit », dont on
// connaît la forme ; un modèle tiré au hasard changerait de type d'une
// exécution à l'autre et les essais ne porteraient plus sur la même chose.
const temoin = admissibles.find((r) => quiz.admissibleProduit(r))
const modele = quiz.questionProduit(temoin, quiz.tirage(1))
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

// Les types à réponse TEXTUELLE ont leurs propres façons d'être faux.
const modeleTexte = quiz.questionSolvant(
  admissibles.find((r) => quiz.admissibleSolvant(r)), quiz.tirage(1))
const copieTexte = () => JSON.parse(JSON.stringify(modeleTexte))

doitRefuser('Deux solvants dont l\'un commence par l\'autre', (() => {
  const q = copieTexte()
  q.choix[1].texte = [q.choix[0].texte[0] + ' anhydre']
  return q
})())

doitRefuser('Un choix textuel vide', (() => {
  const q = copieTexte(); q.choix[2].texte = ['   ']; return q
})())

// Et le type « ordre », qui n'est pas un QCM.
const modeleOrdre = quiz.questionOrdre(
  admissibles.find((r) => quiz.admissibleOrdre(r)), quiz.tirage(1))
const copieOrdre = () => JSON.parse(JSON.stringify(modeleOrdre))

doitRefuser('Des étapes proposées déjà dans l\'ordre', (() => {
  const q = copieOrdre(); q.propositions = [...q.ordreAttendu]; return q
})())

doitRefuser('Une étape manquante dans les propositions', (() => {
  const q = copieOrdre(); q.propositions = q.propositions.slice(1); return q
})())

doitRefuser('Une étape qui ne vient pas du mécanisme', (() => {
  const q = copieOrdre(); q.propositions[0] = 'Une étape inventée de toutes pièces.'; return q
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
