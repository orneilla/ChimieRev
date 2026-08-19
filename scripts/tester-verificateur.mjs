/**
 * TESTE LES CONTRÔLES — car un contrôle qui ne détecte rien ne protège
 * de rien.
 *
 * On prend les mécanismes du projet, on y glisse une faute connue, et on
 * exige que le vérificateur la refuse. S'il l'accepte, c'est LUI qui est
 * cassé, et il faut le savoir avant de lui faire confiance.
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'fs'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'

const original = JSON.parse(readFileSync('src/data/mecanismes.json', 'utf8'))
const dossier = mkdtempSync(join(tmpdir(), 'chimierev-'))

/** Lance le vérificateur sur des données modifiées ; renvoie true s'il refuse. */
function refuse(nom, modifier) {
  const donnees = JSON.parse(JSON.stringify(original))
  modifier(donnees)
  const chemin = join(dossier, 'mecanismes.json')
  writeFileSync(chemin, JSON.stringify(donnees))

  try {
    execFileSync('node', ['scripts/verifier-mecanismes.mjs', chemin], { stdio: 'pipe' })
    console.error(`✗ ${nom} : le vérificateur a LAISSÉ PASSER la faute.`)
    return false
  } catch {
    console.log(`✓ ${nom} : refusé, comme il se doit.`)
    return true
  }
}

const etape = (donnees, id, numero) => donnees[id].etapes.find((e) => e.numero === numero)

/** Le dessinateur doit refuser un schéma où les numéros deviennent illisibles. */
function refuseDessin(nom, donnees, environnement = {}) {
  const chemin = join(dossier, 'meca-illisible.json')
  const sortie = join(dossier, 'dessins')
  mkdirSync(sortie, { recursive: true })
  writeFileSync(chemin, JSON.stringify(donnees))

  try {
    execFileSync('node', ['scripts/dessiner-mecanismes.mjs', chemin, sortie,
                          join(dossier, 'manifeste.json')],
                 { stdio: 'pipe', env: { ...process.env, ...environnement } })
    console.error(`✗ ${nom} : le dessinateur a PUBLIÉ un schéma illisible.`)
    return false
  } catch {
    console.log(`✓ ${nom} : refusé, comme il se doit.`)
    return true
  }
}

const resultats = [
  // La flèche du nucléophile vise le mauvais carbone.
  refuse('SN2, flèche sur le mauvais carbone', (d) => {
    etape(d, 'sn2', 1).fleches[0].vers.liaison = [0, 1]
  }),

  // La liaison qui se rompt n'est pas la bonne.
  refuse('SN2, mauvaise liaison rompue', (d) => {
    etape(d, 'sn2', 1).fleches[0] = { de: { liaison: [1, 2] }, vers: { atome: 1 } }
  }),

  // Une flèche manque : le brome ne part pas.
  refuse('SN2, flèche manquante', (d) => {
    etape(d, 'sn2', 1).fleches.pop()
  }),

  // Le produit annoncé n'est pas celui que les flèches donnent.
  refuse('Grignard, produit annoncé erroné', (d) => {
    etape(d, 'grignard', 1).produit_attendu = 'CC(O)(C)C'
  }),

  // Une étape porte des flèches mais n'annonce aucun produit : rien à vérifier.
  refuse('E2, aucun produit annoncé', (d) => {
    delete etape(d, 'e2', 1).produit_attendu
  }),

  // Le contrôle de lisibilité doit refuser ce qu'il ne peut pas placer.
  // On lui impose des dégagements impossibles à tenir : s'il publie quand
  // même, c'est qu'il ne contrôle rien.
  refuseDessin('Numéros impossibles à dégager', {
    essai: {
      etapes: [{
        numero: 1,
        titre: 'Essai de surcharge',
        smiles: 'C=CC=C',
        legende: 'Quatre flèches sur une petite molécule.',
        fleches: [
          { de: { liaison: [0, 1] }, vers: { atome: 0 }, courbure: 0.2 },
          { de: { liaison: [0, 1] }, vers: { atome: 1 }, courbure: -0.2 },
          { de: { liaison: [2, 3] }, vers: { atome: 2 }, courbure: 0.2 },
          { de: { liaison: [2, 3] }, vers: { atome: 3 }, courbure: -0.2 }
        ]
      }]
    }
  }, { CHIMIEREV_DEGAGEMENT_ATOME: '150', CHIMIEREV_DEGAGEMENT_NUMERO: '150' }),

  // Le « + » de l'équation compte autant que le reste : une flèche qui le
  // barre, ou un numéro posé dessus, fait douter du nombre d'espèces.
  refuseDessin('« + » barré par une flèche', {
    essai: {
      etapes: [{
        numero: 1,
        titre: 'Essai sur le signe de l\'équation',
        smiles: 'CCBr.[O-]C',
        legende: 'Une flèche qui traverse l\'espace entre les deux espèces.',
        fleches: [
          { de: { atome: 3 }, vers: { liaison: [3, 1] }, courbure: 0.3 },
          { de: { liaison: [1, 2] }, vers: { atome: 2 }, courbure: 0.35 }
        ]
      }]
    }
  }, { CHIMIEREV_DEGAGEMENT_SIGNE: '400' })
]

if (resultats.every(Boolean)) {
  console.log('\n✓ Le vérificateur détecte bien les fautes qu\'on lui tend.')
} else {
  console.error('\n✗ Le vérificateur est défaillant : il ne protège de rien.')
  process.exit(1)
}
