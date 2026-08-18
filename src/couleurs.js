// La couleur porte une information, exactement comme dans un tableau
// périodique où chaque famille d'éléments a sa teinte : ici, chaque
// FAMILLE DE RÉACTIONS a la sienne. On la retrouve sur la tuile, sur le
// bandeau de la fiche et sur le filtre — donc l'œil apprend le classement
// sans avoir à lire.
export const COULEURS_FAMILLES = {
  'Substitutions': '#00A3D9',      // cyan
  'Éliminations': '#C6D42B',       // citron
  'Péricycliques': '#F59120',      // orange
  'Oxydo-réduction': '#2FB06A',    // vert
  'Organométalliques': '#FF8FA3'   // rose
}

// Teinte de repli pour toute famille pas encore répertoriée
// (utile en Phase 6, quand de nouvelles familles arriveront).
const PAR_DEFAUT = '#0E7C86'       // pétrole

export function couleurFamille(famille) {
  return COULEURS_FAMILLES[famille] || PAR_DEFAUT
}
