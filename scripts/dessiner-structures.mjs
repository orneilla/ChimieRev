/**
 * Dessine les structures 2D de toutes les molécules à partir de leurs SMILES,
 * avec RDKit-JS, et les enregistre en fichiers SVG dans public/structures/.
 *
 * POURQUOI au moment de la construction, et non dans le navigateur ?
 * RDKit pèse environ 7 Mo (WebAssembly). Le faire télécharger à chaque
 * visite serait pénible sur un téléphone. Ici, le dessin est fait une fois
 * pour toutes ; l'application n'affiche que des images légères, qui
 * s'affichent instantanément et fonctionnent même hors connexion.
 *
 * Ce script tourne automatiquement avant chaque construction (voir le
 * script "prebuild" dans package.json), y compris sur GitHub.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const initRDKit = require('@rdkit/rdkit')

const DOSSIER = 'public/structures'
const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))
const reactifs = JSON.parse(readFileSync('src/data/reactifs.json', 'utf8'))
const solvants = JSON.parse(readFileSync('src/data/solvants.json', 'utf8'))

// Options de dessin.
//
// fixedBondLength est la clé : sans elle, RDKit agrandit chaque molécule
// jusqu'à remplir le cadre, si bien qu'une petite molécule apparaît
// énorme et une grosse minuscule. En imposant une longueur de liaison
// constante, toutes les structures de l'application sont à la même
// échelle — comme dans un manuel — et se comparent d'un coup d'œil.
const options = (largeur, hauteur) => JSON.stringify({
  width: largeur,
  height: hauteur,
  backgroundColour: [1, 1, 1, 0],   // fond transparent
  fixedBondLength: 36,              // pixels par liaison, partout pareil
  bondLineWidth: 2,
  scaleBondWidth: false,
  minFontSize: 15,                  // lisible sur un écran de téléphone
  maxFontSize: 22,
  addStereoAnnotation: true,        // annote la stéréochimie s'il y en a
  centreMoleculesBeforeDrawing: true,
  explicitMethyl: false
})

const RDKit = await initRDKit()

// On repart d'un dossier propre : plus de fichiers orphelins si un SMILES
// change ou si une réaction disparaît.
rmSync(DOSSIER, { recursive: true, force: true })
mkdirSync(DOSSIER, { recursive: true })

const manifeste = {}
const echecs = []

/** Dessine une molécule et renvoie le nom du fichier, ou null si échec. */
function dessiner(smiles, nomFichier, largeur = 300, hauteur = 180) {
  const molecule = RDKit.get_mol(smiles)

  // get_mol renvoie un objet invalide (et non une erreur) si le SMILES
  // est mal formé : il faut le vérifier explicitement.
  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    echecs.push(`${nomFichier} — SMILES illisible : ${smiles}`)
    return null
  }

  const svg = molecule.get_svg_with_highlights(options(largeur, hauteur))
  molecule.delete()

  writeFileSync(`${DOSSIER}/${nomFichier}.svg`, svg)
  return `${nomFichier}.svg`
}

for (const reaction of reactions) {
  const substrat = dessiner(reaction.substrat_SMILES, `${reaction.id}-substrat`)
  const produit = dessiner(reaction.produit_SMILES, `${reaction.id}-produit`)
  manifeste[reaction.id] = { substrat, produit }
}

for (const reactif of reactifs) {
  if (!reactif.SMILES) continue
  manifeste[reactif.id] = { molecule: dessiner(reactif.SMILES, `reactif-${reactif.id}`) }

  // Les réactions d'exemple portées par le réactif sont dessinées aussi.
  ;(reactif.reactions_exemples || []).forEach((exemple, rang) => {
    const cle = `${reactif.id}-ex${rang}`
    manifeste[cle] = {
      substrat: dessiner(exemple.substrat_SMILES, `${cle}-substrat`),
      produit: dessiner(exemple.produit_SMILES, `${cle}-produit`)
    }
  })
}

for (const solvant of solvants) {
  if (!solvant.SMILES) continue
  manifeste[solvant.id] = { molecule: dessiner(solvant.SMILES, `solvant-${solvant.id}`) }
}

writeFileSync('src/data/structures.json', JSON.stringify(manifeste, null, 2) + '\n')

const dessinees = Object.values(manifeste).flatMap(Object.values).filter(Boolean).length
console.log(`✓ ${dessinees} structures dessinées dans ${DOSSIER}/`)
if (echecs.length) console.log('⚠ non dessinées :\n  ' + echecs.join('\n  '))
