// Retrouver vite une réaction précise.
//
// Le champ existait déjà et cherchait dans le nom, la famille, le symbole
// et les réactifs. Deux choses le faisaient échouer en silence, et le
// silence est le pire défaut d'une recherche : on croit que la réaction
// n'existe pas.
//
// — LES ACCENTS. « elimination » rendait ZÉRO résultat quand
//   « élimination » en rendait treize. Sur un clavier de téléphone, taper
//   les accents coûte, et beaucoup ne les tapent pas.
// — LE TRAIT D'UNION. « diels alder » rendait ZÉRO quand « Diels-Alder »
//   en rendait trois. C'est pourtant la façon la plus naturelle de taper
//   ce nom.
//
// S'y ajoute le SUBSTRAT, qui n'était pas cherché du tout.

/**
 * La forme sur laquelle on compare : sans accent, sans casse, et où le
 * trait d'union, l'apostrophe et l'espace se valent.
 *
 * Les tirets demi-cadratin et cadratin sont inclus : ce corpus en emploie
 * (« Woodward–Hoffmann »), et l'on ne tape ni l'un ni l'autre.
 */
export function normaliseTexte(texte) {
  return (texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-–—'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * En dessous de trois signes, on ne cherche pas dans le SMILES.
 *
 * Un SMILES est fait des mêmes lettres que tout le reste : « C » se
 * trouve dans 266 substrats sur 275, « CC » dans 228. Cherchés tels
 * quels, ils ne filtrent rien — ils ramènent le tableau entier, ce qui est
 * pire qu'aucun résultat puisque l'utilisateur croit avoir cherché.
 */
export const LONGUEUR_MINIMALE_SMILES = 3

/**
 * Le SMILES se compare SANS passer par la normalisation, et pour une
 * raison de chimie : sa casse porte du sens. `c1ccccc1` est un benzène
 * aromatique, `C1CCCCC1` un cyclohexane saturé. Les confondre en
 * minuscules ferait rendre les deux à qui n'en cherche qu'un — mesuré :
 * 39 fiches contre 9.
 */
function correspondAuSubstrat(reaction, requeteBrute) {
  if (requeteBrute.length < LONGUEUR_MINIMALE_SMILES) return false
  return (reaction.substrat_SMILES || '').includes(requeteBrute)
}

/**
 * Les réactions qui correspondent à la requête.
 *
 * Une requête vide rend tout : un champ de recherche qu'on n'a pas encore
 * rempli ne doit rien masquer.
 */
export function chercherReactions(reactions, requete) {
  const texte = normaliseTexte(requete)
  if (texte === '') return reactions

  const brute = (requete || '').trim()

  return reactions.filter((r) =>
    normaliseTexte(r.nom).includes(texte) ||
    normaliseTexte(r.famille).includes(texte) ||
    normaliseTexte(r.symbole).includes(texte) ||
    normaliseTexte((r.reactifs || []).join(' ')).includes(texte) ||
    correspondAuSubstrat(r, brute)
  )
}
