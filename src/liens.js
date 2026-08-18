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
