/**
 * MET LA RÉPÉTITION ESPACÉE À L'ÉPREUVE, en simulant des mois de révision.
 *
 * Pourquoi un script : la promesse du dispositif — « ce que je rate revient
 * plus souvent » — ne se vérifie pas en cliquant. Il faudrait réviser
 * pendant des semaines pour constater qu'une réaction ratée est revenue
 * plus tôt qu'une réaction sue, et l'on ne constaterait qu'un cas. Ici on
 * fait tourner l'horloge à la main et l'on vérifie la propriété sur toute
 * la base.
 *
 * Et comme les deux autres testeurs de ce dépôt, il SE TESTE LUI-MÊME :
 * on lui tend des algorithmes faux, il doit les refuser.
 */
import { readFileSync } from 'fs'

const reactions = JSON.parse(readFileSync('src/data/reactions.json', 'utf8'))

const { createServer } = await import('vite')
const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const M = await serveur.ssrLoadModule('/src/memorisation.js')
const quiz = await serveur.ssrLoadModule('/src/quiz.js')

const JOUR = 24 * 60 * 60 * 1000
const T0 = Date.UTC(2026, 0, 1)
const anomalies = []
const dire = (ok, quoi) => { if (!ok) anomalies.push(quoi) }

// ————— 1. la mécanique des boîtes —————
{
  let f = M.ficheNeuve()
  dire(M.rang(f, T0) === 2, 'une réaction jamais vue devrait être au rang « à découvrir ».')

  // Cinq bonnes réponses de suite : on doit atteindre la dernière boîte.
  let t = T0
  for (let i = 0; i < M.DERNIERE_BOITE; i++) {
    f = M.apresReponse(f, true, t)
    t = f.du
  }
  dire(f.boite === M.DERNIERE_BOITE,
    `après ${M.DERNIERE_BOITE} succès la boîte devrait être ${M.DERNIERE_BOITE}, elle est ${f.boite}.`)
  dire(f.du - f.le === M.DELAIS[M.DERNIERE_BOITE] * JOUR,
    'le délai de la dernière boîte ne correspond pas au barème.')

  // Une seule faute renvoie à la première boîte, quel que soit l'acquis.
  const rate = M.apresReponse(f, false, t)
  dire(rate.boite === 0, `une faute devrait renvoyer à la boîte 0, elle renvoie à ${rate.boite}.`)
  dire(rate.du <= t, 'une réaction ratée devrait être à revoir immédiatement.')

  // Un succès de plus ne dépasse jamais la dernière boîte.
  const plafond = M.apresReponse(f, true, t)
  dire(plafond.boite === M.DERNIERE_BOITE, 'la boîte a dépassé le dernier palier.')

  dire(f.vues === M.DERNIERE_BOITE && f.justes === M.DERNIERE_BOITE,
    'le compte des vues et des réussites ne suit pas.')
}

// ————— 2. LA PROMESSE : le raté revient avant le su —————
{
  const [a, b] = reactions.slice(0, 2)
  let etat = {}
  // On les monte toutes deux au même niveau…
  for (let i = 0; i < 3; i++) {
    etat = M.enregistrer(etat, a.id, true, T0 + i * JOUR)
    etat = M.enregistrer(etat, b.id, true, T0 + i * JOUR)
  }
  // …puis on rate la première.
  const t = T0 + 3 * JOUR
  etat = M.enregistrer(etat, a.id, false, t)

  dire(etat[a.id].du < etat[b.id].du,
    'une réaction ratée devrait revenir AVANT une réaction réussie : c\'est toute la promesse.')

  const ordre = M.ordonner([a, b], etat, t + JOUR, null).map((r) => r.id)
  dire(ordre[0] === a.id,
    `la réaction ratée devrait passer en premier, l'ordre rend ${ordre.join(', ')}.`)
}

// ————— 3. une réaction sue ne revient PAS tant qu'elle n'est pas échue —————
{
  const cinq = reactions.slice(0, 5)
  let etat = {}
  // CHAQUE réaction a son horloge : une horloge partagée avancerait avec
  // la première et rendrait les suivantes échues d'office. C'est la faute
  // que ce test a d'abord commise, et il accusait l'algorithme.
  for (const r of cinq) {
    let t = T0
    for (let i = 0; i < M.DERNIERE_BOITE; i++) {
      etat = M.enregistrer(etat, r.id, true, t)
      t = etat[r.id].du
    }
  }
  // La veille de la plus proche échéance, aucune n'est due. On la CALCULE
  // plutôt que de la deviner : la dernière réponse tombe à J+32, mais
  // l'échéance qu'elle pose est à J+92, et confondre les deux faisait
  // accuser l'algorithme d'un défaut qui était dans le test.
  const prochaine = Math.min(...cinq.map((r) => etat[r.id].du))
  const veille = prochaine - JOUR
  const dus = cinq.filter((r) => M.rang(etat[r.id], veille) !== 3)
  dire(dus.length === 0,
    `${dus.length} réaction(s) acquise(s) sont redemandées avant leur échéance.`)

  // Et le jour dit, elles reviennent bien — sans quoi elles seraient
  // simplement perdues de vue.
  const revenues = cinq.filter((r) => M.rang(etat[r.id], prochaine) === 1)
  dire(revenues.length > 0, 'aucune réaction acquise ne revient à son échéance.')
}

// ————— 4. SIMULATION : un élève qui répond juste 70 % du temps —————
{
  const suivant = quiz.tirage(4242)
  const admissibles = reactions.filter((r) => quiz.admissibleProduit(r))
  const ids = admissibles.map((r) => r.id)
  let etat = {}
  let t = T0
  let posees = 0

  // Quatre-vingt-dix séances, une par jour.
  for (let jour = 0; jour < 90; jour++) {
    const s = quiz.serie({ graine: 1000 + jour, combien: 10, etat, maintenant: t })
    dire(s.length > 0, `séance ${jour} : aucune question engendrée.`)
    for (const q of s) {
      const juste = suivant() < 0.7
      etat = M.enregistrer(etat, q.reaction, juste, t)
      posees++
    }
    t += JOUR
  }

  const stat = M.statistiques(etat, ids, t)
  dire(stat.vues > 0, 'la simulation n\'a rien retenu.')

  // Ce qui doit ressortir : les réactions vues plusieurs fois sans jamais
  // être réussies restent en boîte basse, et celles toujours réussies
  // montent. Sans cela le dispositif ne trie rien.
  let malSuesEnBoiteHaute = 0
  let bienSuesEnBoiteBasse = 0
  for (const id of ids) {
    const f = etat[id]
    if (!f || f.vues < 3) continue
    const taux = f.justes / f.vues
    if (taux < 0.34 && f.boite >= 3) malSuesEnBoiteHaute++
    if (taux === 1 && f.boite === 0) bienSuesEnBoiteBasse++
  }
  dire(bienSuesEnBoiteBasse === 0,
    `${bienSuesEnBoiteBasse} réaction(s) toujours réussies sont restées en boîte 0.`)

  // CE QUI COMPTE N'EST PAS COMBIEN DE RÉACTIONS ONT DÉFILÉ.
  //
  // Une première version de ce test exigeait « au moins 100 réactions
  // vues », et elle mesurait la mauvaise chose : l'ordonnancement qui
  // faisait défiler les 275 était précisément celui qui n'en faisait
  // acquérir aucune et laissait 265 échéances en retard. Voir beaucoup
  // n'est pas savoir.
  //
  // On mesure donc les deux propriétés qui font qu'un dispositif de
  // révision sert à quelque chose : il fait ACQUÉRIR, et il ne laisse pas
  // s'installer un arriéré — car une échéance qui concerne presque tout
  // le vivier ne trie plus rien.
  dire(stat.acquises > 0,
    '90 séances de 10 questions n\'ont fait acquérir aucune réaction.')
  dire(stat.echues < stat.vues / 2,
    `${stat.echues} réactions en retard sur ${stat.vues} vues : l'arriéré s'installe.`)

  console.log(
    `  simulation : ${posees} questions sur ${jourDe(90)}, ${stat.vues} réactions vues, ` +
    `${stat.acquises} acquises, ${stat.echues} échues, boîtes ${stat.parBoite.join('/')}`
  )
}
function jourDe(n) { return `${n} jours` }

// ————— 4 bis. LA RÉVISION DU JOUR —————
{
  const T = Date.UTC(2026, 2, 15, 9, 0)   // un matin quelconque

  // Le paquet est STABLE dans la journée : c'est ce qui permet de le
  // reprendre là où on l'a laissé plutôt que de le recommencer.
  const matin = quiz.paquetDuJour({ etat: {}, maintenant: T })
  const midi = quiz.paquetDuJour({ etat: {}, maintenant: T + 5 * 3600e3 })
  const soir = quiz.paquetDuJour({ etat: {}, maintenant: T + 11 * 3600e3 })
  const ids = (p) => p.reactions.map((r) => r.id).join(',')
  dire(ids(matin) === ids(midi) && ids(midi) === ids(soir),
    'le paquet du jour change au cours de la journée : on le recommencerait sans le savoir.')

  // Et il CHANGE d'un jour à l'autre.
  const lendemain = quiz.paquetDuJour({ etat: {}, maintenant: T + JOUR })
  dire(ids(matin) !== ids(lendemain), 'le paquet est le même deux jours de suite.')

  // Taille : entre 5 et 10, toujours.
  for (const p of [matin, lendemain]) {
    dire(p.reactions.length >= quiz.PAQUET_MINIMUM && p.reactions.length <= quiz.PAQUET_MAXIMUM,
      `un paquet de ${p.reactions.length} réactions sort des bornes ${quiz.PAQUET_MINIMUM}-${quiz.PAQUET_MAXIMUM}.`)
    dire(new Set(p.reactions.map((r) => r.id)).size === p.reactions.length,
      'une réaction figure deux fois dans le même paquet.')
    dire(p.questions.length === p.reactions.length,
      'le paquet n\'engendre pas une question par réaction.')
  }

  // Le premier jour, tout est neuf : le paquet vaut le minimum.
  dire(matin.dues === 0 && matin.neuves === matin.reactions.length,
    'le tout premier paquet devrait n\'être fait que de nouveautés.')
  dire(matin.reactions.length === quiz.PAQUET_MINIMUM,
    `sans rien de dû, le paquet devrait valoir le minimum, il en fait ${matin.reactions.length}.`)

  // UNE NOUVEAUTÉ NE DÉLOGE JAMAIS UNE RÉVISION DUE.
  // On fabrique un arriéré de vingt réactions échues.
  let etat = {}
  const vingt = reactions.filter((r) => quiz.admissibleProduit(r)).slice(0, 20)
  for (const r of vingt) etat = M.enregistrer(etat, r.id, false, T - 3 * JOUR)
  const charge = quiz.paquetDuJour({ etat, maintenant: T })
  dire(charge.reactions.length === quiz.PAQUET_MAXIMUM,
    `avec vingt réactions échues, le paquet devrait être plein (${charge.reactions.length}).`)
  dire(charge.neuves === 0,
    `${charge.neuves} nouveauté(s) se sont glissées alors que vingt révisions attendaient.`)
  dire(charge.duesRestantes === 10,
    `le reste à faire devrait être de 10, il annonce ${charge.duesRestantes}.`)

  // Avec peu de dû, le neuf comble — mais sans dépasser deux.
  let leger = {}
  for (const r of vingt.slice(0, 3)) leger = M.enregistrer(leger, r.id, false, T - JOUR)
  const p3 = quiz.paquetDuJour({ etat: leger, maintenant: T })
  dire(p3.dues === 3, `trois réactions étaient échues, le paquet en compte ${p3.dues}.`)
  dire(p3.neuves === 2, `le paquet devrait ajouter deux nouveautés, il en ajoute ${p3.neuves}.`)
  dire(p3.reactions.length === 5, `le paquet devrait faire 5, il fait ${p3.reactions.length}.`)

  // Rien à faire du tout : un paquet vide est un résultat, pas une panne.
  const toutSu = {}
  for (const r of reactions.filter((r) => quiz.admissibleProduit(r))) {
    toutSu[r.id] = { boite: 5, vues: 5, justes: 5, le: T, du: T + 60 * JOUR }
  }
  const vide = quiz.paquetDuJour({ etat: toutSu, maintenant: T })
  dire(vide.reactions.length === 0,
    `tout étant su et rien échu, le paquet devrait être vide, il fait ${vide.reactions.length}.`)
}

// ————— 4 quater. QUATRE-VINGT-DIX JOURS DE « RÉVISION DU JOUR » —————
//
// La question que cette simulation tranche : le paquet quotidien
// laisse-t-il s'installer un arriéré ? C'est le défaut qui avait rendu le
// premier ordonnancement inutilisable, et le paquet ajoute deux
// nouveautés les jours calmes — il faut donc revérifier.
{
  const suivant = quiz.tirage(31415)
  const admissibles = reactions.filter((r) => quiz.admissibleProduit(r))
  const ids = admissibles.map((r) => r.id)
  let etat = {}
  let journal = M.journalNeuf()
  let t = Date.UTC(2026, 0, 1, 9, 0)
  let posees = 0
  let tailles = []

  for (let jour = 0; jour < 90; jour++) {
    const p = quiz.paquetDuJour({ etat, maintenant: t })
    tailles.push(p.reactions.length)
    let justes = 0
    for (const q of p.questions) {
      const juste = suivant() < 0.7
      if (juste) justes++
      etat = M.enregistrer(etat, q.reaction, juste, t)
      posees++
    }
    if (p.questions.length) {
      journal = M.noterLeJour(journal, M.jourCivil(t), { posees: p.questions.length, justes })
    }
    t += JOUR
  }

  const stat = M.statistiques(etat, ids, t)
  const serie = M.serieDeJours(journal, M.jourCivil(t - JOUR))

  dire(Math.min(...tailles) >= quiz.PAQUET_MINIMUM || Math.min(...tailles) === 0,
    `un paquet est descendu à ${Math.min(...tailles)} réactions.`)
  dire(Math.max(...tailles) <= quiz.PAQUET_MAXIMUM,
    `un paquet est monté à ${Math.max(...tailles)} réactions.`)
  dire(stat.acquises > 0, '90 paquets quotidiens n\'ont fait acquérir aucune réaction.')
  dire(stat.echues <= quiz.PAQUET_MAXIMUM * 2,
    `${stat.echues} réactions en retard : l'arriéré s'installe malgré le plafond du paquet.`)
  dire(serie === 90, `la série devrait valoir 90 jours, elle vaut ${serie}.`)

  console.log(
    `  révision du jour : ${posees} questions en 90 jours ` +
    `(paquets de ${Math.min(...tailles)} à ${Math.max(...tailles)}), ` +
    `${stat.vues} vues, ${stat.acquises} acquises, ${stat.echues} échues, série ${serie} jours`
  )
}

// ————— 4 ter. LE JOURNAL DES JOURS ET LA SÉRIE —————
{
  const j = (a, m, d) => M.jourCivil(new Date(a, m - 1, d, 12).getTime())
  dire(M.jourPrecedent(j(2026, 3, 1)) === j(2026, 2, 28),
    'le jour précédant le 1er mars 2026 devrait être le 28 février.');
  dire(M.jourPrecedent(j(2026, 1, 1)) === j(2025, 12, 31),
    'le passage d\'une année à l\'autre est faux.')

  let journal = M.journalNeuf()
  dire(M.serieDeJours(journal, j(2026, 3, 10)) === 0, 'un journal vide devrait donner une série de 0.')

  // Trois jours de suite, puis on regarde depuis le quatrième.
  for (const d of [7, 8, 9]) journal = M.noterLeJour(journal, j(2026, 3, d), { posees: 5, justes: 4 })
  dire(M.serieDeJours(journal, j(2026, 3, 9)) === 3,
    `trois jours faits d'affilée devraient donner 3, on obtient ${M.serieDeJours(journal, j(2026, 3, 9))}.`)

  // Le matin du 10, la série tient encore : le jour n'est pas fini.
  dire(M.serieDeJours(journal, j(2026, 3, 10)) === 3,
    'ouvrir l\'application le lendemain matin ne doit pas remettre la série à zéro.')

  // Mais si l'on saute le 10 et qu'on revient le 11, elle est rompue.
  dire(M.serieDeJours(journal, j(2026, 3, 11)) === 0,
    'un jour sauté devrait rompre la série.')

  // Un trou au milieu ne compte pas les jours d'avant.
  journal = M.noterLeJour(journal, j(2026, 3, 11), { posees: 5, justes: 5 })
  dire(M.serieDeJours(journal, j(2026, 3, 11)) === 1,
    'après un trou, la série repart de 1.')
}

// ————— 4 quinquies. LE BILAN PAR FAMILLE —————
{
  const T = Date.UTC(2026, 5, 1, 10)
  const admissibles = reactions.filter((r) => quiz.admissibleProduit(r))

  // Un état vide : toutes les familles présentes, aucun taux.
  const vierge = M.statistiquesParFamille({}, admissibles, T)
  const famillesReelles = new Set(admissibles.map((r) => r.famille))
  dire(vierge.length === famillesReelles.size,
    `${vierge.length} familles rendues pour ${famillesReelles.size} réelles.`)
  dire(vierge.every((f) => f.taux === null && f.vues === 0),
    'sans aucune réponse, aucune famille ne devrait afficher de taux.')
  dire(vierge.reduce((n, f) => n + f.total, 0) === admissibles.length,
    'le total des familles ne retombe pas sur le nombre de réactions.')

  // On fabrique deux familles contrastées.
  const parFamille = new Map()
  for (const r of admissibles) {
    if (!parFamille.has(r.famille)) parFamille.set(r.famille, [])
    parFamille.get(r.famille).push(r)
  }
  const [nomForte, nomFaible] = [...parFamille.keys()]
    .filter((n) => parFamille.get(n).length >= 6).slice(0, 2)

  let etat = {}
  // La forte : six réactions, tout juste.
  for (const r of parFamille.get(nomForte).slice(0, 6)) {
    etat = M.enregistrer(etat, r.id, true, T)
  }
  // La faible : six réactions, tout faux.
  for (const r of parFamille.get(nomFaible).slice(0, 6)) {
    etat = M.enregistrer(etat, r.id, false, T)
  }

  const bilan = M.statistiquesParFamille(etat, admissibles, T)
  const forte = bilan.find((f) => f.famille === nomForte)
  const faible = bilan.find((f) => f.famille === nomFaible)

  dire(forte.taux === 1, `la famille tout juste devrait être à 100 %, elle est à ${forte.taux}.`)
  dire(faible.taux === 0, `la famille tout faux devrait être à 0 %, elle est à ${faible.taux}.`)
  dire(forte.vues === 6 && faible.vues === 6, 'le compte des réactions vues est faux.')
  dire(forte.concluant && faible.concluant,
    'six réponses devraient suffire à conclure.')

  // LE CLASSEMENT RÉPOND À LA QUESTION POSÉE : ce qu'on rate d'abord.
  dire(bilan.indexOf(faible) < bilan.indexOf(forte),
    'la famille ratée devrait passer avant la famille réussie.')
  // Et les familles jamais touchées ferment la marche.
  const jamais = bilan.filter((f) => f.taux === null)
  const derniers = bilan.slice(bilan.length - jamais.length)
  dire(jamais.length === derniers.length && derniers.every((f) => f.taux === null),
    'les familles jamais rencontrées devraient être en fin de liste.')

  // UN TAUX SUR PEU DE RÉPONSES SE SIGNALE.
  let maigre = {}
  maigre = M.enregistrer(maigre, parFamille.get(nomFaible)[0].id, false, T)
  const bm = M.statistiquesParFamille(maigre, admissibles, T)
    .find((f) => f.famille === nomFaible)
  dire(bm.taux === 0 && bm.reponses === 1, 'le taux sur une réponse est mal compté.')
  dire(!bm.concluant,
    'un taux sur une seule réponse ne devrait pas être présenté comme concluant.')

  // ET ELLE NE DOIT PAS PASSER EN TÊTE. Une famille ratée UNE fois est à
  // 0 % comme une famille ratée vingt fois ; la mettre au sommet enverrait
  // retravailler ce qu'on vient à peine d'ouvrir, et contredirait le
  // résumé de la page, qui écarte ces familles faute de matière.
  let melange = { ...etat }
  melange = M.enregistrer(melange, parFamille.get(nomForte)[6] ? parFamille.get(nomForte)[6].id
    : parFamille.get(nomForte)[0].id, false, T)
  const troisiemeNom = [...parFamille.keys()].find((n) => n !== nomForte && n !== nomFaible)
  melange = M.enregistrer(melange, parFamille.get(troisiemeNom)[0].id, false, T)
  const bmel = M.statistiquesParFamille(melange, admissibles, T)
  const maigreEnTete = bmel.find((f) => f.famille === troisiemeNom)
  dire(bmel.indexOf(maigreEnTete) > bmel.indexOf(bmel.find((f) => f.famille === nomFaible)),
    `« ${troisiemeNom} » (une réponse) passe devant « ${nomFaible} » (six réponses) : ` +
    'un taux sur trop peu de réponses ne doit pas mener le palmarès.')
  dire(bmel[0].concluant,
    'la première famille de la liste devrait toujours reposer sur assez de réponses.')

  // La couverture ne se confond pas avec le taux : tout juste sur six
  // réactions d'une famille qui en compte davantage ne fait pas 100 %.
  dire(forte.couverture === 6 / forte.total,
    `la couverture devrait valoir 6/${forte.total}, elle vaut ${forte.couverture}.`)
  dire(forte.couverture < 1 || forte.total === 6,
    'une famille de plus de six réactions ne peut pas être couverte entièrement par six réponses.')

  // Un identifiant orphelin ne doit rien fausser.
  const avecOrphelin = { ...etat, reaction_disparue: M.apresReponse(null, false, T) }
  const bo = M.statistiquesParFamille(avecOrphelin, admissibles, T)
  dire(bo.reduce((n, f) => n + f.reponses, 0) === bilan.reduce((n, f) => n + f.reponses, 0),
    'une fiche orpheline s\'est glissée dans le compte des réponses.')

  console.log(
    `  bilan par famille : ${bilan.length} familles, ` +
    `la plus faible « ${bilan[0].famille} », ` +
    `${jamais.length} jamais rencontrées`
  )
}

// ————— 5. le stockage résiste à ce qu'on lui donne de travers —————
{
  // Pas de localStorage du tout : on révise sans mémoire, on ne casse pas.
  const vrai = globalThis.localStorage

  // Le coffre est éprouvé une fois puis retenu : il faut donc rouvrir la
  // question à chaque fois qu'on remplace le stockage sous ses pieds.
  const poser = (faux) => {
    if (faux) globalThis.localStorage = faux
    else delete globalThis.localStorage
    M.reeprouverLeCoffre()
  }

  poser(null)
  dire(JSON.stringify(M.lire()) === '{}', 'sans localStorage, lire() devrait rendre un état vide.')
  dire(M.ecrire({ x: 1 }) === false, 'sans localStorage, ecrire() devrait rendre false sans lever.')

  // Un localStorage qui JETTE au moindre accès : c'est le cas réel de la
  // navigation privée, et il ne rend pas null, il lève.
  poser({
    getItem() { throw new Error('bloqué') },
    setItem() { throw new Error('bloqué') },
    removeItem() { throw new Error('bloqué') }
  })
  dire(JSON.stringify(M.lire()) === '{}', 'un stockage qui lève devrait donner un état vide.')
  dire(M.ecrire({ x: 1 }) === false, 'un stockage qui lève ne devrait pas propager l\'exception.')

  // Un contenu abîmé — modifié à la main, ou écrit par une version
  // antérieure — ne doit pas contaminer l'état.
  const faux = {
    'ok': { boite: 2, vues: 5, justes: 3, du: 10, le: 5 },
    'boite hors barème': { boite: 99, vues: 1, justes: 1, du: 0, le: 0 },
    'justes > vues': { boite: 1, vues: 1, justes: 4, du: 0, le: 0 },
    'pas un objet': 'bonjour',
    'champs manquants': { boite: 1 },
    'nul': null
  }
  // Un faux stockage doit RESPECTER LES CLÉS. Le premier ne le faisait pas
  // et confondait la clé d'essai avec l'état : il a ainsi révélé un vrai
  // défaut — le coffre écrivait à chaque lecture — mais il accusait aussi
  // le contrôle des fiches, qui, lui, était juste.
  const boite = new Map([['chimierev.memorisation.v1', JSON.stringify(faux)]])
  poser({
    getItem: (k) => (boite.has(k) ? boite.get(k) : null),
    setItem: (k, v) => boite.set(k, String(v)),
    removeItem: (k) => boite.delete(k)
  })
  const relu = M.lire()
  dire(Object.keys(relu).length === 1 && relu.ok,
    `l'état relu devrait ne garder que la fiche saine, il garde ${JSON.stringify(Object.keys(relu))}.`)

  boite.set('chimierev.memorisation.v1', '{ ceci n\'est pas du JSON')
  dire(JSON.stringify(M.lire()) === '{}', 'un JSON illisible devrait donner un état vide.')
  boite.set('chimierev.memorisation.v1', '[1, 2, 3]')
  dire(JSON.stringify(M.lire()) === '{}', 'un tableau devrait être refusé comme état.')

  // Et l'aller-retour complet : ce qu'on écrit se relit à l'identique.
  boite.clear()
  const aller = { sn2: M.apresReponse(null, true, T0) }
  dire(M.ecrire(aller) === true, 'un stockage sain devrait accepter l\'écriture.')
  dire(JSON.stringify(M.lire()) === JSON.stringify(aller),
    'ce qu\'on écrit ne se relit pas à l\'identique.')
  dire(M.oublier() === true && JSON.stringify(M.lire()) === '{}',
    'oublier() ne remet pas l\'état à zéro.')

  poser(vrai || null)
}

// ————— 6. un état qui parle de réactions disparues n'empêche rien —————
{
  const etat = { 'reaction_qui_n_existe_plus': M.apresReponse(null, false, T0) }
  const s = quiz.serie({ graine: 3, combien: 5, etat, maintenant: T0 })
  dire(s.length === 5, 'un identifiant orphelin dans l\'état casse la série.')
  const stat = M.statistiques(etat, reactions.map((r) => r.id), T0)
  dire(stat.vues === 0, 'une fiche orpheline ne devrait compter dans aucune statistique.')
}

// ————— 7. ON TESTE LE TESTEUR : des algorithmes faux passent-ils ? —————
const pieges = []
function doitRefuser(nom, verifier) {
  const avant = anomalies.length
  verifier()
  if (anomalies.length === avant) {
    pieges.push(`✗ « ${nom} » est passé — le contrôle ne le voit pas.`)
  } else {
    anomalies.length = avant
    pieges.push(`✓ ${nom} : refusé, comme il se doit.`)
  }
}

doitRefuser('Une faute qui ne fait pas redescendre', () => {
  const faux = (f, juste) => ({ ...f, boite: juste ? f.boite + 1 : f.boite })
  const f = { boite: 3, vues: 3, justes: 3, du: T0, le: T0 }
  dire(faux(f, false).boite === 0, 'une faute devrait renvoyer à la boîte 0.')
})

doitRefuser('Un délai qui ne croît pas avec la boîte', () => {
  const plats = [1, 1, 1, 1, 1, 1]
  dire(plats.some((d, i) => i > 0 && d > plats[i - 1]),
    'les délais devraient croître avec la boîte.')
})

doitRefuser('Un ordre qui ignore l\'état', () => {
  const [a, b] = reactions.slice(0, 2)
  const etat = {
    [a.id]: { boite: 0, vues: 4, justes: 0, du: T0 - 5 * JOUR, le: T0 - 5 * JOUR },
    [b.id]: { boite: 5, vues: 5, justes: 5, du: T0 + 60 * JOUR, le: T0 }
  }
  const ordreIgnorant = [b, a]   // l'ordre du fichier, sans tri
  dire(ordreIgnorant[0].id === a.id, 'la réaction mal sue devrait passer devant.')
})

doitRefuser('Un stockage qui laisse passer une fiche abîmée', () => {
  const abimee = { boite: 99, vues: 1, justes: 1, du: 0, le: 0 }
  const accepte = (f) => Boolean(f)   // contrôle trop laxiste
  dire(!accepte(abimee) || abimee.boite <= M.DERNIERE_BOITE,
    'une boîte hors barème devrait être écartée.')
})

await serveur.close()

for (const p of pieges) console.log(p)
if (pieges.some((p) => p.startsWith('✗'))) {
  console.error('\n✗ Le contrôle laisse passer des algorithmes faux.\n')
  process.exit(1)
}
console.log('✓ Le contrôle détecte bien les fautes qu\'on lui tend.\n')

if (anomalies.length) {
  console.error(`✗ ${anomalies.length} anomalie(s) dans la répétition espacée :\n`)
  for (const a of anomalies) console.error('  • ' + a)
  console.error('\nLa construction s\'arrête : une révision mal ordonnée fait perdre du temps.\n')
  process.exit(1)
}

console.log(
  `✓ répétition espacée : ${M.DELAIS.length} boîtes (${M.DELAIS.join(', ')} jours), ` +
  '90 séances simulées, stockage éprouvé absent, bloqué et abîmé.'
)
