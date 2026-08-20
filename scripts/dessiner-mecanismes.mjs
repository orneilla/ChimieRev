/**
 * Dessine les MÉCANISMES : les molécules de chaque étape, surmontées des
 * flèches courbes qui montrent d'où partent les électrons et où ils vont.
 *
 * TROIS PROBLÈMES, TROIS RÉPONSES
 *
 * 1. « Où RDKit place-t-il les atomes ? » Il ne le dit pas. On lui demande
 *    donc un dessin de repérage où TOUS les atomes sont surlignés : il trace
 *    une ellipse centrée sur chacun. On récupère ces centres, on jette ce
 *    dessin, et on pose les flèches sur le dessin propre, au pixel près.
 *
 * 2. « Cette flèche, elle touche quoi ? » C'est la question de quelqu'un qui
 *    découvre la réaction — et une flèche seule n'y répond pas. Chaque atome
 *    et chaque liaison que le mécanisme met en jeu est donc SURLIGNÉ : le
 *    départ en un ton, l'arrivée en un autre. La cible n'est plus à deviner.
 *
 * 3. « Dans quel ordre ? » Chaque flèche porte un numéro, repris dans une
 *    légende sous le schéma, qui dit en mots ce qu'elle fait.
 *
 * Les espèces sont composées deux par ligne au maximum : un schéma qui
 * s'étale en largeur ne tient pas sur un téléphone tenu verticalement.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const initRDKit = require('@rdkit/rdkit')

// On peut viser d'autres fichiers que ceux du projet : c'est ainsi que le
// contrôle de lisibilité se teste lui-même (scripts/tester-verificateur.mjs).
const FICHIER = process.argv[2] || 'src/data/mecanismes.json'
const DOSSIER = process.argv[3] || 'public/mecanismes'
const MANIFESTE = process.argv[4] || 'src/data/mecanismes-dessins.json'
const MANUELS = 'public/mecanismes-manuels'
const COULEUR_FLECHE = '#D62246'          // les flèches et leurs numéros
const SURLIGNE_DEPART = [0.78, 0.90, 0.98] // bleu très pâle : d'où viennent les électrons
const SURLIGNE_ARRIVEE = [1, 0.82, 0.87]   // rose très pâle : où ils vont
// Distances minimales imposées à un numéro de flèche. Elles ne sont pas
// indicatives : un schéma qui les enfreint n'est pas publié (voir le
// contrôle en fin de dessinerEtape).
// Les seuils sont réglables par variables d'environnement : c'est ainsi
// que le test met le contrôle à l'épreuve, en lui demandant l'impossible.
const seuil = (nom, defaut) => Number(process.env[`CHIMIEREV_${nom}`] || defaut)

// Mode rapport : n'arrête pas au premier schéma refusé, mais écrit la liste
// des refus dans le fichier nommé. Réservé à l'outillage de réglage.
const RAPPORT = process.env.CHIMIEREV_RAPPORT || ''
const refus = []

const RAYON_NUMERO = 11
const DEGAGEMENT_ATOME = seuil('DEGAGEMENT_ATOME', 33)     // numéro ↔ centre d'un atome
const DEGAGEMENT_NUMERO = seuil('DEGAGEMENT_NUMERO', 36)   // numéro ↔ numéro
const DEGAGEMENT_LIAISON = seuil('DEGAGEMENT_LIAISON', 16) // numéro ↔ trait de liaison
// Au-delà de ce rayon, le numéro est trop loin de sa flèche pour qu'on
// devine à laquelle il appartient : un trait de rappel les relie.
const RAYON_SANS_RAPPEL = 34
const DEGAGEMENT_RAPPEL = seuil('DEGAGEMENT_RAPPEL', 15)  // trait de rappel ↔ centre d'un atome
// Le « + » entre deux espèces est un signe de l'équation, pas un décor :
// un numéro posé dessus, ou une flèche qui le barre, fait douter du nombre
// d'espèces en jeu.
const DEGAGEMENT_SIGNE = seuil('DEGAGEMENT_SIGNE', 26)     // numéro ↔ « + »
// Une pastille posée sur le trait d'une AUTRE flèche fait croire qu'elle
// appartient à celle-là.
const DEGAGEMENT_TRACE = seuil('DEGAGEMENT_TRACE', 15)     // numéro ↔ trait d'une autre flèche
// Deux flèches qui se croisent franchement restent lisibles ; deux flèches
// qui se superposent sur une partie de leur longueur forment une tache.
// On mesure donc la LONGUEUR du voisinage, pas seulement la distance : un
// croisement ne partage qu'un point, une superposition en partage beaucoup.
// Les extrémités sont exclues — dans une cascade, la pointe d'une flèche et
// la queue de la suivante visent légitimement le même endroit.
// Deux atomes qui ne sont pas liés n'ont aucune raison d'être proches : si
// leurs centres le sont, leurs étiquettes se recouvrent et le schéma devient
// une tache. Le contrôle se mesure en fraction de la longueur de liaison,
// qui est fixe — deux atomes LIÉS sont à 32 px l'un de l'autre.
// C'est le contrôle qui manquait quand le schéma du Dess-Martin est parti
// en ligne avec sa chaîne posée sur son cycle et son « H » sur un « O ».
const DEGAGEMENT_ATOMES = seuil('DEGAGEMENT_ATOMES', 21)   // atome ↔ atome non lié
const DEGAGEMENT_ATOME_LIAISON = seuil('DEGAGEMENT_ATOME_LIAISON', 11) // atome ↔ liaison étrangère
const DEGAGEMENT_CROISEMENT = seuil('DEGAGEMENT_CROISEMENT', 14) // trait ↔ trait
const BOUT_IGNORE = seuil('BOUT_IGNORE', 28)                     // autour des extrémités
const PART_SUPERPOSEE = 0.2                                      // au-delà, c'est une tache

const CASE = 240                 // largeur de la toile de dessin d'une espèce
const HAUTEUR_TOILE = 220        // hauteur de cette toile
const MARGE_ESPECE = 30          // autour des atomes : lettres et surlignages
const ECART_AVEC_FLECHES = 58    // place laissée aux flèches entre deux espèces
const ECART_SANS_FLECHES = 34

const mecanismes = JSON.parse(readFileSync(FICHIER, 'utf8'))
const RDKit = await initRDKit()

const optionsDessin = (extra = {}) => JSON.stringify({
  width: CASE,
  height: HAUTEUR_TOILE,
  backgroundColour: [1, 1, 1, 0],
  fixedBondLength: 32,
  bondLineWidth: 2,
  scaleBondWidth: false,
  minFontSize: 15,
  maxFontSize: 22,
  centreMoleculesBeforeDrawing: true,
  ...extra
})

/**
 * Quels atomes portent une étiquette écrite.
 *
 * RDKit ne dessine un symbole que pour ce qui n'est pas un carbone neutre :
 * les carbones ordinaires ne sont que des sommets de traits. Deux sommets
 * nus un peu rapprochés ne gênent personne ; deux ÉTIQUETTES rapprochées se
 * recouvrent et rendent le schéma illisible. Le contrôle ne porte donc que
 * sur les atomes écrits.
 */
function etiquettesDe(molecule) {
  const lignes = molecule.get_molblock().split('\n')
  const nbAtomes = Number(lignes[3].slice(0, 3))
  const charges = new Set()
  for (const ligne of lignes) {
    if (!ligne.startsWith('M  CHG')) continue
    const champs = ligne.slice(6).trim().split(/\s+/).map(Number)
    for (let k = 1; k < champs.length; k += 2) charges.add(champs[k] - 1)
  }
  return Array.from({ length: nbAtomes }, (_, i) => {
    const symbole = lignes[4 + i].slice(31, 34).trim()
    return { symbole, ecrit: symbole !== 'C' || charges.has(i) }
  })
}

/** Liste des liaisons (paires d'atomes), dans l'ordre des numéros de RDKit. */
function liaisonsDe(molecule) {
  const lignes = molecule.get_molblock().split('\n')
  const [nbAtomes, nbLiaisons] = [
    Number(lignes[3].slice(0, 3)),
    Number(lignes[3].slice(3, 6))
  ]
  const debut = 4 + nbAtomes

  return Array.from({ length: nbLiaisons }, (_, k) => {
    const ligne = lignes[debut + k]
    // Les molblocks numérotent les atomes à partir de 1.
    return [Number(ligne.slice(0, 3)) - 1, Number(ligne.slice(3, 6)) - 1]
  })
}

/**
 * Dessine une espèce, avec ses atomes et liaisons mis en jeu surlignés.
 * Renvoie le contenu SVG et le centre de chaque atome.
 *
 * Dessine une espèce en choisissant l'algorithme de mise en page.
 *
 * CoordGen place bien mieux les atomes hypervalents — le périodinane de
 * Dess-Martin, avec ses cinq liaisons autour d'un même iode, se dessinait
 * autrement en tas illisible, chaîne et cycle superposés. Mais il échoue
 * sur une espèce réduite à un seul atome : il ne rend aucune coordonnée,
 * et l'ion hydrure disparaît du schéma. On le réserve donc aux espèces
 * qui ont au moins une liaison.
 *
 * PIÈGE QUI A COÛTÉ UNE PUBLICATION : RDKit ne calcule pas les
 * coordonnées à la lecture du SMILES mais au moment du DESSIN. Poser le
 * drapeau autour du seul get_mol ne sert donc à rien — il faut le tenir
 * levé pendant tous les appels à get_svg. Le schéma du Dess-Martin est
 * parti en ligne avec l'ancienne mise en page pour cette raison.
 */
function avecMiseEnPage(smiles, travail) {
  const sonde = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
  const seul = sonde && sonde.is_valid() && sonde.get_num_atoms() === 1
  if (sonde) sonde.delete()
  RDKit.prefer_coordgen(!seul)
  try {
    const molecule = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
    return travail(molecule)
  } finally {
    RDKit.prefer_coordgen(false)
  }
}

function dessinerEspece(smiles, misEnJeu) {
  return avecMiseEnPage(smiles, (molecule) => dessinerEspeceAvec(smiles, misEnJeu, molecule))
}

function dessinerEspeceAvec(smiles, misEnJeu, molecule) {
  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    throw new Error(`SMILES illisible : ${smiles}`)
  }

  const nombre = molecule.get_num_atoms()

  // Une espèce réduite à un seul atome — ion hydrure, halogénure — n'a ni
  // liaison ni étendue : le recentrage automatique de RDKit y répond par
  // des coordonnées invalides, l'atome devient invisible et la flèche
  // semble partir du vide. On le désactive pour ce cas, où il ne sert
  // de toute façon à rien : un atome seul est déjà au centre.
  const options = nombre === 1
    ? (extra = {}) => optionsDessin({ centreMoleculesBeforeDrawing: false,
                                      fixedBondLength: undefined, ...extra })
    : optionsDessin

  // Repérage : une ellipse centrée sur chaque atome.
  const repere = molecule.get_svg_with_highlights(
    options({ atoms: [...Array(nombre).keys()] })
  )
  const centres = [...repere.matchAll(/<ellipse[^>]*cx='([\d.]+)'\s*cy='([\d.]+)'/g)]
    .map((e) => ({ x: Number(e[1]), y: Number(e[2]) }))

  if (centres.length !== nombre) {
    throw new Error(`repérage incomplet pour ${smiles} : ${centres.length}/${nombre}`)
  }

  // Numéros des liaisons à surligner, retrouvés par leurs deux atomes.
  const liaisons = liaisonsDe(molecule)
  const etiquettes = etiquettesDe(molecule)
  const numeroLiaison = ([i, j]) =>
    liaisons.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i))

  // Deux dessins superposés : le fond des surlignages (départs en bleu,
  // arrivées en rose), puis le dessin propre par-dessus.
  const couche = (atomes, liaisonsVisees, couleur) => {
    const numeros = liaisonsVisees.map(numeroLiaison).filter((n) => n >= 0)
    if (atomes.length === 0 && numeros.length === 0) return ''

    // Sur une espèce à un seul atome, RDKit dimensionne son halo d'après
    // l'étendue de la molécule — indéfinie ici — et couvre la moitié du
    // cadre. On trace donc le halo à la main, au même diamètre que les
    // autres, pour que la lecture reste homogène.
    if (nombre === 1) {
      const teinte = couleur.map((c) => Math.round(c * 255))
      return `<circle cx='${centres[0].x.toFixed(1)}' cy='${centres[0].y.toFixed(1)}' r='22' ` +
             `fill='rgb(${teinte.join(',')})'/>`
    }

    const svg = molecule.get_svg_with_highlights(options({
      atoms: atomes,
      bonds: numeros,
      highlightColour: couleur,
      highlightRadius: 0.42,
      highlightBondWidthMultiplier: 20
    }))
    // On ne garde que les surlignages : les ellipses posées sur les atomes
    // et les bandeaux posés sur les liaisons. On les reconnaît à leur
    // remplissage plein — le dessin propre, lui, ne remplit rien.
    // Attention : une liaison porte plusieurs classes (bond-1 atom-1 atom-2).
    return [...svg.matchAll(/<(?:ellipse|path)[^>]*class='(?:atom|bond)-\d+[^']*'[^>]*fill:#[0-9A-Fa-f]{6}[^>]*\/>/g)]
      .map((m) => m[0])
      .filter((element) => !element.includes('fill:none'))
      .join('\n    ')
  }

  const surlignages = [
    couche(misEnJeu.atomesDepart, misEnJeu.liaisonsDepart, SURLIGNE_DEPART),
    couche(misEnJeu.atomesArrivee, misEnJeu.liaisonsArrivee, SURLIGNE_ARRIVEE)
  ].filter(Boolean).join('\n    ')

  const dessin = molecule.get_svg_with_highlights(options())
  molecule.delete()

  // Un dessin aux coordonnées invalides n'affiche rien : mieux vaut
  // s'arrêter que publier une flèche qui semble partir du vide.
  if (/nan/i.test(dessin)) {
    throw new Error(`dessin invalide pour ${smiles} : coordonnées non calculables`)
  }

  const contenu = dessin
    .slice(dessin.indexOf('<!-- END OF HEADER -->') + 22, dessin.lastIndexOf('</svg>'))
    .replace(/<rect[^>]*>\s*<\/rect>/, '')

  return { contenu: surlignages + contenu, centres, nombre, liaisons, etiquettes }
}

const cle = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

/** Distance d'un point à un segment — pour ne pas poser un numéro sur une liaison. */
function distanceAuSegment(point, p, q) {
  const vx = q.x - p.x
  const vy = q.y - p.y
  const longueur2 = vx * vx + vy * vy
  if (longueur2 === 0) return Math.hypot(point.x - p.x, point.y - p.y)

  let t = ((point.x - p.x) * vx + (point.y - p.y) * vy) / longueur2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(point.x - (p.x + t * vx), point.y - (p.y + t * vy))
}

/**
 * Cherche où poser le numéro d'une flèche.
 *
 * Le sommet de la courbe est le point idéal, mais il tombe souvent sur un
 * atome, sur une liaison, ou sur un numéro déjà posé. On explore donc en
 * spirale autour de ce sommet — d'abord tout près et dans l'axe, puis plus
 * loin et de biais — et on retient la première position qui respecte les
 * trois dégagements. À défaut, on garde la moins mauvaise : le contrôle de
 * fin de dessin refusera alors le schéma plutôt que de le publier illisible.
 */
function placerNumero(sommet, direction, obstacles) {
  const evaluer = (point) => {
    let note = Infinity
    for (const atome of obstacles.atomes) {
      note = Math.min(note, Math.hypot(atome.x - point.x, atome.y - point.y) - DEGAGEMENT_ATOME)
    }
    for (const autre of obstacles.numeros) {
      note = Math.min(note, Math.hypot(autre.x - point.x, autre.y - point.y) - DEGAGEMENT_NUMERO)
    }
    for (const [p, q] of obstacles.segments) {
      note = Math.min(note, distanceAuSegment(point, p, q) - DEGAGEMENT_LIAISON)
    }
    for (const signe of obstacles.signes || []) {
      note = Math.min(note, Math.hypot(signe.x - point.x, signe.y - point.y) - DEGAGEMENT_SIGNE)
    }
    for (const q of obstacles.traces || []) {
      note = Math.min(note, Math.hypot(q.x - point.x, q.y - point.y) - DEGAGEMENT_TRACE)
    }
    return note
  }

  // Quand le numéro s'éloigne, un trait de rappel le relie à sa flèche.
  // Ce trait doit lui aussi passer au large : un rappel qui traverse une
  // molécule fait plus de mal que de bien.
  const rappelDegage = (point) => {
    for (let t = 0.15; t <= 0.85; t += 0.1) {
      const q = { x: sommet.x + (point.x - sommet.x) * t, y: sommet.y + (point.y - sommet.y) * t }
      for (const atome of obstacles.atomes) {
        if (Math.hypot(atome.x - q.x, atome.y - q.y) < DEGAGEMENT_RAPPEL) return false
      }
    }
    return true
  }

  let meilleur = null
  let meilleureNote = -Infinity

  for (const rayon of [16, 22, 28, 34, 40, 46, 54, 64, 76, 90, 106]) {
    for (const angle of [0, 0.38, -0.38, 0.75, -0.75, 1.15, -1.15, 1.6, -1.6]) {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const point = {
        x: sommet.x + (direction.x * cos - direction.y * sin) * rayon,
        y: sommet.y + (direction.x * sin + direction.y * cos) * rayon
      }
      const note = evaluer(point)
      if (note >= 0 && (rayon <= RAYON_SANS_RAPPEL || rappelDegage(point))) {
        return { ...point, rappel: rayon > RAYON_SANS_RAPPEL }
      }
      if (note > meilleureNote) {
        meilleureNote = note
        meilleur = { ...point, rappel: rayon > RAYON_SANS_RAPPEL }
      }
    }
  }
  return meilleur
}

/**
 * Point visé par une extrémité de flèche.
 *
 * Un atome : son centre. Une liaison DÉJÀ LÀ : son milieu — c'est le cas
 * d'une double liaison qui se déplace. Une liaison qui NAÎT : l'atome
 * nouveau partenaire, car c'est là que le lecteur doit regarder.
 */
function pointVise(extremite, centres, liaisonsExistantes, atomesSource) {
  if (extremite.atome !== undefined) return centres[extremite.atome]

  const [i, j] = extremite.liaison
  if (liaisonsExistantes.has(cle(i, j))) {
    return { x: (centres[i].x + centres[j].x) / 2, y: (centres[i].y + centres[j].y) / 2 }
  }

  const nouveau = atomesSource.includes(i) ? j : i
  return centres[nouveau]
}

/** Une flèche courbe numérotée, de son départ à son arrivée. */
function trace(fleche, centres, numero, liaisonsExistantes, obstacles) {
  const atomesSource = fleche.de.atome !== undefined ? [fleche.de.atome] : fleche.de.liaison
  const depart = pointVise(fleche.de, centres, liaisonsExistantes, [])
  const arrivee = pointVise(fleche.vers, centres, liaisonsExistantes, atomesSource)

  const dx = arrivee.x - depart.x
  const dy = arrivee.y - depart.y
  const distance = Math.hypot(dx, dy) || 1

  // On part de la courbure demandée, avec un ventre minimum : sans cela une
  // flèche courte se réduit à un trait droit invisible.
  const demandee = fleche.courbure ?? 0.35
  const ampleur = Math.max(Math.abs(demandee), 20 / distance)
  const prefere = Math.sign(demandee || 1)

  const pointDeControle = (courbure) => ({
    x: (depart.x + arrivee.x) / 2 - (dy / distance) * distance * courbure,
    y: (depart.y + arrivee.y) / 2 + (dx / distance) * distance * courbure
  })

  // Une flèche qui passe sur une molécule la rend illisible. On essaie donc
  // plusieurs courbures, des deux côtés, et on garde celle qui laisse le
  // plus d'air autour des atomes — sans compter ceux que la flèche relie,
  // qu'elle doit forcément approcher. Le côté demandé garde un avantage :
  // il n'est abandonné que si un autre dégage nettement mieux.
  const atomesRelies = new Set([
    ...(fleche.de.atome !== undefined ? [fleche.de.atome] : fleche.de.liaison),
    ...(fleche.vers.atome !== undefined ? [fleche.vers.atome] : fleche.vers.liaison)
  ])
  const aEviter = [
    ...centres.filter((_, i) => !atomesRelies.has(i)),
    ...(obstacles.signes || [])
  ]

  const degagement = (controle) => {
    if (aEviter.length === 0) return Infinity
    let minimum = Infinity
    // On échantillonne le cœur de la courbe : ses extrémités touchent
    // volontairement leur cible.
    for (let t = 0.2; t <= 0.8; t += 0.1) {
      const u = 1 - t
      const point = {
        x: u * u * depart.x + 2 * u * t * controle.x + t * t * arrivee.x,
        y: u * u * depart.y + 2 * u * t * controle.y + t * t * arrivee.y
      }
      for (const atome of aEviter) {
        minimum = Math.min(minimum, Math.hypot(atome.x - point.x, atome.y - point.y))
      }
    }
    return minimum
  }

  let controle = pointDeControle(prefere * ampleur)
  let meilleur = degagement(controle) + 12   // avantage au côté demandé

  for (const signe of [1, -1]) {
    for (const facteur of [1, 1.45, 1.9]) {
      const essai = pointDeControle(signe * ampleur * facteur)
      const note = degagement(essai)
      if (note > meilleur) {
        meilleur = note
        controle = essai
      }
    }
  }

  const recule = (point, retraitMax) => {
    const vx = controle.x - point.x
    const vy = controle.y - point.y
    const d = Math.hypot(vx, vy) || 1
    const retrait = Math.min(retraitMax, distance * 0.2)
    return { x: point.x + (vx / d) * retrait, y: point.y + (vy / d) * retrait }
  }

  // On s'arrête au bord du surlignage, pas au centre de l'atome : la pointe
  // touche visiblement la cible sans recouvrir sa lettre.
  const a = recule(depart, fleche.de.atome !== undefined ? 17 : 10)
  const b = recule(arrivee, fleche.vers.atome !== undefined ? 17 : 10)

  const angle = Math.atan2(b.y - controle.y, b.x - controle.x)
  const taille = 11
  const ouverture = 0.4
  const pointe = [
    `${b.x.toFixed(1)},${b.y.toFixed(1)}`,
    `${(b.x - taille * Math.cos(angle - ouverture)).toFixed(1)},${(b.y - taille * Math.sin(angle - ouverture)).toFixed(1)}`,
    `${(b.x - taille * Math.cos(angle + ouverture)).toFixed(1)},${(b.y - taille * Math.sin(angle + ouverture)).toFixed(1)}`
  ].join(' ')

  // Le numéro se pose près du sommet de la courbe, mais jamais sur un
  // atome, une liaison ou un autre numéro : la position est cherchée.
  const sommet = {
    x: 0.25 * a.x + 0.5 * controle.x + 0.25 * b.x,
    y: 0.25 * a.y + 0.5 * controle.y + 0.25 * b.y
  }
  const corde = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const versExterieur = { x: sommet.x - corde.x, y: sommet.y - corde.y }
  const norme = Math.hypot(versExterieur.x, versExterieur.y) || 1
  const direction = { x: versExterieur.x / norme, y: versExterieur.y / norme }

  const milieu = placerNumero(sommet, direction, obstacles)

  // Numéro déporté : on le rattache à sa flèche par un trait fin, qui
  // s'arrête au bord de la pastille et un peu avant la courbe.
  let rappel = ''
  if (milieu.rappel) {
    const vx = sommet.x - milieu.x
    const vy = sommet.y - milieu.y
    const d = Math.hypot(vx, vy) || 1
    const depuis = { x: milieu.x + (vx / d) * (RAYON_NUMERO + 1), y: milieu.y + (vy / d) * (RAYON_NUMERO + 1) }
    const jusqua = { x: sommet.x - (vx / d) * 4, y: sommet.y - (vy / d) * 4 }
    rappel = `  <line x1='${depuis.x.toFixed(1)}' y1='${depuis.y.toFixed(1)}' x2='${jusqua.x.toFixed(1)}' y2='${jusqua.y.toFixed(1)}' stroke='${COULEUR_FLECHE}' stroke-width='1.2' stroke-dasharray='3 3' opacity='0.75'/>\n`
  }

  const svg = `${rappel}  <path d='M ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${controle.x.toFixed(1)},${controle.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}' fill='none' stroke='${COULEUR_FLECHE}' stroke-width='2.6' stroke-linecap='round'/>
  <polygon points='${pointe}' fill='${COULEUR_FLECHE}'/>
  <circle cx='${milieu.x.toFixed(1)}' cy='${milieu.y.toFixed(1)}' r='11' fill='${COULEUR_FLECHE}'/>
  <text x='${milieu.x.toFixed(1)}' y='${milieu.y.toFixed(1)}' text-anchor='middle' dominant-baseline='central' font-family='Karla, sans-serif' font-size='14' font-weight='700' fill='#FFFFFF'>${numero}</text>`

  return { svg, points: [a, b, controle, milieu], numero: milieu }
}

/** Points le long d'une flèche tracée — pour savoir ce qu'elle traverse. */
function echantillonner(tracee) {
  const [a, b, controle] = tracee.points
  const points = []
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const u = 1 - t
    points.push({
      x: u * u * a.x + 2 * u * t * controle.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * controle.y + t * t * b.y
    })
  }
  return points
}

/**
 * Longueur relative sur laquelle deux flèches se superposent, extrémités
 * exclues. Zéro pour deux flèches qui se croisent en un point.
 */
function partSuperposee(une, autre) {
  const bouts = [une.points[0], une.points[1], autre.points[0], autre.points[1]]
  const loinDesBouts = (q) => bouts.every((b) => Math.hypot(b.x - q.x, b.y - q.y) > BOUT_IGNORE)

  const points = echantillonner(une).filter(loinDesBouts)
  if (points.length === 0) return 0

  const cible = echantillonner(autre).filter(loinDesBouts)
  if (cible.length === 0) return 0

  const proches = points.filter((p) =>
    cible.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < DEGAGEMENT_CROISEMENT))
  return proches.length / points.length
}

/** Assemble les espèces d'une étape et pose les flèches par-dessus. */
function dessinerEtape(etape) {
  const especes = etape.smiles.split('.')

  // Première passe : combien d'atomes par espèce, pour traduire les numéros
  // du SMILES complet en numéros locaux à chaque espèce.
  const tailles = especes.map((smiles) => {
    const m = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
    const n = m.get_num_atoms()
    m.delete()
    return n
  })
  const debuts = tailles.reduce((acc, n, i) => [...acc, acc[i] + n], [0])
  const especeDe = (atome) => debuts.findIndex((d, i) => atome >= d && atome < d + tailles[i])

  // Ce que le mécanisme met en jeu, espèce par espèce.
  const misEnJeu = especes.map(() => ({
    atomesDepart: [], liaisonsDepart: [], atomesArrivee: [], liaisonsArrivee: []
  }))

  for (const fleche of etape.fleches || []) {
    for (const [extremite, suffixe] of [[fleche.de, 'Depart'], [fleche.vers, 'Arrivee']]) {
      if (extremite.atome !== undefined) {
        const k = especeDe(extremite.atome)
        misEnJeu[k][`atomes${suffixe}`].push(extremite.atome - debuts[k])
      } else {
        const [i, j] = extremite.liaison
        const k = especeDe(i)
        // Une liaison qui naît entre deux espèces n'existe pas encore :
        // il n'y a rien à surligner, on met en valeur l'atome visé.
        if (especeDe(j) !== k) {
          const cible = suffixe === 'Depart' ? i : j
          const espece = especeDe(cible)
          misEnJeu[espece][`atomes${suffixe}`].push(cible - debuts[espece])
        } else {
          misEnJeu[k][`liaisons${suffixe}`].push([i - debuts[k], j - debuts[k]])
        }
      }
    }
  }

  // Composition.
  //
  // Les espèces sont TOUJOURS empilées, une par ligne, séparées par un
  // « + » centré. Deux raisons : sur un téléphone tenu verticalement, deux
  // molécules côte à côte réduisent le texte à une taille illisible ; et
  // une équation qui passe à la ligne au milieu fait douter du nombre de
  // « + » — en chimie, cette ambiguïté n'est pas acceptable.
  //
  // Chaque espèce est resserrée sur son contenu réel avant d'être posée :
  // RDKit centre sa molécule dans une grande toile, dont le vide gonflerait
  // inutilement la hauteur de la scène.
  const dessinees = especes.map((smiles, rang) => dessinerEspece(smiles, misEnJeu[rang]))

  const boites = dessinees.map(({ centres: c }) => ({
    x0: Math.min(...c.map((p) => p.x)) - MARGE_ESPECE,
    y0: Math.min(...c.map((p) => p.y)) - MARGE_ESPECE,
    x1: Math.max(...c.map((p) => p.x)) + MARGE_ESPECE,
    y1: Math.max(...c.map((p) => p.y)) + MARGE_ESPECE
  }))

  const largeur = Math.max(...boites.map((b) => b.x1 - b.x0))
  const ecart = (etape.fleches || []).length > 0 ? ECART_AVEC_FLECHES : ECART_SANS_FLECHES

  let contenus = ''
  const signes = []   // les « + » de l'équation : eux aussi doivent rester lisibles
  const centres = []
  const etiquettes = []   // quels atomes portent un symbole écrit
  const liaisonsExistantes = new Set()
  let hauteur = 0

  dessinees.forEach((espece, rang) => {
    const boite = boites[rang]
    const dx = (largeur - (boite.x1 - boite.x0)) / 2 - boite.x0
    const dy = hauteur - boite.y0

    contenus += `\n  <g transform='translate(${dx.toFixed(1)}, ${dy.toFixed(1)})'>${espece.contenu}</g>`

    // Numérotation globale : les atomes de chaque espèce se suivent, dans
    // l'ordre du SMILES complet.
    const debut = centres.length
    espece.centres.forEach((c) => centres.push({ x: c.x + dx, y: c.y + dy }))
    espece.etiquettes.forEach((e) => etiquettes.push(e))
    espece.liaisons.forEach(([i, j]) => liaisonsExistantes.add(cle(i + debut, j + debut)))

    hauteur += boite.y1 - boite.y0

    // Un « + » entre deux espèces, et un seul : jamais d'ambiguïté sur le
    // nombre d'espèces qui entrent ou qui sortent.
    if (rang < dessinees.length - 1) {
      signes.push({ x: largeur / 2, y: hauteur + ecart / 2 })
      hauteur += ecart
    }
  })

  // Les segments de liaison, en numérotation globale : un numéro ne doit
  // pas venir se poser dessus.
  const segments = [...liaisonsExistantes].map((k) => {
    const [i, j] = k.split('-').map(Number)
    return [centres[i], centres[j]]
  })

  // Les flèches sont tracées l'une après l'autre, chacune connaissant les
  // numéros déjà posés : c'est ainsi que deux numéros ne se collent pas.
  const obstacles = { atomes: centres, numeros: [], segments, signes, traces: [] }
  const tracees = []
  for (const [rang, fleche] of (etape.fleches || []).entries()) {
    const tracee = trace(fleche, centres, rang + 1, liaisonsExistantes, obstacles)
    obstacles.numeros.push(tracee.numero)
    obstacles.traces.push(...echantillonner(tracee))
    tracees.push(tracee)
  }
  const fleches = tracees.map((t) => t.svg).join('\n')

  // Le « + » est posé au centre, mais c'est aussi par le centre que passent
  // les flèches d'une espèce à l'autre. Un « + » barré par une flèche fait
  // douter du nombre d'espèces : on le décale latéralement s'il le faut,
  // sans jamais en ajouter ni en retirer.
  const jalons = tracees.flatMap((t) => echantillonner(t))
  for (const signe of signes) {
    for (const decalage of [0, 42, -42, 68, -68, 92, -92]) {
      const x = largeur / 2 + decalage
      if (x < 22 || x > largeur - 22) continue
      const libre = jalons.every((q) => Math.hypot(q.x - x, q.y - signe.y) >= DEGAGEMENT_SIGNE) &&
        tracees.every((t) => Math.hypot(t.numero.x - x, t.numero.y - signe.y) >= DEGAGEMENT_SIGNE)
      if (libre) { signe.x = x; break }
    }
  }
  const plus = signes.map((signe) =>
    `\n  <text x='${signe.x.toFixed(1)}' y='${signe.y.toFixed(1)}' text-anchor='middle' dominant-baseline='central' font-family='Karla, sans-serif' font-size='26' fill='#16130F'>+</text>`
  ).join('')

  // CONTRÔLE DE LISIBILITÉ.
  //
  // Un numéro posé sur un atome cache la molécule ; deux numéros collés ne
  // se lisent plus. Le placement cherche à l'éviter, mais chercher n'est
  // pas garantir : on vérifie, et un schéma illisible n'est pas publié.
  const griefs = []
  tracees.forEach((tracee, rang) => {
    const numero = rang + 1
    const p = tracee.numero

    centres.forEach((atome, i) => {
      const d = Math.hypot(atome.x - p.x, atome.y - p.y)
      if (d < DEGAGEMENT_ATOME) {
        griefs.push(`le numéro ${numero} est à ${d.toFixed(0)} px de l'atome ${i} (minimum ${DEGAGEMENT_ATOME})`)
      }
    })

    signes.forEach((signe) => {
      const d = Math.hypot(signe.x - p.x, signe.y - p.y)
      if (d < DEGAGEMENT_SIGNE) {
        griefs.push(`le numéro ${numero} est à ${d.toFixed(0)} px du « + » (minimum ${DEGAGEMENT_SIGNE})`)
      }
    })

    tracees.forEach((autre, i) => {
      if (i === rang) return
      const d = Math.min(...echantillonner(autre).map((q) => Math.hypot(q.x - p.x, q.y - p.y)))
      if (d < DEGAGEMENT_TRACE) {
        griefs.push(`le numéro ${numero} est à ${d.toFixed(0)} px du trait de la flèche ${i + 1} (minimum ${DEGAGEMENT_TRACE})`)
      }
    })

    signes.forEach((signe) => {
      const d = Math.min(...echantillonner(tracee)
        .map((q) => Math.hypot(q.x - signe.x, q.y - signe.y)))
      if (d < DEGAGEMENT_SIGNE) {
        griefs.push(`la flèche ${numero} passe à ${d.toFixed(0)} px du « + » (minimum ${DEGAGEMENT_SIGNE})`)
      }
    })

    tracees.slice(rang + 1).forEach((autre, ecart) => {
      const part = Math.max(partSuperposee(tracee, autre), partSuperposee(autre, tracee))
      if (part > PART_SUPERPOSEE) {
        griefs.push(`les flèches ${numero} et ${numero + 1 + ecart} se superposent sur ` +
          `${(part * 100).toFixed(0)} % de leur longueur (maximum ${(PART_SUPERPOSEE * 100).toFixed(0)} %)`)
      }
    })

    tracees.slice(rang + 1).forEach((autre, ecart) => {
      const d = Math.hypot(autre.numero.x - p.x, autre.numero.y - p.y)
      if (d < DEGAGEMENT_NUMERO) {
        griefs.push(`les numéros ${numero} et ${numero + 1 + ecart} sont à ${d.toFixed(0)} px l'un de l'autre (minimum ${DEGAGEMENT_NUMERO})`)
      }
    })

    for (const [i, j] of [...liaisonsExistantes].map((k) => k.split('-').map(Number))) {
      const d = distanceAuSegment(p, centres[i], centres[j])
      if (d < DEGAGEMENT_LIAISON) {
        griefs.push(`le numéro ${numero} est à ${d.toFixed(0)} px de la liaison ${i}–${j} (minimum ${DEGAGEMENT_LIAISON})`)
      }
    }
  })

  // La molécule elle-même doit être lisible, flèches ou pas. Un atome dont
  // l'étiquette recouvre celle d'un voisin non lié, ou qui vient se poser
  // sur une liaison à laquelle il n'appartient pas, rend le schéma
  // indéchiffrable — quand bien même toutes les flèches seraient bien
  // placées. Ce contrôle porte donc sur TOUTES les étapes, y compris les
  // bilans qui n'ont aucune flèche.
  const liaisons = [...liaisonsExistantes].map((k) => k.split('-').map(Number))
  const voisins = (i) => liaisons.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a))
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      if (!etiquettes[i].ecrit || !etiquettes[j].ecrit) continue
      if (liaisonsExistantes.has(cle(i, j))) continue
      // Deux hydrogènes portés par le même atome sont légitimement voisins :
      // RDKit les pose de part et d'autre, et ils restent parfaitement
      // lisibles. C'est l'écriture courante d'un CH₂ dont on veut viser un
      // proton par une flèche — on ne va pas se l'interdire.
      if (etiquettes[i].symbole === 'H' && etiquettes[j].symbole === 'H' &&
          voisins(i).some((v) => voisins(j).includes(v))) continue
      const d = Math.hypot(centres[i].x - centres[j].x, centres[i].y - centres[j].y)
      if (d < DEGAGEMENT_ATOMES) {
        griefs.push(`les atomes ${i} et ${j}, qui ne sont pas liés, sont à ${d.toFixed(0)} px ` +
          `l'un de l'autre (minimum ${DEGAGEMENT_ATOMES}) : leurs étiquettes se recouvrent`)
      }
    }
    if (!etiquettes[i].ecrit) continue
    for (const [a, b] of liaisons) {
      if (a === i || b === i) continue
      const d = distanceAuSegment(centres[i], centres[a], centres[b])
      if (d < DEGAGEMENT_ATOME_LIAISON) {
        griefs.push(`l'atome ${i} est posé à ${d.toFixed(0)} px de la liaison ${a}–${b}, ` +
          `à laquelle il n'appartient pas (minimum ${DEGAGEMENT_ATOME_LIAISON})`)
      }
    }
  }

  if (griefs.length > 0) {
    throw new Error(
      `schéma illisible :\n      - ${griefs.join('\n      - ')}\n` +
      "      Desserrer la scène : écarter les espèces, changer la courbure d'une flèche, " +
      "réécrire l'étape avec moins de flèches simultanées, ou choisir un substrat " +
      "moins encombré si ce sont les atomes eux-mêmes qui se recouvrent."
    )
  }

  // Recadrage sur ce qui est réellement dessiné.
  // Recadrage : on resserre sur ce qui est réellement dessiné (atomes,
  // flèches et numéros), sans jamais couper.
  const points = [
    ...centres,
    ...tracees.flatMap((t) => t.points),
    // Les quatre bords de chaque pastille : un numéro ne doit jamais être
    // rogné par le cadre.
    ...tracees.flatMap((t) => [
      { x: t.numero.x - RAYON_NUMERO, y: t.numero.y },
      { x: t.numero.x + RAYON_NUMERO, y: t.numero.y },
      { x: t.numero.x, y: t.numero.y - RAYON_NUMERO },
      { x: t.numero.x, y: t.numero.y + RAYON_NUMERO }
    ])
  ]
  const marge = 26
  const x = Math.min(...points.map((p) => p.x)) - marge
  const y = Math.min(...points.map((p) => p.y)) - marge
  const l = Math.max(...points.map((p) => p.x)) + marge - x
  const h = Math.max(...points.map((p) => p.y)) + marge - y

  return `<svg xmlns='http://www.w3.org/2000/svg' version='1.1'
     width='${l.toFixed(0)}px' height='${h.toFixed(0)}px' viewBox='${x.toFixed(0)} ${y.toFixed(0)} ${l.toFixed(0)} ${h.toFixed(0)}'>${contenus}${plus}
${fleches}
</svg>
`
}

rmSync(DOSSIER, { recursive: true, force: true })
mkdirSync(DOSSIER, { recursive: true })

const manifeste = {}
let total = 0

for (const [idReaction, mecanisme] of Object.entries(mecanismes)) {
  if (idReaction.startsWith('_')) continue

  manifeste[idReaction] = {}

  for (const etape of mecanisme.etapes) {
    // Une étape peut fournir son propre dessin, fait à la main dans un
    // logiciel de chimie (voir public/mecanismes-manuels/LISEZ-MOI.md).
    // On l'utilise tel quel, sans rien engendrer.
    if (etape.image) {
      const source = `${MANUELS}/${etape.image}`
      if (!existsSync(source)) {
        throw new Error(`${idReaction}, étape ${etape.numero} : dessin introuvable (${source})`)
      }
      copyFileSync(source, `${DOSSIER}/${etape.image}`)
      manifeste[idReaction][etape.numero] = {
        fichier: etape.image,
        titre: etape.titre,
        legende: etape.legende,
        fleches: [],
        valide: etape.valide === true
      }
      total++
      continue
    }

    const nom = `${idReaction}-etape${etape.numero}.svg`
    try {
      writeFileSync(`${DOSSIER}/${nom}`, dessinerEtape(etape))
    } catch (erreur) {
      // En mode RAPPORT, on ne s'arrête pas au premier refus : on note tout
      // et on rend la liste. C'est ce qui permet à l'outil de réglage des
      // courbures d'essayer des centaines de candidats dans un seul
      // processus — relancer RDKit à chaque essai coûtait deux secondes.
      // La construction, elle, tourne TOUJOURS sans ce mode : un schéma
      // refusé y arrête tout, et c'est bien ce qu'on veut.
      if (RAPPORT) { refus.push({ reaction: idReaction, etape: etape.numero, grief: erreur.message }); continue }
      throw new Error(`${idReaction}, étape ${etape.numero} : ${erreur.message}`)
    }

    manifeste[idReaction][etape.numero] = {
      fichier: nom,
      titre: etape.titre,
      legende: etape.legende,
      // Ce que fait chaque flèche, dans l'ordre de leur numéro.
      fleches: (etape.fleches || []).map((f) => f.libelle || ''),
      // Deux contrôles distincts, qui ne disent pas la même chose :
      // — la machine vérifie que les flèches mènent au produit annoncé ;
      // — un chimiste, lui seul, atteste que ce mécanisme est le bon.
      coherenceVerifiee: (etape.fleches || []).length > 0 && !!etape.produit_attendu,
      valide: etape.valide === true
    }
    total++
  }
}

writeFileSync(MANIFESTE, JSON.stringify(manifeste, null, 2) + '\n')
if (RAPPORT) {
  writeFileSync(RAPPORT, JSON.stringify(refus, null, 2) + '\n')
  console.log(`rapport : ${refus.length} schéma(s) refusé(s) sur ${total + refus.length}`)
} else {
  console.log(`✓ ${total} étapes de mécanisme dessinées dans ${DOSSIER}/`)
}
