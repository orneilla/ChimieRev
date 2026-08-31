/**
 * MET LA RECHERCHE À L'ÉPREUVE.
 *
 * Pourquoi un script : une recherche qui échoue le fait EN SILENCE. Elle
 * ne lève rien, elle n'affiche rien de travers — elle rend zéro résultat,
 * et l'utilisateur en conclut que la réaction n'est pas dans
 * l'application. C'est le seul défaut de cette application qui se traduit
 * par « ce que vous cherchez n'existe pas », et il mérite donc un contrôle
 * à part.
 *
 * Les deux fautes que ce testeur a d'abord attrapées sont dans les cas
 * ci-dessous : « elimination » sans accent rendait zéro, et « diels
 * alder » avec une espace aussi.
 */
import { readFileSync } from 'fs'

const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))

const { createServer } = await import('vite')
const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { chercherReactions, normaliseTexte, LONGUEUR_MINIMALE_SMILES } =
  await serveur.ssrLoadModule('/src/recherche.js')

const anomalies = []
const dire = (ok, quoi) => { if (!ok) anomalies.push(quoi) }
const trouve = (q) => chercherReactions(reactions, q)
const combien = (q) => trouve(q).length

// ————— 1. une requête vide ne masque rien —————
dire(combien('') === reactions.length, 'une requête vide devrait tout rendre.')
dire(combien('   ') === reactions.length, 'des espaces seuls devraient tout rendre.')

// ————— 2. LES ACCENTS NE DOIVENT PLUS DÉCIDER —————
for (const [avec, sans] of [
  ['élimination', 'elimination'],
  ['péricyclique', 'pericyclique'],
  ['époxyde', 'epoxyde'],
  ['réarrangement', 'rearrangement'],
  ['hétérocycle', 'heterocycle']
]) {
  const a = combien(avec)
  const b = combien(sans)
  dire(a > 0, `« ${avec} » ne rend aucun résultat : le corpus a changé, le test est à revoir.`)
  dire(a === b, `« ${avec} » rend ${a} résultats et « ${sans} » ${b} : l'accent décide encore.`)
}

// ————— 3. LE TRAIT D'UNION NON PLUS —————
for (const [tiret, espace] of [
  ['Diels-Alder', 'diels alder'],
  ['Wagner-Meerwein', 'wagner meerwein'],
  ['Baeyer-Villiger', 'baeyer villiger']
]) {
  const a = combien(tiret)
  const b = combien(espace)
  dire(a > 0, `« ${tiret} » ne rend rien : le corpus a changé.`)
  dire(a === b, `« ${tiret} » rend ${a} résultats et « ${espace} » ${b}.`)
}

// ————— 4. la casse ne décide pas non plus, sur le texte —————
dire(combien('WITTIG') === combien('wittig') && combien('wittig') > 0,
  'la casse change le résultat sur un nom propre.')

// ————— 5. LE SUBSTRAT, ce qui manquait —————
{
  // Une réaction dont on connaît le substrat doit se retrouver par lui.
  const temoin = reactions.find((r) => (r.substrat_SMILES || '').length >= 6)
  const parSubstrat = trouve(temoin.substrat_SMILES)
  dire(parSubstrat.some((r) => r.id === temoin.id),
    `« ${temoin.substrat_SMILES} » ne retrouve pas « ${temoin.id} », dont c'est le substrat.`)
}

// ————— 6. LA CASSE D'UN SMILES PORTE DU SENS —————
{
  // c1ccccc1 est aromatique, C1CCCCC1 ne l'est pas : les confondre
  // rendrait les deux à qui n'en cherche qu'un.
  const aromatiques = trouve('c1ccccc1')
  const satures = trouve('C1CCCCC1')
  dire(aromatiques.length > 0 && satures.length > 0,
    'l\'un des deux cycles témoins n\'existe plus dans le corpus.')
  dire(aromatiques.length !== satures.length ||
       aromatiques.some((r) => !satures.includes(r)),
    'le benzène aromatique et le cyclohexane saturé rendent le même résultat : ' +
    'le SMILES est comparé sans tenir compte de la casse.')
}

// ————— 7. UN SMILES TROP COURT NE FILTRE RIEN, DONC NE CHERCHE PAS —————
{
  // « C » se trouve dans presque tous les substrats. S'il était cherché,
  // il ramènerait le tableau entier — pire qu'aucun résultat, puisque
  // l'utilisateur croit avoir cherché.
  const parSmilesSeul = reactions.filter((r) => (r.substrat_SMILES || '').includes('C'))
  dire(parSmilesSeul.length > reactions.length * 0.8,
    'le témoin ne vaut plus : « C » n\'est plus dans la grande majorité des substrats.')

  const court = trouve('C')
  const parTexte = reactions.filter((r) =>
    normaliseTexte(r.nom).includes('c') ||
    normaliseTexte(r.famille).includes('c') ||
    normaliseTexte(r.symbole).includes('c') ||
    normaliseTexte((r.reactifs || []).join(' ')).includes('c'))
  dire(court.length === parTexte.length,
    `« C » rend ${court.length} résultats alors que le texte seul en donne ` +
    `${parTexte.length} : un SMILES d'un signe est cherché malgré la borne.`)

  dire(LONGUEUR_MINIMALE_SMILES >= 3, 'la borne sur la longueur du SMILES a été abaissée.')
}

// ————— 8. ce qu'on cherche vraiment se trouve —————
for (const [q, attendu] of [['Wittig', 1], ['Grignard', 1]]) {
  dire(combien(q) >= attendu, `« ${q} » devrait rendre au moins ${attendu} résultat.`)
}
// Un réactif se cherche aussi : c'est la moitié de la demande.
dire(combien('BuLi') > 0, '« BuLi » ne retrouve aucune réaction, alors que c\'est un réactif.')
dire(combien('mCPBA') > 0 || combien('m-CPBA') > 0, '« mCPBA » ne retrouve rien.')

// ————— 9. ON TESTE LE TESTEUR —————
const pieges = []
function doitRefuser(nom, verifier) {
  const avant = anomalies.length
  verifier()
  if (anomalies.length === avant) pieges.push(`✗ « ${nom} » est passé.`)
  else { anomalies.length = avant; pieges.push(`✓ ${nom} : refusé, comme il se doit.`) }
}

doitRefuser('Une recherche qui ignore les accents du corpus', () => {
  const naif = (q) => reactions.filter((r) => r.nom.toLowerCase().includes(q.toLowerCase()))
  dire(naif('élimination').length === naif('elimination').length,
    'une recherche sans normalisation devrait être refusée.')
})

doitRefuser('Une recherche qui confond les casses d\'un SMILES', () => {
  const laxiste = (q) => reactions.filter(
    (r) => (r.substrat_SMILES || '').toLowerCase().includes(q.toLowerCase()))
  dire(laxiste('c1ccccc1').length !== laxiste('C1CCCCC1').length,
    'confondre les casses d\'un SMILES devrait être refusé.')
})

doitRefuser('Un SMILES d\'un seul signe qui ramène tout', () => {
  const sansBorne = reactions.filter((r) => (r.substrat_SMILES || '').includes('C'))
  dire(sansBorne.length < reactions.length * 0.5,
    'un SMILES d\'un signe qui ramène tout devrait être refusé.')
})

await serveur.close()

for (const p of pieges) console.log(p)
if (pieges.some((p) => p.startsWith('✗'))) {
  console.error('\n✗ Le contrôle laisse passer des recherches fautives.\n')
  process.exit(1)
}
console.log('✓ Le contrôle détecte bien les recherches qu\'on lui tend.\n')

if (anomalies.length) {
  console.error(`✗ ${anomalies.length} anomalie(s) dans la recherche :\n`)
  for (const a of anomalies) console.error('  • ' + a)
  console.error('\nLa construction s\'arrête : une recherche muette fait croire ' +
    'que la réaction n\'existe pas.\n')
  process.exit(1)
}

console.log(
  `✓ recherche : accents, traits d'union, casse et substrat éprouvés sur ` +
  `${reactions.length} fiches.`
)
