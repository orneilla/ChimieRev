// La couleur porte une information, exactement comme dans un tableau
// périodique où chaque famille d'éléments a sa teinte : ici, chaque
// FAMILLE DE RÉACTIONS a la sienne. On la retrouve sur la tuile, sur le
// bandeau de la fiche et sur le filtre — donc l'œil apprend le classement
// sans avoir à lire.
export const COULEURS_FAMILLES = {
  // Chimie organique — les teintes du socle
  'Substitutions': '#00A3D9',           // cyan
  'Éliminations': '#C6D42B',            // citron
  'Additions électrophiles': '#7E57C2', // violet
  'Additions sur le carbonyle': '#EF5350', // corail
  'Substitution acyle': '#8D6E63',      // terre
  'Aromatique': '#5C6BC0',              // indigo
  'Énolates': '#26A69A',                // turquoise
  'Péricycliques': '#F59120',           // orange
  'Oxydo-réduction': '#2FB06A',         // vert
  'Radicalaire': '#FFB300',             // ambre
  'Organométalliques': '#FF8FA3',       // rose
  'Couplages': '#AB47BC',               // magenta
  'Réarrangements': '#78909C',          // ardoise
  'Hétérocycles': '#D4E157',            // citron vert
  'Stratégie': '#546E7A',               // ardoise foncée

  // Biomolécules — une gamme chaude, pour qu'on les distingue d'un coup d'œil
  'Glucides': '#F06292',                // rose vif
  'Acides aminés': '#66BB6A',           // vert tendre
  'Lipides': '#FFA726',                 // mandarine
  'Acides nucléiques': '#42A5F5',       // bleu ciel
  'Métabolisme': '#EC407A',             // framboise
  'Polymères': '#9CCC65',               // vert pomme

  // Chimie inorganique — la gamme froide
  'Coordination': '#00897B',            // sarcelle
  'Catalyse': '#3949AB',                // bleu profond
  'Bioinorganique': '#00ACC1',          // cyan profond
  'Bioorganique': '#4DB6AC',            // jade

  // Méthodes et matériaux
  'Photochimie': '#FDD835',             // jaune soleil
  'Multicomposants': '#FF7043',         // brique
  'Synthèse asymétrique': '#BA68C8'     // parme
}

// Teinte de repli pour toute famille pas encore répertoriée
// (utile en Phase 6, quand de nouvelles familles arriveront).
const PAR_DEFAUT = '#0E7C86'       // pétrole

export function couleurFamille(famille) {
  return COULEURS_FAMILLES[famille] || PAR_DEFAUT
}
