/**
 * Ouvre CHAQUE page de l'application et vérifie qu'elle s'affiche.
 *
 * Ce contrôle a été écrit après coup, parce qu'un défaut est passé sous tous
 * les autres : dix-neuf fiches publiées avec le champ « pieges » écrit comme
 * une chaîne au lieu d'une liste. La page fait `reaction.pieges.map(...)` ;
 * une chaîne y lève un TypeError, et l'on n'obtient qu'un ÉCRAN BLANC.
 *
 * Rien ne le signalait. `valider` trouvait le champ présent et non vide,
 * `verifier` ne regarde que les flèches, les dessins sortaient, l'inventaire
 * comptait juste. Le seul moyen de le voir était d'ouvrir la page — et
 * personne n'ouvre trois cent cinquante-cinq pages à la main.
 *
 * Le routeur étant en `hash`, l'erreur ne se limitait pas à la fiche fautive :
 * elle tuait l'application ENTIÈRE jusqu'au rechargement complet. D'où le
 * `about:blank` entre chaque page ci-dessous — sans lui, le balayage lui-même
 * mentirait, en attribuant à toutes les pages suivantes la panne de la
 * première.
 *
 * Trois symptômes sont retenus : une erreur JavaScript, une page dont le
 * corps ne porte presque aucun texte, et une page TROP LENTE.
 *
 * Le troisième a été ajouté après un second défaut que ce script laissait
 * passer, et il vaut d'être compris. La page « Réactifs » mettait TRENTE
 * SECONDES à s'ouvrir : elle calculait ses renvois une fois par vignette,
 * chaque calcul reparcourant les 275 réactions. Sur un téléphone, Safari
 * tuait l'onglet — et le routeur étant en `hash`, l'application entière
 * mourait avec lui.
 *
 * Ce script la déclarait pourtant saine. Il n'avait aucun budget de temps :
 * il attendait `networkidle`, aussi longtemps qu'il fallait, puis
 * constatait que la page portait du texte. UNE PAGE QUI FINIT PAR
 * S'AFFICHER N'EST PAS UNE PAGE QUI MARCHE — et l'utilisateur, lui, le
 * savait avant nous.
 *
 *   npx vite preview --port 4173 &
 *   npm run pages
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.CHIMIEREV_BASE || 'http://localhost:4173'
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const MINIMUM_DE_TEXTE = 40

// Le budget d'ouverture. Il est large à dessein : cette machine est
// partagée, et l'on ne cherche pas à défendre quelques centaines de
// millisecondes. On cherche à ce qu'une page de trente secondes ne puisse
// plus se présenter comme une page qui s'affiche. Pour mémoire, la page
// « Réactifs » a été mesurée à 29 661 ms avant l'index de src/liens.js,
// et à moins de 400 ms après.
const BUDGET_MS = Number(process.env.CHIMIEREV_BUDGET_MS || 6000)

const lire = (chemin) => JSON.parse(fs.readFileSync(chemin, 'utf8'))
const reactions = lire('src/data/reactions.json')
const reactifs = lire('src/data/reactifs.json')
const solvants = lire('src/data/solvants.json')

const pages = [
  { url: '/#/', quoi: 'accueil' },
  { url: '/#/programme', quoi: 'programme' },
  { url: '/#/reactifs', quoi: 'le magasin' },
  { url: '/#/quiz', quoi: 'le quiz' },
  { url: '/#/revision', quoi: 'la révision du jour' },
  { url: '/#/progression', quoi: 'la progression' },
  { url: '/#/a-propos', quoi: 'à propos' },
  ...reactions.map((r) => ({ url: `/#/reaction/${r.id}`, quoi: `réaction ${r.id}` })),
  ...reactifs.map((r) => ({ url: `/#/reactif/${r.id}`, quoi: `réactif ${r.id}` })),
  ...solvants.map((s) => ({ url: `/#/solvant/${s.id}`, quoi: `solvant ${s.id}` }))
]

const navigateur = await chromium.launch({ executablePath: CHROME })
const onglet = await navigateur.newPage({ viewport: { width: 390, height: 800 } })

let erreurs = []
onglet.on('pageerror', (e) => erreurs.push(String(e.message).split('\n')[0]))
onglet.on('console', (m) => {
  if (m.type() === 'error') erreurs.push('console : ' + m.text().split('\n')[0].slice(0, 160))
})

const casses = []
let lente = { quoi: '—', duree: 0 }

for (const { url, quoi } of pages) {
  // Rechargement complet : sans cela, une page plantée contamine les suivantes.
  await onglet.goto('about:blank')
  erreurs = []
  const depart = Date.now()
  await onglet.goto(BASE + url, { waitUntil: 'networkidle' })

  // ON CHRONOMÈTRE JUSQU'ICI, ET PAS JUSQU'AU `goto`.
  //
  // Première tentative, fausse : le temps était pris à la fin du `goto`.
  // Or `networkidle` ne dit RIEN du fil principal — sur la page
  // « Réactifs », il rendait la main en 767 ms pendant que le rendu de
  // React bloquait encore le navigateur pendant vingt-six secondes. Le
  // budget mesurait donc précisément la partie qui allait bien.
  //
  // `innerText` force le calcul de mise en page : il ne peut pas répondre
  // tant que le fil principal est occupé. C'est cette lecture qui mesure
  // le moment où la page devient réellement utilisable.
  const texte = (await onglet.locator('body').innerText()).trim()
  const duree = Date.now() - depart

  const griefs = [...new Set(erreurs)]
  if (texte.length < MINIMUM_DE_TEXTE) griefs.push(`la page est vide (${texte.length} signes)`)
  if (duree > BUDGET_MS) {
    griefs.push(`elle met ${(duree / 1000).toFixed(1)} s à s'ouvrir `
      + `(budget ${(BUDGET_MS / 1000).toFixed(0)} s) — sur un téléphone, `
      + `comptez-en plusieurs fois plus`)
  }
  if (duree > lente.duree) lente = { quoi, duree }
  if (griefs.length > 0) casses.push({ quoi, url, griefs: griefs.slice(0, 3) })
}

await navigateur.close()

if (casses.length > 0) {
  console.error(`\n✗ ${casses.length} page(s) ne s'affichent pas :\n`)
  for (const c of casses) {
    console.error(`  • ${c.quoi}  (${c.url})`)
    for (const g of c.griefs) console.error(`      ${g}`)
  }
  console.error('\nUne page blanche n\'est pas un détail : elle emporte toute l\'application.\n')
  process.exit(1)
}

console.log(`✓ ${pages.length} pages ouvertes une à une : toutes s'affichent, `
  + `la plus lente en ${(lente.duree / 1000).toFixed(1)} s (${lente.quoi}).`)
