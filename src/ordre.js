// L'ordre du tableau des réactions.
//
// Les fiches sont écrites famille par famille, et le fichier de données
// garde cet ordre — c'est celui du programme, et c'est bien ainsi pour
// écrire. Mais AFFICHÉ tel quel, il donne un damier par paquets : vingt
// tuiles cyan, puis douze citron, puis neuf orange. On ne lit plus un
// tableau périodique, on lit des blocs de couleur, et l'information que
// porte la teinte se perd dans la masse.
//
// On entrelace donc. Deux exigences, et elles tirent en sens contraire :
//
//   • chaque famille doit s'étaler sur TOUTE la grille, pas se tasser au
//     début — sans quoi la famille la plus fournie occuperait le premier
//     tiers et les petites familles la fin ;
//   • deux tuiles voisines ne doivent pas porter des couleurs PROCHES —
//     et « voisine » vaut aussi VERTICALEMENT : la grille compte deux
//     colonnes sur téléphone et trois sur ordinateur, donc les rangs
//     i+2 et i+3 touchent le rang i tout autant que i+1.
//
// Ce second point demande de raisonner en couleur, pas en famille. Éviter
// deux tuiles de la MÊME famille ne suffit pas : « Réarrangements » est
// bleu ciel et « Substitutions » bleu franc, et posées l'une au-dessus de
// l'autre elles font une tache bleue. On écarte donc les familles dont
// les teintes sont trop proches, mesure à l'appui (voir couleurs.js).
//
// D'où la construction : chaque réaction reçoit une position idéale
// (i + ½) / n dans sa famille — la troisième de quatre vise le milieu du
// tableau, quelle que soit la taille des autres familles. On sert ensuite
// toujours la plus en retard, en sautant celles qui viennent d'être
// servies. Le résultat ne dépend que des données : le tableau ne se
// réorganise pas d'une visite à l'autre.

import { couleurFamille, ecartCouleurs } from './couleurs.js'

const VOISINAGE = 3   // i+1, i+2, i+3 : les cases qui touchent la case i

// On tente d'abord l'écart le plus exigeant, puis on relâche : vers la
// fin du tableau il ne reste que deux ou trois familles, et il faut bien
// les poser quelque part.
const SEUILS = [40, 32, 25, 18, 0]

export function ordreEntrelace(reactions) {
  const familles = new Map()
  for (const r of reactions) {
    if (!familles.has(r.famille)) familles.set(r.famille, [])
    familles.get(r.famille).push(r)
  }

  // Une file par famille, chaque réaction portant sa position idéale.
  const files = [...familles.entries()].map(([nom, liste]) => ({
    nom,
    reste: liste.map((r, i) => ({ r, cible: (i + 0.5) / liste.length }))
  }))

  const sortie = []
  const recents = []

  while (files.some((f) => f.reste.length)) {
    const disponibles = files
      .filter((f) => f.reste.length)
      .sort((a, b) => a.reste[0].cible - b.reste[0].cible)

    // On sert la famille la plus en retard dont la couleur ne ressemble
    // à aucune de celles qu'on vient de poser.
    const voisines = recents.slice(-VOISINAGE)
    let choisie = null
    for (const seuil of SEUILS) {
      choisie = disponibles.find((f) =>
        voisines.every((v) => ecartCouleurs(couleurFamille(f.nom), couleurFamille(v)) >= seuil)
      )
      if (choisie) break
    }

    sortie.push(choisie.reste.shift().r)
    recents.push(choisie.nom)
  }

  return sortie
}
