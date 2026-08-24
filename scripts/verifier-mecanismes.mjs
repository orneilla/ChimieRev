/**
 * VÉRIFIE LES MÉCANISMES — ne dessine rien, contrôle.
 *
 * Le problème : personne ne peut relire à la main les flèches de centaines
 * de mécanismes. Une flèche pointée sur le mauvais atome passerait alors
 * pour une vérité.
 *
 * La parade : une flèche courbe n'est pas un ornement, c'est un déplacement
 * de deux électrons — donc un calcul. En appliquant les flèches d'une étape
 * à la molécule de départ, on OBTIENT un produit. Si ce produit n'est pas
 * celui que l'étape annonce (champ "produit_attendu"), c'est qu'au moins une
 * flèche est fausse. La machine le dit, et la construction s'arrête.
 *
 * Ce que ce contrôle prouve : que les flèches mènent bien au produit annoncé,
 * et que la charge totale est conservée.
 * Ce qu'il ne prouve pas : que ce mécanisme est celui qu'emprunte la nature.
 * Cela reste le travail d'un chimiste — d'où le champ "valide".
 *
 * Comptage utilisé (charge formelle) :
 *   charge = électrons de valence − électrons non liants − Σ ordres de liaison
 * Une flèche retire deux électrons non liants à son départ (ou fait baisser
 * d'un cran l'ordre de la liaison de départ) et les dépose à l'arrivée.
 */
import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const initRDKit = require('@rdkit/rdkit')

// Électrons de valence, par numéro atomique.
const VALENCE = {
  1: 1, 3: 1, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 11: 1, 12: 2, 13: 3,
  14: 4, 15: 5, 16: 6, 17: 7, 19: 1, 30: 2, 35: 7, 53: 7,
  // Les métaux : on ne compte que les électrons de valence engagés, la
  // couche d restant en dessous. Le mercure(II) de l'oxymercuration et le
  // zinc(II) du carbénoïde de Simmons-Smith en ont deux ; l'osmium du
  // tétroxyde en a huit, ce qui lui permet ses quatre doubles liaisons ;
  // le chrome(VI) du trioxyde en a six, ce qui lui en permet trois — et
  // c'est le passage à quatre liaisons, Cr(IV), qui EST l'oxydation.
  // L'étain(IV) de l'hydrure de tributylétain en a quatre, comme le carbone
  // qu'il surplombe dans sa colonne : c'est la faiblesse de la liaison
  // Sn–H, et non une valence exotique, qui fait tout son intérêt.
  // Le cuivre(I) des cuprates n'en engage qu'UN : le cuprate R₂Cu⁻ porte
  // deux liaisons et une charge négative, et c'est ce compte-là qui rend
  // la charge du réactif de Gilman.
  // Le palladium en engage DEUX, et c'est tout le cycle catalytique : le
  // Pd(0) part avec un doublet disponible, l'addition oxydante le change
  // en deux liaisons σ — Pd(II) —, l'élimination réductrice les rend. Les
  // ligands (phosphines, solvant) ne sont pas écrits : ils ne changent
  // pas, et les faire figurer imposerait des charges formelles que la
  // liaison dative crée sans qu'elles existent.
  // Le ruthénium des catalyseurs de Grubbs en engage DEUX, exactement comme
  // le palladium et pour la même raison : le carbène Ru=CHR porte une
  // double liaison, le métallacyclobutane deux liaisons simples, et le
  // degré d'oxydation ne change JAMAIS au cours de la métathèse — Grossman
  // le souligne (p. 403). Les chlorures et les phosphines ne sont pas
  // écrits : ils ne bougent pas.
  24: 6, 29: 1, 44: 2, 46: 2, 50: 4, 76: 8, 80: 2
}
const SYMBOLE = {
  1: 'H', 3: 'Li', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 11: 'Na', 12: 'Mg',
  13: 'Al',
  14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 19: 'K', 24: 'Cr', 29: 'Cu', 30: 'Zn',
  35: 'Br', 44: 'Ru', 46: 'Pd', 50: 'Sn', 53: 'I', 76: 'Os', 80: 'Hg'
}

const RDKit = await initRDKit()

/** Lit une molécule et en tire un graphe manipulable. */
function lire(smiles) {
  const molecule = RDKit.get_mol(smiles, JSON.stringify({ removeHs: false }))
  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    throw new Error(`SMILES illisible : ${smiles}`)
  }
  const json = JSON.parse(molecule.get_json()).molecules[0]
  molecule.delete()

  const atomes = json.atoms.map((a) => ({
    z: a.z ?? 6,
    charge: a.chg ?? 0,
    hydrogenes: a.impHs ?? 0
  }))
  const liaisons = json.bonds.map((b) => ({
    atomes: b.atoms,
    ordre: b.bo ?? 1
  }))
  return { atomes, liaisons }
}

/** Somme des ordres de liaison autour d'un atome, hydrogènes compris. */
function ordresAutour(graphe, indice) {
  const liaisons = graphe.liaisons
    .filter((l) => l.atomes.includes(indice))
    .reduce((total, l) => total + l.ordre, 0)
  return liaisons + graphe.atomes[indice].hydrogenes
}

/** Applique les flèches d'une étape et renvoie le graphe obtenu. */
function appliquerFleches(graphe, fleches) {
  // Électrons non liants de départ, déduits de la charge formelle.
  const nonLiants = graphe.atomes.map((atome, i) => {
    const v = VALENCE[atome.z]
    if (v === undefined) throw new Error(`élément inconnu du comptage : Z=${atome.z}`)
    return v - atome.charge - ordresAutour(graphe, i)
  })

  const liaisons = graphe.liaisons.map((l) => ({ atomes: [...l.atomes], ordre: l.ordre }))

  const trouverLiaison = (a, b) =>
    liaisons.find((l) => (l.atomes[0] === a && l.atomes[1] === b) || (l.atomes[0] === b && l.atomes[1] === a))

  const changerOrdre = (a, b, delta) => {
    const liaison = trouverLiaison(a, b)
    if (liaison) {
      liaison.ordre += delta
      return
    }
    if (delta < 0) throw new Error(`liaison ${a}–${b} inexistante : impossible de la rompre`)
    liaisons.push({ atomes: [a, b], ordre: delta })
  }

  for (const fleche of fleches) {
    // Une flèche ordinaire déplace un DOUBLET ; un hameçon n'en déplace
    // qu'un seul électron. Une liaison valant deux électrons, un hameçon
    // fait donc varier son ordre d'un demi : il en faut deux, appariés,
    // pour rompre ou former une liaison. Les ordres non entiers sont
    // refusés plus bas — c'est ainsi qu'on attrape un hameçon orphelin.
    const electrons = fleche.electrons === 1 ? 1 : 2
    const pas = electrons / 2

    if (fleche.de.atome !== undefined) nonLiants[fleche.de.atome] -= electrons
    else changerOrdre(fleche.de.liaison[0], fleche.de.liaison[1], -pas)

    if (fleche.vers.atome !== undefined) nonLiants[fleche.vers.atome] += electrons
    else changerOrdre(fleche.vers.liaison[0], fleche.vers.liaison[1], +pas)
  }

  for (const l of liaisons) {
    if (!Number.isInteger(l.ordre)) {
      throw new Error(
        `la liaison ${l.atomes[0]}–${l.atomes[1]} se retrouve avec un ordre de ${l.ordre} : ` +
        "un hameçon n'a pas trouvé son jumeau. Une liaison ne se rompt ni ne se forme " +
        'à moitié — il en faut deux.'
      )
    }
  }

  const obtenu = {
    atomes: graphe.atomes.map((a) => ({ ...a })),
    liaisons: liaisons.filter((l) => l.ordre > 0)
  }

  // Charges formelles recalculées à partir du nouveau comptage. Un nombre
  // IMPAIR d'électrons non liants signe un radical : on le note, sans quoi
  // la lecture du molblock rendrait l'électron célibataire sous forme d'un
  // hydrogène de plus.
  obtenu.atomes.forEach((atome, i) => {
    atome.charge = VALENCE[atome.z] - nonLiants[i] - ordresAutour(obtenu, i)
    atome.radicaux = ((nonLiants[i] % 2) + 2) % 2
  })

  return obtenu
}

/** Écrit un graphe en molblock, pour le rendre à RDKit. */
function versMolblock(graphe) {
  const lignes = ['', '  ChimieRev', '']
  lignes.push(
    `${String(graphe.atomes.length).padStart(3)}${String(graphe.liaisons.length).padStart(3)}` +
    '  0  0  0  0  0  0  0  0999 V2000'
  )

  graphe.atomes.forEach((atome, i) => {
    // La valence est écrite explicitement : elle fixe le nombre
    // d'hydrogènes, qui ne doit pas être réinventé par la lecture.
    const valence = ordresAutour(graphe, i)
    lignes.push(
      '    0.0000    0.0000    0.0000 ' +
      SYMBOLE[atome.z].padEnd(3) +
      ' 0  0  0  0  0' +
      String(valence).padStart(3)
    )
  })

  for (const liaison of graphe.liaisons) {
    lignes.push(
      String(liaison.atomes[0] + 1).padStart(3) +
      String(liaison.atomes[1] + 1).padStart(3) +
      String(liaison.ordre).padStart(3) +
      '  0'
    )
  }

  const charges = graphe.atomes
    .map((a, i) => [i + 1, a.charge])
    .filter(([, c]) => c !== 0)
  for (let i = 0; i < charges.length; i += 8) {
    const lot = charges.slice(i, i + 8)
    lignes.push(
      `M  CHG${String(lot.length).padStart(3)}` +
      lot.map(([indice, charge]) => `${String(indice).padStart(4)}${String(charge).padStart(4)}`).join('')
    )
  }

  // M  RAD : 2 désigne un doublet, c'est-à-dire UN électron célibataire.
  const radicaux = graphe.atomes
    .map((a, i) => [i + 1, a.radicaux || 0])
    .filter(([, r]) => r !== 0)
  for (let i = 0; i < radicaux.length; i += 8) {
    const lot = radicaux.slice(i, i + 8)
    lignes.push(
      `M  RAD${String(lot.length).padStart(3)}` +
      lot.map(([indice]) => `${String(indice).padStart(4)}${String(2).padStart(4)}`).join('')
    )
  }

  lignes.push('M  END')
  return lignes.join('\n')
}

/** Formule canonique, hydrogènes explicites retirés, fragments triés. */
function empreinte(source, estMolblock = false) {
  const molecule = estMolblock
    ? RDKit.get_mol(source)
    : RDKit.get_mol(source, JSON.stringify({ removeHs: false }))

  if (!molecule || !molecule.is_valid()) {
    if (molecule) molecule.delete()
    return null
  }
  molecule.remove_hs_in_place()
  const smiles = molecule.get_smiles()
  molecule.delete()
  return smiles.split('.').sort().join('.')
}

// ---------------------------------------------------------------- contrôle

// On peut viser un autre fichier que celui du projet : c'est ainsi que le
// vérificateur se teste lui-même (scripts/tester-verificateur.mjs).
const fichier = process.argv[2] || 'src/data/mecanismes.json'
const mecanismes = JSON.parse(readFileSync(fichier, 'utf8'))
const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))

const anomalies = []
let controlees = 0

for (const [idReaction, mecanisme] of Object.entries(mecanismes)) {
  if (idReaction.startsWith('_')) continue

  const reaction = reactions.find((r) => r.id === idReaction)
  if (!reaction) {
    anomalies.push(`${idReaction} : aucune réaction ne porte cet identifiant.`)
    continue
  }

  for (const etape of mecanisme.etapes) {
    const fleches = etape.fleches || []
    if (fleches.length === 0) continue

    const ou = `${idReaction}, étape ${etape.numero}`

    if (!etape.produit_attendu) {
      anomalies.push(`${ou} : porte des flèches mais n'annonce aucun "produit_attendu" — rien à vérifier.`)
      continue
    }

    let obtenu
    try {
      const depart = lire(etape.smiles)
      const chargeAvant = depart.atomes.reduce((t, a) => t + a.charge, 0)
      obtenu = appliquerFleches(depart, fleches)
      const chargeApres = obtenu.atomes.reduce((t, a) => t + a.charge, 0)

      if (chargeAvant !== chargeApres) {
        anomalies.push(`${ou} : la charge totale change (${chargeAvant} → ${chargeApres}). Les flèches ne conservent pas les électrons.`)
        continue
      }
    } catch (erreur) {
      anomalies.push(`${ou} : ${erreur.message}`)
      continue
    }

    const calcule = empreinte(versMolblock(obtenu), true)
    if (calcule === null) {
      anomalies.push(`${ou} : les flèches mènent à une structure impossible (valence illégale).`)
      continue
    }

    const attendu = empreinte(etape.produit_attendu)
    if (attendu === null) {
      anomalies.push(`${ou} : le "produit_attendu" n'est pas lisible (${etape.produit_attendu}).`)
      continue
    }

    if (calcule !== attendu) {
      anomalies.push(
        `${ou} : les flèches ne mènent pas au produit annoncé.\n` +
        `      annoncé  : ${attendu}\n` +
        `      obtenu   : ${calcule}`
      )
      continue
    }

    controlees++
  }
}

if (anomalies.length > 0) {
  console.error(`\n✗ ${anomalies.length} anomalie(s) dans les mécanismes :\n`)
  for (const anomalie of anomalies) console.error('  • ' + anomalie)
  console.error('\nLa construction s\'arrête : un mécanisme faux ne doit pas être publié.\n')
  process.exit(1)
}

console.log(`✓ ${controlees} étapes vérifiées : les flèches mènent bien au produit annoncé.`)
