/**
 * Dessine les MÉCANISMES : les molécules de chaque étape, surmontées des
 * flèches courbes qui montrent d'où partent les électrons et où ils vont.
 *
 * COMMENT LES FLÈCHES TOMBENT AU BON ENDROIT
 * RDKit ne dit pas où il place les atomes. Astuce : on lui demande un
 * second dessin où TOUS les atomes sont « surlignés ». Il trace alors une
 * ellipse centrée exactement sur chaque atome. On récupère ces centres,
 * on jette ce dessin de repérage, et on pose les flèches sur le dessin
 * propre — aux pixels près.
 *
 * COMPOSITION DE LA SCÈNE
 * Les espèces d'une étape (écrites séparées par un point dans le SMILES)
 * sont dessinées chacune de son côté, puis posées côte à côte avec un
 * « + » entre elles. Laisser RDKit les placer lui-même les collait les
 * unes aux autres, et les flèches devenaient illisibles.
 *
 * Les flèches sont décrites dans src/data/mecanismes.json, en désignant
 * atomes et liaisons par leur numéro dans le SMILES de l'étape (le
 * premier atome écrit porte le numéro 0).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const initRDKit = require('@rdkit/rdkit')

const DOSSIER = 'public/mecanismes'
const COULEUR_FLECHE = '#D62246'   // la même partout : « ici, ça bouge »
const CASE = 250                   // largeur réservée à chaque espèce
const HAUTEUR = 230
const ESPACEMENT = 46              // place du « + » entre deux espèces

const mecanismes = JSON.parse(readFileSync('src/data/mecanismes.json', 'utf8'))
const RDKit = await initRDKit()

const optionsDessin = (extra = {}) => JSON.stringify({
  width: CASE,
  height: HAUTEUR,
  backgroundColour: [1, 1, 1, 0],
  fixedBondLength: 34,
  bondLineWidth: 2,
  scaleBondWidth: false,
  minFontSize: 15,
  maxFontSize: 22,
  centreMoleculesBeforeDrawing: true,
  ...extra
})

/** Dessine une espèce : renvoie son contenu SVG et le centre de ses atomes. */
function dessinerEspece(smiles) {
  const molecule = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    throw new Error(`SMILES illisible : ${smiles}`)
  }

  const nombre = molecule.get_num_atoms()

  // Dessin de repérage : une ellipse centrée sur chaque atome.
  const repere = molecule.get_svg_with_highlights(
    optionsDessin({ atoms: [...Array(nombre).keys()] })
  )
  const centres = [...repere.matchAll(/<ellipse[^>]*cx='([\d.]+)'\s*cy='([\d.]+)'/g)]
    .map((e) => ({ x: Number(e[1]), y: Number(e[2]) }))
  if (centres.length !== nombre) {
    throw new Error(`repérage incomplet pour ${smiles} : ${centres.length}/${nombre}`)
  }

  const dessin = molecule.get_svg_with_highlights(optionsDessin())
  molecule.delete()

  // On ne garde que le contenu : ni l'en-tête, ni le rectangle de fond.
  const contenu = dessin
    .slice(dessin.indexOf('<!-- END OF HEADER -->') + 22, dessin.lastIndexOf('</svg>'))
    .replace(/<rect[^>]*>\s*<\/rect>/, '')

  return { contenu, centres }
}

/** Point visé par une extrémité de flèche : un atome, ou le milieu d'une liaison. */
function pointVise(extremite, centres) {
  if (extremite.atome !== undefined) return centres[extremite.atome]
  const [i, j] = extremite.liaison
  return { x: (centres[i].x + centres[j].x) / 2, y: (centres[i].y + centres[j].y) / 2 }
}

/** Une flèche courbe, de son départ à son arrivée, avec sa pointe. */
function trace(fleche, centres) {
  const depart = pointVise(fleche.de, centres)
  const arrivee = pointVise(fleche.vers, centres)

  const dx = arrivee.x - depart.x
  const dy = arrivee.y - depart.y
  const distance = Math.hypot(dx, dy) || 1

  // Courbure : on garde celle demandée, mais on impose un ventre minimum.
  // Sans cela, une flèche courte (d'une liaison vers son propre atome)
  // se réduit à un trait droit invisible.
  const demandee = fleche.courbure ?? 0.35
  const ampleur = Math.max(Math.abs(demandee), 20 / distance)
  const courbure = Math.sign(demandee || 1) * ampleur

  const controle = {
    x: (depart.x + arrivee.x) / 2 - (dy / distance) * distance * courbure,
    y: (depart.y + arrivee.y) / 2 + (dx / distance) * distance * courbure
  }

  // On recule les extrémités pour ne pas écraser les lettres — mais jamais
  // au point de manger toute la flèche : le retrait reste proportionné.
  const recule = (point, retraitMax) => {
    const vx = controle.x - point.x
    const vy = controle.y - point.y
    const d = Math.hypot(vx, vy) || 1
    const retrait = Math.min(retraitMax, distance * 0.22)
    return { x: point.x + (vx / d) * retrait, y: point.y + (vy / d) * retrait }
  }

  const a = recule(depart, fleche.de.atome !== undefined ? 16 : 9)
  const b = recule(arrivee, fleche.vers.atome !== undefined ? 16 : 9)

  const angle = Math.atan2(b.y - controle.y, b.x - controle.x)
  const taille = 10
  const ouverture = 0.4
  const pointe = [
    `${b.x.toFixed(1)},${b.y.toFixed(1)}`,
    `${(b.x - taille * Math.cos(angle - ouverture)).toFixed(1)},${(b.y - taille * Math.sin(angle - ouverture)).toFixed(1)}`,
    `${(b.x - taille * Math.cos(angle + ouverture)).toFixed(1)},${(b.y - taille * Math.sin(angle + ouverture)).toFixed(1)}`
  ].join(' ')

  const svg = `  <path d='M ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${controle.x.toFixed(1)},${controle.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}' fill='none' stroke='${COULEUR_FLECHE}' stroke-width='2.6' stroke-linecap='round'/>
  <polygon points='${pointe}' fill='${COULEUR_FLECHE}'/>`

  // On rend aussi les points servant au recadrage (le ventre de la courbe
  // peut sortir largement de la zone occupée par les atomes).
  return { svg, points: [a, b, { x: (a.x + controle.x + b.x) / 3, y: (a.y + controle.y + b.y) / 3 }, controle] }
}

/** Assemble les espèces d'une étape et pose les flèches par-dessus. */
function dessinerEtape(etape) {
  // Le SMILES d'une étape sépare les espèces par un point.
  const especes = etape.smiles.split('.')

  let contenus = ''
  let plus = ''
  const centres = []
  let decalage = 0

  especes.forEach((smiles, rang) => {
    const espece = dessinerEspece(smiles)
    contenus += `\n  <g transform='translate(${decalage}, 0)'>${espece.contenu}</g>`
    // Les centres suivent le décalage : la numérotation reste celle du
    // SMILES complet, espèce après espèce.
    espece.centres.forEach((c) => centres.push({ x: c.x + decalage, y: c.y }))

    if (rang < especes.length - 1) {
      plus += `\n  <text x='${decalage + CASE + ESPACEMENT / 2}' y='${HAUTEUR / 2}' text-anchor='middle' dominant-baseline='central' font-family='Karla, sans-serif' font-size='26' fill='#16130F'>+</text>`
    }
    decalage += CASE + ESPACEMENT
  })

  const largeur = especes.length * CASE + (especes.length - 1) * ESPACEMENT
  const tracees = (etape.fleches || []).map((f) => trace(f, centres))
  const fleches = tracees.map((t) => t.svg).join('\n')

  // Recadrage : on resserre la vue sur ce qui est réellement dessiné,
  // sinon la moitié de l'image est du vide — coûteux sur un téléphone.
  const points = [...centres, ...tracees.flatMap((t) => t.points)]
  const marge = 34
  const x = Math.max(0, Math.min(...points.map((p) => p.x)) - marge)
  const y = Math.max(0, Math.min(...points.map((p) => p.y)) - marge)
  const x2 = Math.min(largeur, Math.max(...points.map((p) => p.x)) + marge)
  const y2 = Math.min(HAUTEUR, Math.max(...points.map((p) => p.y)) + marge)
  const l = x2 - x
  const h = y2 - y

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
  if (idReaction.startsWith('_')) continue   // clés de documentation

  manifeste[idReaction] = {}

  for (const etape of mecanisme.etapes) {
    const nom = `${idReaction}-etape${etape.numero}.svg`
    writeFileSync(`${DOSSIER}/${nom}`, dessinerEtape(etape))
    manifeste[idReaction][etape.numero] = {
      fichier: nom,
      titre: etape.titre,
      legende: etape.legende
    }
    total++
  }
}

writeFileSync('src/data/mecanismes-dessins.json', JSON.stringify(manifeste, null, 2) + '\n')
console.log(`✓ ${total} étapes de mécanisme dessinées dans ${DOSSIER}/`)
