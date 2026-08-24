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
 */
import { readFileSync, writeFileSync } from 'fs'

const lire = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'))

const programme = lire('src/data/programme.json')
const reactions = lire('src/data/reactions.json')
const mecanismes = lire('src/data/mecanismes.json')
const references = lire('src/data/references.json')

function etat(id) {
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
    statut: etat(reaction.id),
    sources: Boolean(reaction.id && references.references_par_reaction[reaction.id])
  }))

  const compte = (statut) => liste.filter((r) => r.statut === statut).length

  return {
    id: famille.id,
    nom: famille.nom,
    famille: famille.famille,
    bloc: famille.bloc || null,
    total: liste.length,
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
  redigees: combien('redigee', 'verifiee', 'relue'),
  verifiees: combien('verifiee', 'relue'),
  relues: combien('relue'),
  familles
}

writeFileSync('src/data/avancement.json', JSON.stringify(avancement, null, 2) + '\n')

console.log(
  `✓ avancement : ${avancement.redigees}/${avancement.total} réactions rédigées, ` +
  `${avancement.verifiees} au mécanisme vérifié, ${avancement.relues} relues par un chimiste.`
)
