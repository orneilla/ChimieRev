// CONTRÔLE D'AFFICHAGE
//
// POURQUOI
// Une application qu'on lit sur un téléphone, une tablette et un écran
// d'ordinateur peut être irréprochable sur l'un et cassée sur l'autre. On
// ne s'en aperçoit qu'en regardant — ou en mesurant. Ce script mesure.
//
// Ce qu'il refuse :
//   1. un débordement horizontal de la page (il faudrait tourner le
//      téléphone pour lire) ;
//   2. un élément dont un bord dépasse de l'écran ;
//   3. un texte coupé par son conteneur — un intitulé de menu rogné n'est
//      pas un détail, c'est une information perdue ;
//   4. une cible tactile trop petite pour un doigt (moins de 40 px).
//
// USAGE
//   npm install --no-save playwright     (une fois, hors du dépôt)
//   npx vite preview --port 4173 &
//   node scripts/controler-affichage.mjs [http://localhost:4173]
//
// Playwright n'est PAS une dépendance du projet : il pèse lourd et la
// construction sur GitHub n'en a pas besoin. On l'installe à la demande.
let chromium
try {
  ({ chromium } = await import('playwright'))
} catch {
  console.error('Playwright manquant. Installer avec :  npm install --no-save playwright')
  process.exit(2)
}

const RACINE = process.argv[2] || 'http://localhost:4173'
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

// Les largeurs réelles des appareils courants, des plus étroits aux plus
// larges. 320 px, c'est un iPhone SE : si ça passe là, ça passe partout.
const ECRANS = [
  // 280 px : le plus étroit qu'on rencontre encore (Galaxy Fold replié).
  { nom: 'Écran replié', largeur: 280, hauteur: 653, mobile: true },
  { nom: 'iPhone SE', largeur: 320, hauteur: 568, mobile: true },
  { nom: 'Android compact', largeur: 360, hauteur: 800, mobile: true },
  { nom: 'iPhone 14', largeur: 390, hauteur: 844, mobile: true },
  { nom: 'iPhone Pro Max', largeur: 430, hauteur: 932, mobile: true },
  { nom: 'Petite tablette', largeur: 600, hauteur: 960, mobile: true },
  { nom: 'iPad portrait', largeur: 768, hauteur: 1024, mobile: true },
  { nom: 'iPad Air', largeur: 820, hauteur: 1180, mobile: true },
  { nom: 'iPad paysage', largeur: 1024, hauteur: 768, mobile: false },
  { nom: 'Portable', largeur: 1280, hauteur: 800, mobile: false },
  { nom: 'Écran large', largeur: 1440, hauteur: 900, mobile: false },
  { nom: 'Très large', largeur: 1920, hauteur: 1080, mobile: false }
]

const PAGES = [
  { nom: 'liste', route: '#/' },
  { nom: 'fiche', route: '#/reaction/mitsunobu' },
  { nom: 'fiche courte', route: '#/reaction/finkelstein' },
  { nom: 'réactifs', route: '#/reactifs' },
  { nom: 'un réactif', route: '#/reactif/pbr3' },
  { nom: 'un solvant', route: '#/solvant/acetone' },
  { nom: 'programme', route: '#/programme' },
  { nom: 'à propos', route: '#/a-propos' }
]

const CIBLE_MINIMALE = 40   // px : la taille d'un doigt, recommandation WCAG

/** Ce qui est mesuré dans la page, une fois rendue. */
function auditer(cibleMinimale) {
  const griefs = []
  const largeurVue = document.documentElement.clientWidth
  const racine = document.documentElement

  const debordement = racine.scrollWidth - largeurVue
  if (debordement > 1) griefs.push({ type: 'débordement', detail: `${debordement} px de trop en largeur` })

  const decrire = (n) => {
    const classe = typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : ''
    return n.tagName.toLowerCase() + classe
  }

  for (const n of document.querySelectorAll('body *')) {
    const style = getComputedStyle(n)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    const r = n.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    // Les libellés réservés aux lecteurs d'écran sont volontairement
    // réduits à 1 px et masqués : les mesurer n'a aucun sens.
    if (r.width <= 2 && r.height <= 2) continue

    // Un bord qui sort de l'écran.
    if (r.right > largeurVue + 1 || r.left < -1) {
      griefs.push({ type: 'hors écran', detail: `${decrire(n)} va de ${Math.round(r.left)} à ${Math.round(r.right)} px` })
    }

    // Un contenu plus large que sa boîte, sans possibilité de le faire
    // défiler : il est purement et simplement coupé.
    const rogne = n.scrollWidth - n.clientWidth
    const defilable = ['auto', 'scroll'].includes(style.overflowX)
    if (rogne > 1 && !defilable && style.overflowX === 'hidden') {
      griefs.push({ type: 'texte coupé', detail: `${decrire(n)} rogné de ${rogne} px` })
    }

    // Cibles tactiles.
    if ((n.tagName === 'A' || n.tagName === 'BUTTON') && n.offsetParent !== null) {
      if (r.height > 0 && r.height < cibleMinimale - 0.5 && n.textContent.trim()) {
        griefs.push({ type: 'cible tactile', detail: `${decrire(n)} « ${n.textContent.trim().slice(0, 22)} » ${Math.round(r.height)} px de haut` })
      }
    }
  }

  // Doublons : un même grief revient pour chaque élément d'une liste.
  const vus = new Set()
  return griefs.filter((g) => {
    const cle = g.type + '|' + g.detail.replace(/\d+/g, '#')
    if (vus.has(cle)) return false
    vus.add(cle); return true
  })
}

const navigateur = await chromium.launch({ executablePath: CHROME })
let total = 0
const parEcran = []

for (const ecran of ECRANS) {
  const contexte = await navigateur.newContext({
    viewport: { width: ecran.largeur, height: ecran.hauteur },
    isMobile: ecran.mobile,
    hasTouch: ecran.mobile,
    deviceScaleFactor: 2
  })
  const page = await contexte.newPage()
  const erreursJs = []
  page.on('pageerror', (e) => erreursJs.push(e.message))

  for (const cible of PAGES) {
    // Un fichier unique (l'aperçu publié) porte déjà son nom : on lui
    // colle l'ancre directement, sans barre oblique de plus.
    const adresse = RACINE.endsWith('.html')
      ? `${RACINE}${cible.route}`
      : `${RACINE}/${cible.route}`
    await page.goto(adresse, { waitUntil: 'networkidle' })
    await page.waitForTimeout(220)
    const griefs = await page.evaluate(auditer, CIBLE_MINIMALE)
    if (griefs.length) {
      total += griefs.length
      parEcran.push({ ecran: ecran.nom, largeur: ecran.largeur, page: cible.nom, griefs })
    }

    // Le menu replié derrière le bouton à trois barres ne se mesure pas
    // fermé : on l'ouvre, on regarde, on referme.
    const bouton = page.locator('.bouton-menu')
    if (await bouton.isVisible().catch(() => false)) {
      await bouton.click()
      await page.waitForTimeout(280)
      const menu = await page.evaluate(auditer, CIBLE_MINIMALE)
      if (menu.length) {
        total += menu.length
        parEcran.push({ ecran: `${ecran.nom}, menu ouvert`, largeur: ecran.largeur,
                        page: cible.nom, griefs: menu })
      }
      await bouton.click()
      await page.waitForTimeout(200)
    }

    // SECONDE PASSE, TEXTE AGRANDI.
    // Beaucoup de gens lisent avec une taille de police augmentée, et
    // c'est précisément là que les barres de menu se rompent. Une mise en
    // page juste ne doit pas dépendre de la taille du texte.
    // Le style est posé puis RETIRÉ : d'une page à l'autre, l'application
    // ne recharge pas le document, et une feuille oubliée fausserait
    // toutes les mesures suivantes.
    await page.addStyleTag({
      content: 'html { font-size: 125% !important; } body { font-size: 1.25rem !important; }'
    })
    await page.waitForTimeout(150)
    const agrandis = await page.evaluate(auditer, CIBLE_MINIMALE)
    await page.evaluate(() => {
      const feuilles = document.querySelectorAll('style')
      feuilles[feuilles.length - 1]?.remove()
    })
    // Une cible tactile mesurée en px absolus ne change pas de taille :
    // inutile de la signaler deux fois.
    const nouveaux = agrandis.filter((g) => g.type !== 'cible tactile')
    if (nouveaux.length) {
      total += nouveaux.length
      parEcran.push({ ecran: `${ecran.nom}, texte à 125 %`, largeur: ecran.largeur,
                      page: cible.nom, griefs: nouveaux })
    }
  }
  if (erreursJs.length) {
    total += erreursJs.length
    parEcran.push({ ecran: ecran.nom, largeur: ecran.largeur, page: '(toutes)',
                    griefs: erreursJs.map((m) => ({ type: 'erreur JS', detail: m })) })
  }
  await contexte.close()
}
await navigateur.close()

if (total === 0) {
  console.log(`✓ affichage contrôlé : ${ECRANS.length} largeurs × ${PAGES.length} pages, `
    + `taille de texte normale et agrandie — rien à redire.`)
} else {
  console.error(`✗ ${total} défaut(s) d'affichage :\n`)
  for (const bloc of parEcran) {
    console.error(`  ${bloc.ecran} (${bloc.largeur} px) — page « ${bloc.page} »`)
    for (const g of bloc.griefs) console.error(`      · ${g.type} : ${g.detail}`)
  }
  process.exit(1)
}
