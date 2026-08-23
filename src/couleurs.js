// La couleur porte une information, exactement comme dans un tableau
// périodique où chaque famille d'éléments a sa teinte : ici, chaque
// FAMILLE DE RÉACTIONS a la sienne. On la retrouve sur la tuile, sur le
// bandeau de la fiche et sur le filtre — donc l'œil apprend le classement
// sans avoir à lire.
//
// DEUX CONTRAINTES, et elles ne se négocient pas :
//
//   • La couleur est toujours un FOND sur lequel on écrit à l'encre.
//     Elle doit donc contraster avec l'encre d'au moins 4,5 pour 1.
//     La version précédente comptait six couleurs sous ce seuil, dont
//     une à 2,4 — l'intitulé de la famille y était illisible.
//
//   • Deux familles ne doivent pas se confondre. La distance se mesure,
//     en ΔE dans l'espace CIELAB : sous 15, deux aplats posés côte à côte
//     se lisent comme « la même couleur, en un peu différent ». La
//     version précédente descendait à 7,3 — trois verts, trois oranges et
//     quatre turquoises se marchaient dessus.
//
// La palette actuelle tient les deux : contraste minimal 5,4 et ΔE
// minimal 19,1. Chaque famille a gardé SA teinte — « Substitutions » est
// bleu depuis le premier jour — mais les vingt-huit sont réparties sur
// tout le cercle des teintes, et deux teintes voisines prennent des
// clartés opposées. C'est le principe de l'affiche sérigraphiée : ce ne
// sont pas les nuances qui séparent, c'est le contraste.
//
// `npm run valider` refait les deux mesures et refuse la construction si
// l'une d'elles retombe sous son seuil.
export const COULEURS_FAMILLES = {
  // Chimie organique — le socle
  'Substitutions':              '#3791D4',  // bleu franc
  'Éliminations':               '#E1D54F',  // citron
  'Additions électrophiles':    '#BD7DD6',  // mauve
  'Additions sur le carbonyle': '#D57E74',  // terre cuite
  'Substitution acyle':         '#EA5F3B',  // vermillon
  'Aromatique':                 '#8F82F0',  // bleu-violet
  'Énolates':                   '#55EFC8',  // turquoise clair
  'Péricycliques':              '#D09C66',  // caramel
  'Oxydo-réduction':            '#67A550',  // vert prairie
  'Radicalaire':                '#CBA03C',  // ocre
  'Organométalliques':          '#CE7692',  // rose fané
  'Couplages':                  '#EC6AD3',  // magenta
  'Réarrangements':             '#42BCF2',  // bleu ciel
  'Hétérocycles':               '#B8D936',  // vert tilleul
  'Stratégie':                  '#5DF8F7',  // cyan clair

  // Biomolécules
  'Glucides':          '#F599D0',  // rose dragée
  'Acides aminés':     '#7FD56A',  // vert pomme
  'Lipides':           '#FBD180',  // abricot
  'Acides nucléiques': '#468BEC',  // bleuet
  'Métabolisme':       '#E15C98',  // framboise
  'Polymères':         '#D8EC7E',  // vert amande

  // Chimie inorganique
  'Coordination':   '#4DA776',  // sarcelle
  'Catalyse':       '#A497E2',  // lavande
  'Bioinorganique': '#48C3B2',  // jade
  'Bioorganique':   '#62E49A',  // menthe

  // Méthodes et matériaux
  'Photochimie':          '#AEB75B',  // olive
  'Multicomposants':      '#F19550',  // mandarine
  'Synthèse asymétrique': '#C971EF'  // orchidée
}

// Teinte de repli pour toute famille pas encore répertoriée (utile en
// Phase 6, quand de nouvelles familles arriveront). Elle est tenue aux
// mêmes seuils que les autres.
const PAR_DEFAUT = '#51DDF9'       // bleu de repli

export function couleurFamille(famille) {
  return COULEURS_FAMILLES[famille] || PAR_DEFAUT
}

// ---------------------------------------------------------------------
// MESURER L'ÉCART ENTRE DEUX COULEURS
//
// Comparer deux codes hexadécimaux ne dit rien : #00FF00 et #00E000 sont
// loin l'un de l'autre en chiffres et presque identiques à l'œil. La
// seule mesure qui corresponde à ce qu'on voit est la distance dans
// l'espace CIELAB, construit pour cela. On s'en sert à deux endroits :
// pour refuser une palette qui se confond (npm run valider) et pour
// éviter de poser deux tuiles de teintes voisines côte à côte
// (src/ordre.js).

const canal = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255
const lineaire = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function luminance(hex) {
  const [r, v, b] = [0, 1, 2].map((i) => lineaire(canal(hex, i)))
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

/** Le rapport de contraste entre deux couleurs, au sens de la WCAG. */
export function contraste(a, b) {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (haut + 0.05) / (bas + 0.05)
}

function lab(hex) {
  const [r, v, b] = [0, 1, 2].map((i) => lineaire(canal(hex, i)))
  const X = (0.4124 * r + 0.3576 * v + 0.1805 * b) / 0.95047
  const Y = 0.2126 * r + 0.7152 * v + 0.0722 * b
  const Z = (0.0193 * r + 0.1192 * v + 0.9505 * b) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const [fx, fy, fz] = [f(X), f(Y), f(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** ΔE : sous 15, deux aplats voisins se lisent comme une seule couleur. */
export function ecartCouleurs(a, b) {
  const [l1, a1, b1] = lab(a)
  const [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
