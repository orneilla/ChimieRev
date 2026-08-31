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
import { ordonner, rang, graineDuJour, jourCivil } from './memorisation.js'

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
function distracteurs(bonne, candidats, suivant, combien, empreinte,
  { memeFamilleDAbord = true, conflit = null } = {}) {
  const memeFamille = candidats.filter((r) => r.famille === bonne.famille)
  const ailleurs = candidats.filter((r) => r.famille !== bonne.famille)
  const ordre = memeFamilleDAbord
    ? [...melanger(memeFamille, suivant), ...melanger(ailleurs, suivant)]
    // Le type « piège » inverse la règle : voir questionPiege — un piège
    // de la même famille risque de s'appliquer VRAIMENT à la réaction
    // posée, ce qui ferait une question à deux bonnes réponses.
    : [...melanger(ailleurs, suivant), ...melanger(memeFamille, suivant)]

  // `conflit` dit quand deux réponses se valent SANS être identiques —
  // « THF » et « THF anhydre », « eau » et « eau ou éthanol ». On le
  // consulte contre TOUTES les empreintes déjà prises, non contre la
  // seule bonne réponse : le testeur a montré que deux distracteurs
  // pouvaient se recouvrir entre eux, « KOH » contre « KOH, chauffage ».
  const prises = [empreinte(bonne)]
  const retenus = []
  for (const candidat of ordre) {
    if (retenus.length === combien) break
    const marque = empreinte(candidat)
    if (!marque) continue
    if (prises.some((p) => p === marque || (conflit && conflit(p, marque)))) continue
    prises.push(marque)
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
    format: 'choix-image',
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
// Type 2 — « Quel réactif réalise cette transformation ? »
// ————————————————————————————————————————————————————————————

/** Sans accent ni casse, pour comparer deux conditions écrites autrement. */
function aplati(texte) {
  return (texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * L'un commence-t-il par l'autre ?
 *
 * C'est le cas dangereux du solvant : « THF » et « THF anhydre » sont deux
 * réponses différentes dans les données et la MÊME réponse pour l'élève,
 * qui serait marqué faux pour une distinction que la question n'enseigne
 * pas. Idem pour « eau » et « eau, tampon à pH physiologique ».
 */
function seChevauchent(a, b) {
  return a.startsWith(b) || b.startsWith(a)
}

export function admissibleReactif(reaction) {
  const s = structures[reaction.id]
  return Boolean(
    s && s.substrat && s.produit &&
    Array.isArray(reaction.reactifs) && reaction.reactifs.length > 0
  )
}

const empreinteReactifs = (r) => aplati((r.reactifs || []).join(' | '))

export function questionReactif(reaction, suivant) {
  const s = structures[reaction.id]
  const candidats = reactions.filter(
    (a) => a.id !== reaction.id && admissibleReactif(a))
  // Deux jeux de conditions dont l'un commence par l'autre se confondent à
  // l'œil : « KOH » contre « KOH, chauffage ».
  const faux = distracteurs(reaction, candidats, suivant, NB_CHOIX - 1,
    empreinteReactifs, { conflit: seChevauchent })

  const choix = melanger([
    { id: reaction.id, texte: reaction.reactifs, correct: true },
    ...faux.map((r) => ({ id: r.id, texte: r.reactifs, correct: false }))
  ], suivant)

  return {
    type: 'reactif',
    format: 'choix-texte',
    reaction: reaction.id,
    intitule: 'Quels réactifs réalisent cette transformation ?',
    substrat: s.substrat,
    produit: s.produit,
    choix,
    explication: {
      nom: reaction.nom,
      famille: reaction.famille,
      pourquoi: amorce(reaction.selectivite)
    }
  }
}

// ————————————————————————————————————————————————————————————
// Type 3 — « Quel est le solvant adapté ? »
// ————————————————————————————————————————————————————————————

/**
 * Six fiches portent « Aucun : ce n'est pas une réaction » — les fiches de
 * méthode, comme l'analyse rétrosynthétique. Leur poser la question du
 * solvant n'aurait pas de sens.
 */
export function admissibleSolvant(reaction) {
  const s = structures[reaction.id]
  const solvant = aplati(reaction.solvant)
  return Boolean(
    s && s.substrat && s.produit &&
    solvant.length >= 3 && !solvant.startsWith('aucun')
  )
}

const empreinteSolvant = (r) => aplati(r.solvant)

export function questionSolvant(reaction, suivant) {
  const s = structures[reaction.id]
  const candidats = reactions.filter(
    (a) => a.id !== reaction.id && admissibleSolvant(a))
  // « eau » et « eau, tampon à pH physiologique » ne peuvent pas s'opposer
  // dans la même question : mesuré, 27 fiches se partagent l'eau sous une
  // forme ou une autre, et « sans solvant » côtoie « sans solvant, à chaud ».
  const faux = distracteurs(reaction, candidats, suivant, NB_CHOIX - 1,
    empreinteSolvant, { conflit: seChevauchent })

  const choix = melanger([
    { id: reaction.id, texte: [reaction.solvant], correct: true },
    ...faux.map((r) => ({ id: r.id, texte: [r.solvant], correct: false }))
  ], suivant)

  return {
    type: 'solvant',
    format: 'choix-texte',
    reaction: reaction.id,
    intitule: 'Dans quel solvant cette réaction se fait-elle ?',
    substrat: s.substrat,
    produit: s.produit,
    reactifs: reaction.reactifs,
    choix,
    explication: {
      nom: reaction.nom,
      famille: reaction.famille,
      pourquoi: amorce(reaction.selectivite)
    }
  }
}

// ————————————————————————————————————————————————————————————
// Type 4 — « Quel est le piège de cette réaction ? »
// ————————————————————————————————————————————————————————————

/**
 * La première phrase d'un piège, qui en est l'énoncé.
 *
 * Les fiches écrivent leurs pièges en deux temps : une amorce en
 * capitales qui NOMME la faute, puis son explication. Un piège fait 151
 * signes en médiane et jusqu'à 685 ; quatre d'entre eux en entier
 * feraient un mur. On propose donc l'amorce, et la correction montre le
 * piège complet.
 */
function enonceDuPiege(piege) {
  const coupe = (piege || '').match(/^[^.:]{10,180}[.:]/)
  return (coupe ? coupe[0] : (piege || '').slice(0, 180)).replace(/[.:]$/, '')
}

export function admissiblePiege(reaction) {
  const s = structures[reaction.id]
  return Boolean(
    s && s.substrat && Array.isArray(reaction.pieges) && reaction.pieges.length > 0
  )
}

export function questionPiege(reaction, suivant) {
  const s = structures[reaction.id]
  // La fiche en porte jusqu'à sept : on en tire un, à la graine.
  const lePiege = reaction.pieges[Math.floor(suivant() * reaction.pieges.length)]

  const empreinte = (r) => aplati(enonceDuPiege((r.pieges || [])[0]))
  const candidats = reactions.filter(
    (a) => a.id !== reaction.id && admissiblePiege(a) &&
    !(a.pieges || []).some((p) => aplati(enonceDuPiege(p)) === aplati(enonceDuPiege(lePiege)))
  )

  // POUR CE TYPE SEULEMENT, on s'éloigne de la famille au lieu de s'en
  // rapprocher. Un piège de la même famille est le distracteur le plus
  // trompeur ET le plus susceptible de s'appliquer VRAIMENT à la réaction
  // posée — la pire combinaison, puisqu'elle rendrait la question à deux
  // bonnes réponses sans qu'aucun contrôle ne le voie.
  const faux = distracteurs(reaction, candidats, suivant, NB_CHOIX - 1, empreinte,
    { memeFamilleDAbord: false })

  const choix = melanger([
    { id: reaction.id, texte: [enonceDuPiege(lePiege)], correct: true },
    ...faux.map((r) => ({ id: r.id, texte: [enonceDuPiege(r.pieges[0])], correct: false }))
  ], suivant)

  return {
    type: 'piege',
    format: 'choix-texte',
    reaction: reaction.id,
    intitule: `Quel piège guette dans « ${reaction.nom} » ?`,
    substrat: s.substrat,
    produit: s.produit,
    choix,
    explication: {
      nom: reaction.nom,
      famille: reaction.famille,
      // Ici la correction montre le piège ENTIER : c'est ce qu'on vient
      // d'apprendre, et l'option n'en donnait que l'énoncé.
      pourquoi: lePiege
    }
  }
}

// ————————————————————————————————————————————————————————————
// Type 5 — « Remettez les étapes du mécanisme dans l'ordre »
// ————————————————————————————————————————————————————————————

export const ETAPES_MINIMUM = 3
export const ETAPES_MAXIMUM = 5

export function admissibleOrdre(reaction) {
  const s = structures[reaction.id]
  return Boolean(
    s && s.substrat && s.produit &&
    Array.isArray(reaction.mecanisme_etapes) &&
    reaction.mecanisme_etapes.length >= ETAPES_MINIMUM
  )
}

/**
 * Ce type n'a pas de distracteurs : les mauvaises réponses sont les
 * mauvais ORDRES, et il y en a déjà cinq mille pour sept étapes.
 *
 * On borne à cinq étapes. Au-delà, remettre sept propositions dans
 * l'ordre sur un téléphone tient de la corvée plus que de la révision, et
 * la probabilité de tomber juste par accident est de toute façon nulle.
 */
export function questionOrdre(reaction, suivant) {
  const s = structures[reaction.id]
  const etapes = reaction.mecanisme_etapes.slice(0, ETAPES_MAXIMUM)

  // On mélange jusqu'à obtenir un ordre DIFFÉRENT du bon : proposer les
  // étapes déjà rangées serait une question sans question.
  let propose = melanger(etapes, suivant)
  for (let essai = 0; essai < 8 && propose.every((e, i) => e === etapes[i]); essai++) {
    propose = melanger(etapes, suivant)
  }

  return {
    type: 'ordre',
    format: 'ordre',
    reaction: reaction.id,
    intitule: 'Remettez les étapes du mécanisme dans l\'ordre',
    substrat: s.substrat,
    produit: s.produit,
    reactifs: reaction.reactifs,
    // Les étapes mélangées, et la bonne suite pour corriger.
    propositions: propose,
    ordreAttendu: etapes,
    explication: {
      nom: reaction.nom,
      famille: reaction.famille,
      pourquoi: amorce(reaction.selectivite)
    }
  }
}

/**
 * La suite proposée est-elle la bonne ?
 *
 * Tout ou rien : la répétition espacée ne connaît que juste ou faux, et
 * une note partielle n'aurait rien à quoi se raccrocher. Trois étapes sur
 * quatre bien placées, c'est un mécanisme qu'on ne sait pas encore.
 */
export function ordreEstJuste(question, choisies) {
  return question.ordreAttendu.length === choisies.length &&
    question.ordreAttendu.every((e, i) => e === choisies[i])
}

// ————————————————————————————————————————————————————————————
// Le choix du type
// ————————————————————————————————————————————————————————————

/** Les cinq types, avec ce qu'il faut pour les poser et comment les poser. */
export const TYPES = [
  { nom: 'produit', admissible: admissibleProduit, engendrer: questionProduit },
  { nom: 'reactif', admissible: admissibleReactif, engendrer: questionReactif },
  { nom: 'solvant', admissible: admissibleSolvant, engendrer: questionSolvant },
  { nom: 'piege', admissible: admissiblePiege, engendrer: questionPiege },
  { nom: 'ordre', admissible: admissibleOrdre, engendrer: questionOrdre }
]

/** Les types qu'une réaction peut servir. */
export function typesPossibles(reaction) {
  return TYPES.filter((t) => t.admissible(reaction))
}

/**
 * Une question sur cette réaction, d'un type tiré à la graine.
 *
 * Le type VARIE d'un passage à l'autre, et c'est voulu : revoir la même
 * réaction sous un autre angle vaut mieux que la revoir à l'identique.
 * C'est aussi ce qui empêche d'apprendre la position de la bonne réponse
 * plutôt que la chimie.
 */
export function question(reaction, suivant, typeImpose = null) {
  const possibles = typesPossibles(reaction)
  if (possibles.length === 0) return null
  const choisi = typeImpose
    ? possibles.find((t) => t.nom === typeImpose) || possibles[0]
    : possibles[Math.floor(suivant() * possibles.length)]
  return choisi.engendrer(reaction, suivant)
}

// ————————————————————————————————————————————————————————————
// La série
// ————————————————————————————————————————————————————————————

/**
 * Les réactions utilisables, éventuellement bornées à une famille.
 *
 * « Utilisable » veut dire : au moins un des cinq types de questions peut
 * être posé dessus. Une fiche de méthode sans solvant reste interrogeable
 * sur ses pièges.
 */
export function vivier(famille) {
  return reactions.filter(
    (r) => typesPossibles(r).length > 0 && (!famille || r.famille === famille)
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
    question(reaction, tirage(graine + rang * 7919))
  )
}


// ————————————————————————————————————————————————————————————
// LA RÉVISION DU JOUR
// ————————————————————————————————————————————————————————————

export const PAQUET_MINIMUM = 5
export const PAQUET_MAXIMUM = 10
export const NEUVES_PAR_PAQUET = 2

/**
 * Ce que contient le paquet du jour, avant d'engendrer les questions.
 *
 * LA RÈGLE QUI COMMANDE TOUT : une nouveauté ne déloge JAMAIS une
 * révision due. On mesure ailleurs (voir memorisation.js) qu'une part
 * fixe réservée au neuf fait grossir l'arriéré jusqu'à le rendre
 * insignifiant — 142 réactions en retard pour 2 nouvelles sur 10, 253
 * pour 3. Le neuf ne prend donc que la place que les révisions laissent.
 *
 * D'où trois temps :
 *
 *   1. on prend les révisions ÉCHUES, les plus urgentes d'abord, jusqu'à
 *      dix — c'est le plafond, et il protège de la séance interminable
 *      les jours où l'on revient après une semaine d'absence ;
 *   2. s'il reste de la place, on ajoute UNE OU DEUX nouveautés, pour que
 *      le programme avance les jours calmes ;
 *   3. si l'on n'atteint toujours pas cinq, on complète en nouveautés —
 *      un paquet de deux questions ne fait pas une habitude.
 *
 * Un paquet vide est un résultat légitime : tout est su et rien n'est
 * échu. La page le dit alors, au lieu d'inventer des questions.
 */
export function composerLePaquet({ etat, maintenant, famille = null }) {
  const disponibles = vivier(famille)
  const suivant = tirage(graineDuJour(jourCivil(maintenant)))

  const dues = []
  const neuves = []
  for (const r of ordonner(disponibles, etat, maintenant, suivant)) {
    const rg = rang(etat[r.id], maintenant)
    if (rg === 0 || rg === 1) dues.push(r)
    else if (rg === 2) neuves.push(r)
  }

  const retenues = dues.slice(0, PAQUET_MAXIMUM)
  const place = PAQUET_MAXIMUM - retenues.length
  const combienDeNeuves = Math.min(
    neuves.length,
    // La place disponible, bornée à deux — sauf s'il faut atteindre le
    // minimum, auquel cas on en prend davantage.
    Math.max(Math.min(NEUVES_PAR_PAQUET, place), PAQUET_MINIMUM - retenues.length)
  )
  retenues.push(...neuves.slice(0, Math.max(0, combienDeNeuves)))

  return {
    reactions: retenues,
    dues: Math.min(dues.length, PAQUET_MAXIMUM),
    neuves: Math.max(0, retenues.length - Math.min(dues.length, PAQUET_MAXIMUM)),
    // Ce que le paquet ne couvre pas : utile pour dire « il en reste ».
    duesRestantes: Math.max(0, dues.length - PAQUET_MAXIMUM)
  }
}

/**
 * Le paquet du jour, questions comprises.
 *
 * La graine vient du JOUR CIVIL, non de l'instant : rouvrir
 * l'application à midi doit rendre exactement le même paquet que le
 * matin, sans quoi l'élève recommencerait sans le savoir.
 */
export function paquetDuJour({ etat, maintenant = Date.now(), famille = null }) {
  const compo = composerLePaquet({ etat, maintenant, famille })
  const jour = jourCivil(maintenant)
  const base = graineDuJour(jour)
  return {
    ...compo,
    jour,
    questions: compo.reactions.map((reaction, i) =>
      question(reaction, tirage(base + i * 7919))
    )
  }
}
