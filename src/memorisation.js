// La répétition espacée : ce qu'on maîtrise mal revient plus souvent.
//
// L'ALGORITHME, en une phrase : un LEITNER À SIX BOÎTES — chaque réaction
// occupe une boîte, une bonne réponse la fait monter d'une boîte et une
// mauvaise la renvoie à la première, et le délai avant de la revoir suit
// la boîte : 0 jour, 1, 3, 7, 21, 60.
//
// POURQUOI LEITNER PLUTÔT QUE SM-2. SM-2 règle un « facteur de facilité »
// par carte à partir d'une note de 0 à 5 que l'élève se donne lui-même.
// Ici il n'y a pas de note à donner : une réponse à choix multiple est
// juste ou fausse, sans nuance. Le paramètre le plus fin de SM-2 n'aurait
// donc rien à manger, et l'on garderait sa complexité sans son bénéfice.
// Leitner se règle exactement sur ce qu'on observe — juste ou faux — et
// tient en une ligne qu'on peut expliquer à qui l'utilise.
//
// CE FICHIER NE TOUCHE À REACT NI À AUCUN AFFICHAGE. Les fonctions de
// décision sont PURES : on leur passe l'état et l'heure, elles rendent un
// nouvel état. C'est ce qui permet à scripts/tester-memorisation.mjs de
// simuler des mois de révision en quelques millisecondes, ce qu'aucune
// séance de clics ne ferait.

const CLE = 'chimierev.memorisation.v1'
const JOUR = 24 * 60 * 60 * 1000

/**
 * Le délai avant de revoir une réaction, selon sa boîte.
 *
 * La progression est à peu près géométrique, ce qui est le principe même
 * de la répétition espacée : chaque succès éloigne la révision suivante
 * bien plus qu'il ne l'a rapprochée. Le dernier palier à 60 jours n'est
 * pas un oubli — au-delà, une réaction est acquise, et la représenter
 * coûterait une question à une autre qui en a besoin.
 */
export const DELAIS = [0, 1, 3, 7, 21, 60]
export const DERNIERE_BOITE = DELAIS.length - 1

/** Ce qu'on retient d'une réaction jamais rencontrée. */
export const ficheNeuve = () => ({ boite: 0, vues: 0, justes: 0, du: 0, le: 0 })

/**
 * L'état d'une réaction après une réponse.
 *
 * Juste : on monte d'une boîte. Faux : on redescend À LA PREMIÈRE, et non
 * d'un cran. C'est le choix de Leitner, et il est délibéré — une réaction
 * ratée après trois succès n'est pas « presque sue », elle est à reprendre
 * depuis le début. Redescendre d'un seul cran laisserait une carte mal
 * sue remonter en deux réponses, dont une pourrait être un coup de chance
 * sur quatre propositions.
 */
export function apresReponse(fiche, juste, maintenant) {
  const base = fiche || ficheNeuve()
  const boite = juste ? Math.min(base.boite + 1, DERNIERE_BOITE) : 0
  return {
    boite,
    vues: base.vues + 1,
    justes: base.justes + (juste ? 1 : 0),
    le: maintenant,
    du: maintenant + DELAIS[boite] * JOUR
  }
}

/**
 * Le rang de priorité d'une réaction. Le plus petit passe d'abord.
 *
 *   0 — échue et RATÉE au dernier passage (boîte 0) : la priorité absolue
 *   1 — échue, en cours d'acquisition : la révision à l'heure
 *   2 — jamais rencontrée : du neuf, quand la révision laisse de la place
 *   3 — pas encore échue : on ne la ressort que pour remplir la série
 *
 * LA NOUVEAUTÉ PASSE APRÈS LA RÉVISION, et ce n'est pas un détail de
 * réglage : c'est ce qui décide si le dispositif enseigne ou noie. Un
 * premier ordonnancement plaçait le neuf en deuxième, avant l'entretien.
 * Simulé sur 90 séances de 10 questions à 70 % de réussite, il donnait
 * 275 réactions vues, ZÉRO acquise et 265 en retard — l'élève parcourait
 * tout et ne consolidait rien, et l'échéance ne voulait plus rien dire
 * puisque presque tout était en retard.
 *
 * Les parts fixes réservées au neuf (2, 3 ou 4 questions sur 10) ont été
 * mesurées aussi : elles donnent 142, 253 et 251 réactions en retard. Plus
 * on force la découverte, plus l'arriéré grossit — c'est la propriété
 * connue de toute répétition espacée, et aucun réglage ne l'annule.
 *
 * Le même essai avec la révision en tête rend 82 réactions vues, 43
 * ACQUISES et 9 en retard. On voit moins de choses, et on en sait
 * beaucoup plus. Le neuf entre alors tout seul, dès qu'une séance n'est
 * pas remplie par les révisions dues.
 */
export function rang(fiche, maintenant) {
  if (!fiche || fiche.vues === 0) return 2
  if (fiche.du > maintenant) return 3
  return fiche.boite === 0 ? 0 : 1
}

/** De combien de jours une révision est-elle en retard ? (négatif = à venir) */
export function retard(fiche, maintenant) {
  if (!fiche || fiche.vues === 0) return 0
  return (maintenant - fiche.du) / JOUR
}

/**
 * Ordonne des réactions par urgence.
 *
 * `suivant` mélange À L'INTÉRIEUR d'un même rang : sans lui, deux séances
 * de suite reposeraient exactement les mêmes questions dans le même ordre,
 * et l'on réviserait la position d'une réponse plutôt que la chimie.
 */
export function ordonner(reactions, etat, maintenant, suivant) {
  const brouillage = new Map(
    reactions.map((r) => [r.id, suivant ? suivant() : 0])
  )
  return [...reactions].sort((a, b) => {
    const fa = etat[a.id]
    const fb = etat[b.id]
    const ra = rang(fa, maintenant)
    const rb = rang(fb, maintenant)
    if (ra !== rb) return ra - rb

    // Dans un même rang : le plus en retard d'abord. Pour les cartes non
    // échues (rang 3), le retard est négatif et le tri les remet donc dans
    // l'ordre des échéances les plus proches — ce qu'on veut.
    const da = retard(fa, maintenant)
    const db = retard(fb, maintenant)
    if (Math.abs(da - db) > 1e-9) return db - da

    return brouillage.get(a.id) - brouillage.get(b.id)
  })
}

/** De quoi afficher où en est l'élève, sans rien calculer dans la page. */
export function statistiques(etat, ids, maintenant) {
  const parBoite = new Array(DELAIS.length).fill(0)
  let vues = 0
  let echues = 0
  let acquises = 0

  for (const id of ids) {
    const fiche = etat[id]
    if (!fiche || fiche.vues === 0) continue
    vues++
    parBoite[fiche.boite]++
    if (fiche.du <= maintenant) echues++
    if (fiche.boite >= DERNIERE_BOITE) acquises++
  }
  return { total: ids.length, vues, jamaisVues: ids.length - vues, echues, acquises, parBoite }
}

// ————————————————————————————————————————————————————————————
// Le stockage. Tout ce qui suit peut échouer, et n'a pas le droit de
// casser l'application quand il échoue.
// ————————————————————————————————————————————————————————————

/**
 * localStorage n'est pas toujours là, et son absence n'est pas une panne.
 *
 * En navigation privée, avec les données de site bloquées, ou dans un
 * cadre isolé, le SEUL FAIT D'Y ACCÉDER lève une exception — il ne rend
 * pas null, il jette. Le routeur étant en `hash`, une exception non
 * rattrapée ici tuerait l'application entière jusqu'au rechargement, et
 * pour une raison que l'utilisateur ne pourrait pas deviner.
 *
 * On révise donc sans mémoire plutôt que pas du tout.
 */
let coffreConnu           // null = éprouvé et inutilisable
let coffreEprouve = false

function coffre() {
  // On n'éprouve QU'UNE FOIS. La version précédente écrivait puis effaçait
  // une clé d'essai à chaque appel — donc à chaque LECTURE. Une lecture qui
  // écrit est un effet de bord qu'on ne voit pas venir : elle coûte deux
  // accès disque par question posée, et le test l'a prise en défaut en
  // effaçant l'état qu'elle venait de vouloir relire.
  if (coffreEprouve) return coffreConnu
  coffreEprouve = true
  try {
    const s = globalThis.localStorage
    // La présence de l'objet ne prouve pas qu'il marche : en navigation
    // privée l'accès lui-même lève. On l'éprouve donc sur une clé à part.
    const essai = CLE + '.essai'
    s.setItem(essai, '1')
    s.removeItem(essai)
    coffreConnu = s
  } catch {
    coffreConnu = null
  }
  return coffreConnu
}

/** Rouvre la question du stockage — pour les tests, qui le remplacent. */
export function reeprouverLeCoffre() {
  coffreEprouve = false
  coffreConnu = undefined
}

/** Une fiche relue depuis le stockage est-elle exploitable ? */
function ficheValide(f) {
  return Boolean(
    f && typeof f === 'object' &&
    Number.isInteger(f.boite) && f.boite >= 0 && f.boite <= DERNIERE_BOITE &&
    Number.isFinite(f.vues) && f.vues >= 0 &&
    Number.isFinite(f.justes) && f.justes >= 0 && f.justes <= f.vues &&
    Number.isFinite(f.du) && Number.isFinite(f.le)
  )
}

/**
 * Relit l'état, en écartant ce qui ne tient pas debout.
 *
 * On ne fait AUCUNE confiance à ce qu'on relit : c'est du texte que
 * n'importe qui peut modifier dans son navigateur, et une version
 * antérieure de l'application a pu y écrire une autre forme. Une seule
 * fiche mal formée suffirait sinon à faire échouer un tri et à rendre une
 * page blanche — c'est le défaut que ce dépôt a déjà connu avec un champ
 * `pieges` écrit comme une chaîne.
 */
export function lire() {
  const s = coffre()
  if (!s) return {}
  try {
    const brut = JSON.parse(s.getItem(CLE) || '{}')
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {}
    const propre = {}
    for (const [id, fiche] of Object.entries(brut)) {
      if (ficheValide(fiche)) propre[id] = fiche
    }
    return propre
  } catch {
    return {}
  }
}

/** Écrit l'état. Un échec d'écriture ne doit rien interrompre. */
export function ecrire(etat) {
  const s = coffre()
  if (!s) return false
  try {
    s.setItem(CLE, JSON.stringify(etat))
    return true
  } catch {
    // Quota dépassé, écriture refusée : on continue sans mémoire.
    return false
  }
}

/** Efface la progression. */
export function oublier() {
  const s = coffre()
  if (!s) return false
  try {
    s.removeItem(CLE)
    return true
  } catch {
    return false
  }
}

/** Enregistre une réponse et rend le nouvel état. */
export function enregistrer(etat, id, juste, maintenant = Date.now()) {
  const suite = { ...etat, [id]: apresReponse(etat[id], juste, maintenant) }
  ecrire(suite)
  return suite
}
