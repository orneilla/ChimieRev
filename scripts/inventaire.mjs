/**
 * DRESSE L'ÉTAT D'AVANCEMENT du contenu.
 *
 * Le programme (src/data/programme.json) dit ce qu'il y a à couvrir.
 * Les données disent ce qui est réellement fait. Ce script confronte les
 * deux et écrit src/data/avancement.json, que la page « Programme »
 * affiche.
 *
 * Quatre états, du moins au plus sûr :
 *   absente   — rien n'est écrit
 *   redigee   — la fiche existe (texte, explications), sans schéma
 *   verifiee  — le mécanisme est dessiné et ses flèches passent le calcul
 *   relue     — un chimiste a relu et attesté (valide: true)
 *
 * Aucune fiche ne peut se présenter comme sûre sans avoir franchi ces
 * étapes dans l'ordre.
 *
 * Et un cinquième état, qui n'est pas sur cette échelle :
 *   hors_corpus — aucun des neuf ouvrages indexés ne traite le sujet.
 *
 * Il existe parce que « à écrire » était un MENSONGE pour ces lignes-là.
 * « À écrire » veut dire « on n'y est pas encore arrivé » ; ces réactions
 * ne seront pas écrites, et pas par manque de temps : la règle de sourçage
 * interdit d'écrire ce qu'aucun ouvrage disponible ne dit. La raison est
 * portée par la ligne du programme (champ `hors_corpus`) et AFFICHÉE :
 * un silence documenté enseigne quelque chose, un trou muet ne dit rien.
 *
 * Conséquence sur les comptes : ces lignes sortent du dénominateur. Sans
 * cela chaque jauge concernée plafonnerait sous 100 % pour toujours, et
 * l'on lirait comme un retard ce qui est une limite du corpus.
 */
import { readFileSync, writeFileSync } from 'fs'

const lire = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'))

const programme = lire('src/data/programme.json')
const reactions = lire('src/data/reactions.json')
const mecanismes = lire('src/data/mecanismes.json')
const references = lire('src/data/references.json')

function etat(id, ligne) {
  if (!id && ligne.hors_corpus) return 'hors_corpus'
  if (!id || !reactions.some((r) => r.id === id)) return 'absente'

  const mecanisme = mecanismes[id]
  const etapes = mecanisme?.etapes?.filter((e) => (e.fleches || []).length > 0) || []
  if (etapes.length === 0) return 'redigee'

  // La construction refuse de publier un mécanisme dont les flèches ne
  // mènent pas au produit annoncé : présent ici veut dire vérifié.
  const toutesRelues = mecanisme.etapes.every((e) => e.valide === true)
  return toutesRelues ? 'relue' : 'verifiee'
}

const familles = programme.familles.map((famille) => {
  const liste = famille.reactions.map((reaction) => ({
    ...reaction,
    statut: etat(reaction.id, reaction),
    sources: Boolean(reaction.id && references.references_par_reaction[reaction.id])
  }))

  const compte = (statut) => liste.filter((r) => r.statut === statut).length

  return {
    id: famille.id,
    nom: famille.nom,
    famille: famille.famille,
    bloc: famille.bloc || null,
    total: liste.length,
    // Le dénominateur des jauges : ce qu'on peut effectivement écrire.
    couvrable: liste.length - compte('hors_corpus'),
    hors_corpus: compte('hors_corpus'),
    absente: compte('absente'),
    redigee: compte('redigee'),
    verifiee: compte('verifiee'),
    relue: compte('relue'),
    reactions: liste
  }
})

// Le total général compte les réactions DISTINCTES, pas les lignes du
// programme. Une même réaction y figure parfois dans deux familles — le
// Grignard est une addition sur le carbonyle ET un organométallique, la
// Baeyer-Villiger une oxydation ET un réarrangement. C'est juste du point
// de vue du programme, et faux du point de vue du compteur : sans cette
// précaution l'avancement annonçait deux fiches de plus qu'il n'en existe.
const vues = new Map()
for (const famille of familles) {
  for (const reaction of famille.reactions) {
    const cle = reaction.id || `${famille.famille}/${reaction.nom}`
    if (!vues.has(cle)) vues.set(cle, reaction.statut)
  }
}
const distinctes = [...vues.values()]
const combien = (...statuts) => distinctes.filter((s) => statuts.includes(s)).length

const avancement = {
  genere_le: new Date().toISOString().slice(0, 10),
  total: distinctes.length,
  hors_corpus: combien('hors_corpus'),
  couvrable: distinctes.length - combien('hors_corpus'),
  redigees: combien('redigee', 'verifiee', 'relue'),
  verifiees: combien('verifiee', 'relue'),
  relues: combien('relue'),
  familles
}

writeFileSync('src/data/avancement.json', JSON.stringify(avancement, null, 2) + '\n')

console.log(
  `✓ avancement : ${avancement.redigees}/${avancement.couvrable} réactions rédigées, ` +
  `${avancement.verifiees} au mécanisme vérifié, ${avancement.relues} relues par un chimiste` +
  (avancement.hors_corpus
    ? ` (+ ${avancement.hors_corpus} qu'aucun ouvrage indexé ne traite).`
    : '.')
)
