/**
 * VALIDE LES FICHES avant publication.
 *
 * Produire vingt réactions d'affilée, c'est l'occasion d'en laisser passer
 * une à moitié écrite : un champ oublié, un SMILES fautif, une famille mal
 * orthographiée qui perd sa couleur. Ce contrôle refuse ces oublis au lieu
 * de les publier.
 *
 * Il sépare deux choses :
 *   ANOMALIE — la fiche est cassée ou trompeuse : la construction s'arrête.
 *   RÉSERVE  — la fiche est publiable mais incomplète : on l'annonce.
 */
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { FAMILLES_REACTIFS, FAMILLES_SOLVANTS } from '../src/familles-outils.js'
import { COULEURS_FAMILLES, contraste, ecartCouleurs } from '../src/couleurs.js'

const require = createRequire(import.meta.url)
const initRDKit = require('@rdkit/rdkit')

const lire = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'))

const reactions = lire('src/data/reactions.json')
const reactifs = lire('src/data/reactifs.json')
const solvants = lire('src/data/solvants.json')
const references = lire('src/data/references.json')
const programme = lire('src/data/programme.json')

const RDKit = await initRDKit()

const FAMILLES_CONNUES = new Set(programme.familles.map((f) => f.famille))

// Les identifiants que le programme déclare pointer vers une fiche écrite.
// Une fiche absente de cette liste existe dans les données et ne s'atteint
// depuis aucune page « programme » : elle ne se voit pas, et le compte
// d'avancement l'ignore.
const IDS_AU_PROGRAMME = new Set(
  programme.familles.flatMap((f) => (f.reactions || []).map((r) => r && r.id).filter(Boolean))
)
const CHAMPS = [
  'id', 'nom', 'famille', 'substrat_SMILES', 'produit_SMILES', 'reactifs',
  'solvant', 'mecanisme_etapes', 'selectivite', 'pieges',
  'explication_reference', 'explication_comprendre', 'niveau_difficulte'
]

// La FORME attendue de chaque champ, et non sa seule présence.
//
// Le contrôle précédent ne vérifiait que « présent et non vide ». Or une
// LISTE écrite par mégarde comme une chaîne est présente et non vide : elle
// passait. Dix-neuf fiches ont ainsi été publiées avec « pieges » en texte
// d'un seul tenant, là où la page fait `reaction.pieges.map(...)`. Résultat :
// un TypeError, un écran BLANC — et, le routeur étant en `hash`, l'erreur
// tuait l'application entière jusqu'au rechargement complet, pas seulement
// la fiche fautive.
//
// Rien ne le signalait : ni `valider`, ni `verifier`, ni les dessins, ni
// l'inventaire. Il fallait ouvrir la page.
const FORMES = {
  reactifs: 'liste',
  mecanisme_etapes: 'liste',
  pieges: 'liste',
  nom: 'texte',
  famille: 'texte',
  solvant: 'texte',
  selectivite: 'texte',
  explication_reference: 'texte',
  explication_comprendre: 'texte'
}

const anomalies = []
const reserves = []

const lisible = (smiles) => {
  const molecule = RDKit.get_mol(smiles)
  const valide = Boolean(molecule && molecule.is_valid())
  if (molecule) molecule.delete()
  return valide
}

const identifiants = new Set()

for (const reaction of reactions) {
  const ou = `réaction « ${reaction.id || '(sans identifiant)'} »`

  for (const champ of CHAMPS) {
    const valeur = reaction[champ]
    const vide = valeur === undefined || valeur === null || valeur === '' ||
      (Array.isArray(valeur) && valeur.length === 0)
    if (vide) anomalies.push(`${ou} : champ « ${champ} » manquant ou vide.`)

    const forme = FORMES[champ]
    if (!vide && forme === 'liste' && !Array.isArray(valeur)) {
      anomalies.push(
        `${ou} : champ « ${champ} » doit être une LISTE, pas ${typeof valeur}. ` +
        `La page l'affiche par .map() : une chaîne y provoque un écran blanc.`
      )
    }
    if (!vide && forme === 'texte' && typeof valeur !== 'string') {
      anomalies.push(`${ou} : champ « ${champ} » doit être du TEXTE, pas ${typeof valeur}.`)
    }
  }

  if (reaction.id && !/^[a-z0-9_]+$/.test(reaction.id)) {
    anomalies.push(`${ou} : l'identifiant doit s'écrire en minuscules sans accent ni espace.`)
  }
  if (identifiants.has(reaction.id)) {
    anomalies.push(`${ou} : cet identifiant est utilisé deux fois.`)
  }
  identifiants.add(reaction.id)

  for (const champ of ['substrat_SMILES', 'produit_SMILES']) {
    if (reaction[champ] && !lisible(reaction[champ])) {
      anomalies.push(`${ou} : ${champ} illisible (${reaction[champ]}).`)
    }
  }

  const niveau = reaction.niveau_difficulte
  if (typeof niveau !== 'number' || niveau < 1 || niveau > 10) {
    anomalies.push(`${ou} : la difficulté doit être un nombre de 1 à 10 (reçu : ${niveau}).`)
  }

  // Une famille inconnue perd sa couleur : la couleur porte l'information,
  // donc une faute de frappe ici n'est pas anodine.
  if (reaction.famille && !FAMILLES_CONNUES.has(reaction.famille)) {
    anomalies.push(
      `${ou} : famille « ${reaction.famille} » absente du programme. ` +
      `Familles connues : ${[...FAMILLES_CONNUES].join(', ')}.`
    )
  }

  // Le piège s'est présenté cinq fois : le programme écrit « Procédé
  // Monsanto\u00a0: … » avec une insécable, la fiche s'appelait pareil avec une
  // espace ordinaire, et le rapprochement par le nom a silencieusement échoué.
  // Rien ne cassait — la fiche existait, elle n'était simplement reliée à
  // rien. C'est le COMPTE d'avancement qui l'a trahie, et seulement parce
  // qu'on le regardait.
  if (!IDS_AU_PROGRAMME.has(reaction.id)) {
    anomalies.push(
      `${ou} : la fiche n'est reliée à aucune ligne du programme. ` +
      `Poser "id": "${reaction.id}" sur la ligne correspondante de programme.json ` +
      `— en comparant les noms APRÈS normalisation, l'insécable devant « : » ne se voit pas.`
    )
  }

  if (!reaction.symbole) {
    reserves.push(`${ou} : pas de symbole court — l'identifiant sera affiché sur la tuile.`)
  } else if (reaction.symbole.length > 6) {
    reserves.push(`${ou} : symbole « ${reaction.symbole} » long (plus de 6 signes) sur une tuile.`)
  }

  if (!references.references_par_reaction[reaction.id]) {
    reserves.push(`${ou} : aucune référence — la fiche l'annonce, mais elle reste à sourcer.`)
  }

  // Typographie française : une espace ordinaire devant « ? » ou « : »
  // laisse le signe partir seul en début de ligne sur un écran étroit.
  // Il faut une espace insécable (U+00A0).
  const fautives = ['nom', 'selectivite', 'explication_reference', 'explication_comprendre']
    .flatMap((champ) => String(reaction[champ] || '').match(/ [?!;:»]/g) || [])
  if (fautives.length) {
    reserves.push(`${ou} : ${fautives.length} espace(s) ordinaire(s) devant une `
      + 'ponctuation double — il faut une insécable.')
  }

  // L'esprit du mode « Comprendre » : on répond au pourquoi avant le comment.
  if (reaction.explication_comprendre &&
      !/POURQUOI|QU'EST-CE|QUE\b/.test(reaction.explication_comprendre)) {
    reserves.push(`${ou} : l'explication « Comprendre » n'ouvre pas sur un POURQUOI.`)
  }
}

for (const [nom, liste, familles] of [
  ['réactif', reactifs, FAMILLES_REACTIFS],
  ['solvant', solvants, FAMILLES_SOLVANTS]
]) {
  for (const entree of liste) {
    if (entree.SMILES && !lisible(entree.SMILES)) {
      anomalies.push(`${nom} « ${entree.id} » : SMILES illisible (${entree.SMILES}).`)
    }
    if (!entree.explication_comprendre) {
      reserves.push(`${nom} « ${entree.id} » : pas d'explication accessible.`)
    }
    // La famille est ce qui range le produit dans le magasin. Une faute
    // de frappe y créerait un groupe d'un seul élément sans rien casser :
    // c'est exactement le genre de défaut qu'on ne voit jamais.
    if (!familles.includes(entree.famille)) {
      anomalies.push(
        `${nom} « ${entree.id} » : famille inconnue (${entree.famille ?? 'aucune'}).`
      )
    }
  }
}

// ---------------------------------------------------------------------
// LA PALETTE. Une couleur de famille est toujours un FOND sur lequel on
// écrit à l'encre, et elle doit se distinguer des vingt-sept autres. Ces
// deux propriétés se mesurent ; sans mesure elles se dégradent sans que
// personne ne s'en aperçoive — c'est ce qui était arrivé.

const ENCRE = '#16130F'
const CONTRASTE_MINIMAL = 4.5
const ECART_MINIMAL = 15      // ΔE CIELAB : sous 15, deux aplats se confondent

const palette = Object.entries(COULEURS_FAMILLES)

for (const [famille, couleur] of palette) {
  const c = contraste(couleur, ENCRE)
  if (c < CONTRASTE_MINIMAL) {
    anomalies.push(
      `couleur de « ${famille} » (${couleur}) : contraste ${c.toFixed(2)} avec l'encre, ` +
      `il en faut ${CONTRASTE_MINIMAL} — l'intitulé y serait illisible.`
    )
  }
}

for (let i = 0; i < palette.length; i++) {
  for (let j = i + 1; j < palette.length; j++) {
    const d = ecartCouleurs(palette[i][1], palette[j][1])
    if (d < ECART_MINIMAL) {
      anomalies.push(
        `« ${palette[i][0]} » (${palette[i][1]}) et « ${palette[j][0]} » ` +
        `(${palette[j][1]}) : ΔE ${d.toFixed(1)}, elles se confondent.`
      )
    }
  }
}

// Une entrée de references.json qui ne correspond à AUCUNE fiche ne s'affiche
// nulle part : elle est perdue sans bruit. C'est arrivé — quatre DOI vérifiés
// des articles fondateurs de Woodward et Hoffmann dormaient sous la clé
// « woodward_hoffmann_pericycliques », alors que la fiche s'appelle
// « woodward_hoffmann ». Rien ne cassait, rien ne s'affichait.
const idsFiches = new Set(reactions.map((r) => r.id))
for (const cle of Object.keys(references.references_par_reaction)) {
  if (!idsFiches.has(cle)) {
    anomalies.push(
      `references.json : la clé « ${cle} » ne correspond à aucune fiche — ` +
      'ses références ne sont affichées nulle part.'
    )
  }
}

// Une ligne du programme sans identifiant est un TROU, et la page
// « Programme » l'étiquetait « à écrire » — c'est-à-dire « on n'y est pas
// encore arrivé ». Pour les six réactions qu'aucun des neuf ouvrages ne
// traite, c'était faux : elles ne seront pas écrites, et pas par manque de
// temps. Le lecteur voyait un retard là où il y a une limite du corpus.
//
// La règle « un ouvrage muet est un RÉSULTAT, pas un oubli » vaut donc
// aussi pour le programme : toute ligne sans identifiant doit porter un
// champ `hors_corpus` disant ce que la recherche a rendu — et ce texte
// s'affiche. Sans cette garantie, un simple oubli d'identifiant passerait
// pour un silence documenté, ce qui est exactement le mensonge inverse.
for (const famille of programme.familles) {
  for (const ligne of famille.reactions || []) {
    if (ligne.id) {
      if (ligne.hors_corpus) {
        anomalies.push(
          `programme.json : « ${ligne.nom} » porte à la fois un identifiant ` +
          'et une raison « hors corpus ». Une fiche écrite n\'est pas hors corpus.'
        )
      }
      continue
    }
    const raison = ligne.hors_corpus
    if (typeof raison !== 'string' || raison.trim().length < 40) {
      anomalies.push(
        `programme.json : « ${ligne.nom} » (famille « ${famille.famille} ») n'a ` +
        'pas d\'identifiant et pas de raison lisible. Poser "hors_corpus" avec ce ' +
        'que la recherche dans les neuf ouvrages a rendu — la page l\'affiche.'
      )
    }
  }
}

if (reserves.length) {
  console.log(`\n${reserves.length} réserve(s) — publiable, mais incomplet :`)
  for (const reserve of reserves) console.log('  · ' + reserve)
}

if (anomalies.length) {
  console.error(`\n✗ ${anomalies.length} anomalie(s) dans les fiches :\n`)
  for (const anomalie of anomalies) console.error('  • ' + anomalie)
  console.error('\nLa construction s\'arrête : une fiche cassée ne doit pas être publiée.\n')
  process.exit(1)
}

console.log(`\n✓ ${reactions.length} fiches valides (${reactifs.length} réactifs, ${solvants.length} solvants).`)
