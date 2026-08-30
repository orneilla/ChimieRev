// Le quiz : des questions ENGENDRÉES à partir des fiches, jamais écrites.
//
// Le principe est une contrainte, pas une commodité : aucune question
// n'existe dans les données. Elles se déduisent des champs déjà présents
// dans reactions.json. Écrire une fiche, c'est donc écrire ses questions
// — et corriger une fiche corrige ses questions du même coup. Une banque
// de questions tenue à la main aurait dérivé de la première correction.
//
// Ce fichier ne contient AUCUN élément d'affichage. Il rend des objets, et
// scripts/tester-quiz.mjs les met à l'épreuve sans navigateur : c'est ce
// qui permet de vérifier les 275 fiches d'un coup, ce qu'aucun clic ne
// ferait.
import reactions from './data/reactions.json'
import structures from './data/structures.json'
import { ordonner } from './memorisation.js'

const NB_CHOIX = 4

/**
 * Un tirage REPRODUCTIBLE.
 *
 * Math.random ne convient pas : deux rendus du même composant donneraient
 * deux questions différentes, et React rend plus d'une fois. La question
 * doit donc être une FONCTION de sa graine — même graine, même question,
 * y compris après un rechargement ou un retour en arrière.
 *
 * mulberry32 : petit générateur à état 32 bits, largement suffisant ici.
 */
export function tirage(graine) {
  let etat = graine >>> 0
  return function suivant() {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mélange une liste sans la modifier (Fisher-Yates). */
function melanger(liste, suivant) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(suivant() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

/**
 * Les distracteurs, pris D'ABORD dans la même famille.
 *
 * C'est le réglage de la difficulté, et il tire dans deux sens opposés.
 * Pris au hasard dans toute la base, un distracteur est ABSURDE — on
 * répond juste sans rien savoir, parce qu'un seul des quatre produits
 * ressemble au substrat. Pris uniquement dans la même famille, il devient
 * parfois indiscernable. On épuise donc la famille d'abord, puis on
 * complète ailleurs : la question reste faisable, et il faut savoir.
 *
 * `empreinte` dit ce que deux choix ont en commun quand ils sont, en
 * fait, la même réponse. On les écarte au fur et à mesure PLUTÔT QUE de
 * filtrer une bonne fois : écarter d'avance ceux qui égalent la bonne
 * réponse ne suffit pas, puisque deux DISTRACTEURS peuvent s'égaler entre
 * eux. Le testeur l'a montré sur l'élimination de Peterson, où deux
 * mauvaises réponses rendaient toutes deux le 2-méthylpropène.
 */
function distracteurs(bonne, candidats, suivant, combien, empreinte) {
  const memeFamille = candidats.filter((r) => r.famille === bonne.famille)
  const ailleurs = candidats.filter((r) => r.famille !== bonne.famille)
  const ordre = [
    ...melanger(memeFamille, suivant),
    ...melanger(ailleurs, suivant)
  ]

  const prises = new Set([empreinte(bonne)])
  const retenus = []
  for (const candidat of ordre) {
    if (retenus.length === combien) break
    const marque = empreinte(candidat)
    if (!marque || prises.has(marque)) continue
    prises.add(marque)
    retenus.push(candidat)
  }
  return retenus
}

/**
 * Le premier paragraphe d'un texte long, borné.
 *
 * Les fiches ouvrent leur champ `selectivite` sur une amorce en capitales
 * qui énonce la règle — « MARKOVNIKOV À L'ENVERS », « LA LOI DE VITESSE
 * EST D'ORDRE 2 ». C'est exactement ce qu'il faut rappeler après une
 * réponse ; la suite est le cours, et le cours est sur la fiche.
 */
function amorce(texte) {
  if (!texte) return null
  const premier = texte.split('\n\n')[0].trim()
  if (premier.length <= 400) return premier
  // Un premier paragraphe démesuré se coupe à la fin d'une phrase, pas au
  // milieu d'un mot.
  const coupe = premier.slice(0, 400)
  const fin = Math.max(coupe.lastIndexOf('. '), coupe.lastIndexOf('» '))
  return (fin > 150 ? coupe.slice(0, fin + 1) : coupe.trimEnd() + '…')
}

// ————————————————————————————————————————————————————————————
// Type 1 — « Quel est le produit ? »
// ————————————————————————————————————————————————————————————

/**
 * Une réaction peut-elle servir de question « quel est le produit ? » ?
 *
 * Il lui faut ses deux structures dessinées et des réactifs à montrer :
 * sans les réactifs, la question n'a pas de réponse déterminée — un même
 * substrat donne des produits différents selon ce qu'on y met, et c'est
 * précisément ce que la question teste.
 */
export function admissibleProduit(reaction) {
  const s = structures[reaction.id]
  return Boolean(
    s && s.substrat && s.produit && s.produit_canonique &&
    Array.isArray(reaction.reactifs) && reaction.reactifs.length > 0
  )
}

/**
 * Engendre une question « quel est le produit ? ».
 *
 * LE PIÈGE, et il ne se voit pas en relisant les données : deux réactions
 * différentes peuvent avoir LE MÊME produit — trente le sont dans cette
 * base, et trois réactions rendent l'éthanol. Proposer l'une comme
 * mauvaise réponse à l'autre donnerait une question à deux bonnes
 * réponses, que l'élève marquerait comme fausse à raison.
 *
 * Deux SMILES ne se comparent pas signe pour signe : « OCC » et « CCO »
 * sont la même molécule. On compare donc les formes CANONIQUES, calculées
 * par RDKit à la construction et rangées dans structures.json.
 */
export function questionProduit(reaction, suivant) {
  const bonne = structures[reaction.id]

  const candidats = reactions.filter(
    (autre) => autre.id !== reaction.id && admissibleProduit(autre)
  )

  // Ce qui rend deux choix indistinguables : le même produit. Comparé sous
  // sa forme canonique, sans quoi « OCC » et « CCO » passeraient pour deux
  // réponses différentes alors que c'est l'éthanol dans les deux cas.
  const faux = distracteurs(
    reaction, candidats, suivant, NB_CHOIX - 1,
    (r) => structures[r.id]?.produit_canonique
  )

  const choix = melanger([
    { id: reaction.id, fichier: bonne.produit, correct: true },
    ...faux.map((r) => ({
      id: r.id,
      fichier: structures[r.id].produit,
      correct: false
    }))
  ], suivant)

  return {
    type: 'produit',
    reaction: reaction.id,
    intitule: 'Quel est le produit de cette transformation ?',
    substrat: bonne.substrat,
    reactifs: reaction.reactifs,
    solvant: reaction.solvant,
    choix,
    // De quoi justifier la réponse une fois donnée : on n'apprend rien
    // d'un « faux » sec.
    //
    // Mais on ne recopie pas le champ `selectivite` en entier : c'est le
    // texte de référence de la fiche, dix paragraphes par endroits, et
    // affiché tel quel il enterrait le bouton « question suivante ». Après
    // une réponse, on veut la RAISON en une phrase et un lien vers la
    // fiche pour qui veut tout — pas le cours.
    explication: {
      nom: reaction.nom,
      famille: reaction.famille,
      pourquoi: amorce(reaction.selectivite)
    }
  }
}

// ————————————————————————————————————————————————————————————
// La série
// ————————————————————————————————————————————————————————————

/** Les réactions utilisables, éventuellement bornées à une famille. */
export function vivier(famille) {
  return reactions.filter(
    (r) => admissibleProduit(r) && (!famille || r.famille === famille)
  )
}

/** Les familles qui ont de quoi remplir un quiz. */
export function famillesJouables() {
  const compte = new Map()
  for (const r of vivier()) {
    compte.set(r.famille, (compte.get(r.famille) || 0) + 1)
  }
  return [...compte.entries()]
    .filter(([, n]) => n >= 2)
    .map(([famille, n]) => ({ famille, n }))
    .sort((a, b) => a.famille.localeCompare(b.famille, 'fr'))
}

/**
 * Une série de questions, tirée d'une graine.
 *
 * On tire les RÉACTIONS d'abord, puis on engendre chaque question avec sa
 * propre suite : ainsi la même graine rend toujours la même série, et
 * changer le nombre de questions ne rebat pas les premières.
 *
 * `etat` est la progression de l'élève (voir src/memorisation.js). Quand
 * il est fourni, l'ordre n'est plus un simple mélange : les réactions
 * échues et mal sues passent devant, puis celles jamais rencontrées, puis
 * l'entretien. Le mélange subsiste À L'INTÉRIEUR de chaque rang — sans
 * quoi deux séances de suite reposeraient les mêmes questions dans le
 * même ordre, et l'on réviserait la position d'une réponse.
 *
 * On le passe en ARGUMENT plutôt que de le lire ici : le module resterait
 * sinon impossible à éprouver hors d'un navigateur, alors que c'est
 * précisément ce qui permet de simuler des mois de révision.
 */
export function serie({ graine, combien = 10, famille = null, etat = null, maintenant = Date.now() }) {
  const disponibles = vivier(famille)
  if (disponibles.length === 0) return []

  const suivant = tirage(graine)
  const ordre = etat
    ? ordonner(disponibles, etat, maintenant, suivant)
    : melanger(disponibles, suivant)

  return ordre.slice(0, combien).map((reaction, rang) =>
    questionProduit(reaction, tirage(graine + rang * 7919))
  )
}
