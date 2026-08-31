// Retrouve automatiquement dans quelles réactions un réactif ou un solvant
// apparaît, en cherchant son nom dans les données des réactions.
//
// Ainsi, ajouter une réaction suffit : les pages des réactifs et des
// solvants se mettent à jour toutes seules, sans liste à tenir à la main.
import reactions from './data/reactions.json'

/** Compare sans se soucier des accents, des majuscules ni des espaces. */
const normalise = (texte) =>
  (texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Une lettre ou un chiffre : ce qui, collé au nom, prouve qu'on est au milieu d'un mot. */
const EST_UN_MOT = /[a-z0-9]/

/**
 * Le nom apparaît-il dans le texte, en tant que MOT et non au milieu d'un autre ?
 *
 * La nuance n'est pas théorique : sans elle, « NMO » se trouvait dans
 * « Escheǀnmoǀser », et le sel d'Eschenmoser renvoyait vers le
 * N-méthylmorpholine N-oxyde. Un nom de trois lettres se cache facilement.
 */
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

function contient(texte, terme) {
  return occurrences(texte, terme).length > 0
}

/**
 * Les produits dont le nom apparaît dans cette ligne — le plus long gagnant.
 *
 * La frontière de mot ne suffit pas, parce que les indices typographiques
 * n'en sont pas : le « ₂ » de K₂CO₃ n'est ni une lettre ni un chiffre, si
 * bien que « CO » y passait pour un mot entier. Le monoxyde de carbone
 * annonçait donc être employé par le couplage de Suzuki, la réaction de
 * Heck et l'amination de Buchwald-Hartwig — vingt-quatre liens faux dans
 * le corpus, dont aucun ne se voyait autrement qu'en ouvrant la page du
 * réactif. « BH₃ » se cachait dans « Na(CN)BH₃ », « O₂ » dans « H₂O₂/NaOH »,
 * « Zn » dans « Zn(Hg) » — l'amalgame de la Clemmensen n'est pas du zinc
 * en poudre.
 *
 * La règle appliquée est celle qu'emploie déjà `chercher` pour la ligne de
 * conditions : à un endroit donné du texte, c'est le nom LE PLUS LONG qui
 * l'emporte. Un produit n'est retenu que s'il possède au moins une
 * occurrence qu'aucun nom plus long ne recouvre.
 */
/**
 * Les noms d'une liste, NORMALISÉS UNE FOIS.
 *
 * `normalise` fait une décomposition Unicode, une expression régulière et
 * un passage en minuscules — ce n'est pas gratuit. Appelé depuis
 * `occurrences`, il refaisait ce travail pour chaque couple (ligne, nom) :
 * 275 lignes × 184 noms, soit cinquante mille normalisations des mêmes
 * cent-quatre-vingt-quatre chaînes. On les prépare donc une fois.
 *
 * La garde « moins de deux signes » reste sur le nom BRUT : la
 * normalisation peut raccourcir une chaîne accentuée, et déplacer le
 * seuil changerait le résultat.
 */
const nomsPrepares = new WeakMap()

function nomsDe(liste) {
  let prepares = nomsPrepares.get(liste)
  if (!prepares) {
    prepares = []
    for (const entree of liste) {
      for (const nom of [entree.nom, entree.nom_complet].filter(Boolean)) {
        if (nom.length < 2) continue
        prepares.push({ entree, quoi: normalise(nom) })
      }
    }
    nomsPrepares.set(liste, prepares)
  }
  return prepares
}

/** Comme `occurrences`, mais les deux chaînes sont déjà normalisées. */
function occurrencesPretes(ou, quoi) {
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
  const ou = normalise(ligne)
  const marques = []
  for (const { entree, quoi } of nomsDe(liste)) {
    for (const trouve of occurrencesPretes(ou, quoi)) marques.push({ entree, ...trouve })
  }

  const recouverte = (m) =>
    marques.some(
      (autre) =>
        autre.entree !== m.entree &&
        autre.debut <= m.debut &&
        autre.fin >= m.fin &&
        autre.fin - autre.debut > m.fin - m.debut
    )

  return new Set(marques.filter((m) => !recouverte(m)).map((m) => m.entree))
}

// ---------------------------------------------------------------------
// L'INDEX, ET POURQUOI IL A FALLU LE CONSTRUIRE
//
// La première écriture posait la question dans le mauvais sens : « pour
// CE réactif, quelles réactions le citent ? » — donc elle reparcourait
// les 275 réactions, et pour chacune rappelait `produitsCitesDans`, qui
// reparcourt lui-même TOUS les réactifs avec leurs deux noms, puis fait
// un contrôle de recouvrement en O(n²).
//
// Appelée une fois, c'est supportable. Mais la page « Réactifs » l'appelle
// UNE FOIS PAR VIGNETTE, en plein rendu, pour afficher « n réactions » :
// quatre-vingt-douze appels, chacun refaisant le même calcul complet.
//
// MESURÉ, et le chiffre ne se discute pas : **29 661 ms pour ouvrir la
// page** sur un ordinateur à pleine vitesse, et autant à CHAQUE FRAPPE
// dans le champ de recherche, puisque le rendu recommence. Avec le
// processeur bridé quatre fois — un téléphone —, la mesure a dépassé deux
// minutes sans aboutir. Sur un iPhone, Safari tue l'onglet ; et comme le
// routeur est en `hash`, c'est l'application ENTIÈRE qui meurt avec lui.
// D'où le signalement « quand j'ouvre cette page, ça fait tout buguer » :
// c'était exact, et au pied de la lettre.
//
// La question se pose donc dans l'autre sens, UNE FOIS : « pour chaque
// réaction, quels produits cite-t-elle ? » On en tire un index, et les
// 92 demandes suivantes ne sont plus que des lectures de table.
//
// Deux économies s'ajoutent :
//   • l'index est construit à la PREMIÈRE demande, pas au chargement du
//     module — une page qui n'affiche aucun réactif ne le paie pas ;
//   • les lignes de conditions SE RÉPÈTENT beaucoup (dix-sept réactions
//     dans « eau »), et une ligne déjà analysée n'est pas réanalysée.
//
// Le résultat est identique à celui de la version naïve, réaction par
// réaction : `scripts/tester-liens.mjs` le vérifie pour les 92 réactifs
// et les 40 solvants, et refuse le moindre écart.

const index = { reactif: null, solvant: null }

function construireIndex(genre) {
  const liste = genre === 'reactif' ? reactifs : solvants
  const ligneDe = genre === 'reactif'
    ? (r) => (r.reactifs || []).join(' ')
    : (r) => r.solvant

  const parLigne = new Map()
  const table = new Map()
  for (const entree of liste) table.set(entree.id, [])

  for (const reaction of reactions) {
    const ligne = ligneDe(reaction) || ''
    let cites = parLigne.get(ligne)
    if (!cites) {
      cites = produitsCitesDans(liste, ligne)
      parLigne.set(ligne, cites)
    }
    for (const entree of cites) table.get(entree.id)?.push(reaction)
  }
  return table
}

/**
 * Réactions dont la ligne « réactifs » mentionne ce réactif.
 *
 * Le tableau rendu appartient à l'index : on le LIT, on ne le modifie
 * pas. Les deux appelants actuels le recopient ou en prennent la
 * longueur ; un tri en place le corromprait pour tout le reste.
 */
export function reactionsUtilisantReactif(reactif) {
  index.reactif ??= construireIndex('reactif')
  return index.reactif.get(reactif.id) || []
}

/** Réactions dont la ligne « solvant » mentionne ce solvant. Même règle. */
export function reactionsUtilisantSolvant(solvant) {
  index.solvant ??= construireIndex('solvant')
  return index.solvant.get(solvant.id) || []
}

/** Retrouve une réaction par son identifiant (ou undefined si absente). */
export function reactionParId(id) {
  return reactions.find((r) => r.id === id)
}

// ---------------------------------------------------------------------
// Retrouver le réactif ou le solvant désigné par une ligne de conditions.
//
// Les conditions d'une réaction sont écrites en français — « PBr₃ »,
// « KOtBu — base volumineuse », « THF anhydre, à froid ». On y cherche le
// nom d'un produit connu pour pouvoir renvoyer vers sa fiche. On prend le
// nom le plus long qui corresponde : sans cela, « KOH » l'emporterait
// parfois sur « KOtBu ».
import reactifs from './data/reactifs.json'
import solvants from './data/solvants.json'

function chercher(liste, texte, genre) {
  let trouve = null
  for (const entree of liste) {
    for (const nom of [entree.nom, entree.nom_complet].filter(Boolean)) {
      if (contient(texte, nom) && (!trouve || nom.length > trouve.longueur)) {
        trouve = { id: entree.id, nom: entree.nom, genre, longueur: nom.length }
      }
    }
  }
  return trouve
}

/**
 * Le réactif désigné par cette ligne de conditions, s'il est connu.
 *
 * On cherche d'abord parmi les réactifs, puis parmi les solvants : un même
 * produit change de rôle d'une réaction à l'autre. Le DMSO est le solvant
 * de bien des substitutions, mais dans l'oxydation de Swern c'est LUI
 * l'oxydant ; la pyridine, l'acide acétique et le méthanol sont dans le
 * même cas. Sans ce recours, leur nom resterait muet dans la ligne des
 * réactifs alors que leur fiche existe.
 */
export function reactifDeLaLigne(ligne) {
  return chercher(reactifs, ligne, 'reactif') || chercher(solvants, ligne, 'solvant')
}

/** Le solvant désigné par cette ligne de conditions, s'il est connu. */
export function solvantDeLaLigne(ligne) {
  return chercher(solvants, ligne, 'solvant')
}
