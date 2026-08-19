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

const DOSSIER = 'public/mecanismes'
const MANUELS = 'public/mecanismes-manuels'
const COULEUR_FLECHE = '#D62246'          // les flèches et leurs numéros
const SURLIGNE_DEPART = [0.78, 0.90, 0.98] // bleu très pâle : d'où viennent les électrons
const SURLIGNE_ARRIVEE = [1, 0.82, 0.87]   // rose très pâle : où ils vont
const CASE = 230
const HAUTEUR_LIGNE = 205
const ESPACEMENT = 40
const PAR_LIGNE = 2

const mecanismes = JSON.parse(readFileSync('src/data/mecanismes.json', 'utf8'))
const RDKit = await initRDKit()

const optionsDessin = (extra = {}) => JSON.stringify({
  width: CASE,
  height: HAUTEUR_LIGNE,
  backgroundColour: [1, 1, 1, 0],
  fixedBondLength: 32,
  bondLineWidth: 2,
  scaleBondWidth: false,
  minFontSize: 15,
  maxFontSize: 22,
  centreMoleculesBeforeDrawing: true,
  ...extra
})

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
 */
function dessinerEspece(smiles, misEnJeu) {
  const molecule = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    throw new Error(`SMILES illisible : ${smiles}`)
  }

  const nombre = molecule.get_num_atoms()

  // Repérage : une ellipse centrée sur chaque atome.
  const repere = molecule.get_svg_with_highlights(
    optionsDessin({ atoms: [...Array(nombre).keys()] })
  )
  const centres = [...repere.matchAll(/<ellipse[^>]*cx='([\d.]+)'\s*cy='([\d.]+)'/g)]
    .map((e) => ({ x: Number(e[1]), y: Number(e[2]) }))
  if (centres.length !== nombre) {
    throw new Error(`repérage incomplet pour ${smiles} : ${centres.length}/${nombre}`)
  }

  // Numéros des liaisons à surligner, retrouvés par leurs deux atomes.
  const liaisons = liaisonsDe(molecule)
  const numeroLiaison = ([i, j]) =>
    liaisons.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i))

  // Deux dessins superposés : le fond des surlignages (départs en bleu,
  // arrivées en rose), puis le dessin propre par-dessus.
  const couche = (atomes, liaisonsVisees, couleur) => {
    const numeros = liaisonsVisees.map(numeroLiaison).filter((n) => n >= 0)
    if (atomes.length === 0 && numeros.length === 0) return ''

    const svg = molecule.get_svg_with_highlights(optionsDessin({
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

  const dessin = molecule.get_svg_with_highlights(optionsDessin())
  molecule.delete()

  const contenu = dessin
    .slice(dessin.indexOf('<!-- END OF HEADER -->') + 22, dessin.lastIndexOf('</svg>'))
    .replace(/<rect[^>]*>\s*<\/rect>/, '')

  return { contenu: surlignages + contenu, centres, nombre }
}

/** Point visé par une extrémité de flèche : un atome, ou le milieu d'une liaison. */
function pointVise(extremite, centres) {
  if (extremite.atome !== undefined) return centres[extremite.atome]
  const [i, j] = extremite.liaison
  return { x: (centres[i].x + centres[j].x) / 2, y: (centres[i].y + centres[j].y) / 2 }
}

/** Une flèche courbe numérotée, de son départ à son arrivée. */
function trace(fleche, centres, numero) {
  const depart = pointVise(fleche.de, centres)
  const arrivee = pointVise(fleche.vers, centres)

  const dx = arrivee.x - depart.x
  const dy = arrivee.y - depart.y
  const distance = Math.hypot(dx, dy) || 1

  // On garde la courbure demandée, avec un ventre minimum : sans cela une
  // flèche courte se réduit à un trait droit invisible.
  const demandee = fleche.courbure ?? 0.35
  const ampleur = Math.max(Math.abs(demandee), 20 / distance)
  const courbure = Math.sign(demandee || 1) * ampleur

  const controle = {
    x: (depart.x + arrivee.x) / 2 - (dy / distance) * distance * courbure,
    y: (depart.y + arrivee.y) / 2 + (dx / distance) * distance * courbure
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

  // Numéro posé au sommet de la courbe, puis repoussé un peu plus loin
  // vers l'extérieur : sinon il vient s'asseoir sur une lettre d'atome.
  const sommet = {
    x: 0.25 * a.x + 0.5 * controle.x + 0.25 * b.x,
    y: 0.25 * a.y + 0.5 * controle.y + 0.25 * b.y
  }
  const corde = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const versExterieur = { x: sommet.x - corde.x, y: sommet.y - corde.y }
  const norme = Math.hypot(versExterieur.x, versExterieur.y) || 1
  const milieu = {
    x: sommet.x + (versExterieur.x / norme) * 14,
    y: sommet.y + (versExterieur.y / norme) * 14
  }

  const svg = `  <path d='M ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${controle.x.toFixed(1)},${controle.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}' fill='none' stroke='${COULEUR_FLECHE}' stroke-width='2.6' stroke-linecap='round'/>
  <polygon points='${pointe}' fill='${COULEUR_FLECHE}'/>
  <circle cx='${milieu.x.toFixed(1)}' cy='${milieu.y.toFixed(1)}' r='11' fill='${COULEUR_FLECHE}'/>
  <text x='${milieu.x.toFixed(1)}' y='${milieu.y.toFixed(1)}' text-anchor='middle' dominant-baseline='central' font-family='Karla, sans-serif' font-size='14' font-weight='700' fill='#FFFFFF'>${numero}</text>`

  return { svg, points: [a, b, controle, milieu] }
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
        const k = especeDe(extremite.liaison[0])
        misEnJeu[k][`liaisons${suffixe}`].push(extremite.liaison.map((a) => a - debuts[k]))
      }
    }
  }

  // Composition.
  //
  // Dès qu'une étape porte des flèches, on empile les espèces l'une sous
  // l'autre, une par ligne : sur un téléphone tenu verticalement, deux
  // molécules côte à côte réduisent le texte à une taille illisible.
  // Les étapes sans flèche (les bilans) tiennent deux par ligne, il n'y a
  // là rien à suivre du regard.
  const parLigne = (etape.fleches || []).length > 0 ? 1 : Math.min(PAR_LIGNE, especes.length)
  const nbLignes = Math.ceil(especes.length / parLigne)
  const largeurMax = parLigne * CASE + (parLigne - 1) * ESPACEMENT

  let contenus = ''
  let plus = ''
  const centres = []

  especes.forEach((smiles, rang) => {
    const espece = dessinerEspece(smiles, misEnJeu[rang])
    const colonne = rang % parLigne
    const ligne = Math.floor(rang / parLigne)

    // Une ligne incomplète est centrée, pas collée à gauche.
    const surCetteLigne = Math.min(parLigne, especes.length - ligne * parLigne)
    const largeurLigne = surCetteLigne * CASE + (surCetteLigne - 1) * ESPACEMENT
    const dx = (largeurMax - largeurLigne) / 2 + colonne * (CASE + ESPACEMENT)
    const dy = ligne * HAUTEUR_LIGNE

    contenus += `\n  <g transform='translate(${dx}, ${dy})'>${espece.contenu}</g>`
    espece.centres.forEach((c) => centres.push({ x: c.x + dx, y: c.y + dy }))

    // Le « + » : à droite de l'espèce si la suivante est sur la même ligne,
    // en dessous si elle passe à la ligne.
    if (rang < especes.length - 1) {
      const suivanteMemeLigne = colonne < parLigne - 1
      const px = suivanteMemeLigne ? dx + CASE + ESPACEMENT / 2 : largeurMax / 2
      const py = suivanteMemeLigne ? dy + HAUTEUR_LIGNE / 2 : dy + HAUTEUR_LIGNE - 4
      plus += `\n  <text x='${px}' y='${py}' text-anchor='middle' dominant-baseline='central' font-family='Karla, sans-serif' font-size='26' fill='#16130F'>+</text>`
    }
  })

  const largeur = largeurMax
  const hauteur = nbLignes * HAUTEUR_LIGNE

  const tracees = (etape.fleches || []).map((f, i) => trace(f, centres, i + 1))
  const fleches = tracees.map((t) => t.svg).join('\n')

  // Recadrage sur ce qui est réellement dessiné.
  const points = [...centres, ...tracees.flatMap((t) => t.points)]
  const marge = 36
  const x = Math.max(0, Math.min(...points.map((p) => p.x)) - marge)
  const y = Math.max(0, Math.min(...points.map((p) => p.y)) - marge)
  const l = Math.min(largeur, Math.max(...points.map((p) => p.x)) + marge) - x
  const h = Math.min(hauteur, Math.max(...points.map((p) => p.y)) + marge) - y

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
        fleches: []
      }
      total++
      continue
    }

    const nom = `${idReaction}-etape${etape.numero}.svg`
    writeFileSync(`${DOSSIER}/${nom}`, dessinerEtape(etape))

    manifeste[idReaction][etape.numero] = {
      fichier: nom,
      titre: etape.titre,
      legende: etape.legende,
      // Ce que fait chaque flèche, dans l'ordre de leur numéro.
      fleches: (etape.fleches || []).map((f) => f.libelle || '')
    }
    total++
  }
}

writeFileSync('src/data/mecanismes-dessins.json', JSON.stringify(manifeste, null, 2) + '\n')
console.log(`✓ ${total} étapes de mécanisme dessinées dans ${DOSSIER}/`)
