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

function contient(texte, terme) {
  if (!terme || terme.length < 2) return false
  return normalise(texte).includes(normalise(terme))
}

/** Réactions dont la ligne « réactifs » mentionne ce réactif. */
export function reactionsUtilisantReactif(reactif) {
  const noms = [reactif.nom, reactif.nom_complet].filter(Boolean)

  return reactions.filter((reaction) => {
    const ligne = reaction.reactifs.join(' ')
    return noms.some((nom) => contient(ligne, nom))
  })
}

/** Réactions dont la ligne « solvant » mentionne ce solvant. */
export function reactionsUtilisantSolvant(solvant) {
  const noms = [solvant.nom, solvant.nom_complet].filter(Boolean)

  return reactions.filter((reaction) => noms.some((nom) => contient(reaction.solvant, nom)))
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

/** Le réactif désigné par cette ligne de conditions, s'il est connu. */
export function reactifDeLaLigne(ligne) {
  return chercher(reactifs, ligne, 'reactif')
}

/** Le solvant désigné par cette ligne de conditions, s'il est connu. */
export function solvantDeLaLigne(ligne) {
  return chercher(solvants, ligne, 'solvant')
}
