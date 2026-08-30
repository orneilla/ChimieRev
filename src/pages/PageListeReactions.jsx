// Page d'accueil : le « tableau » des réactions.
import { useState, useMemo } from 'react'
import reactions from '../data/reactions.json'
import programme from '../data/programme.json'
import CarteReaction from '../components/CarteReaction.jsx'
import AppelRevision from '../components/AppelRevision.jsx'
import { couleurFamille } from '../couleurs.js'
import { ordreEntrelace } from '../ordre.js'

// L'ordre du programme, et non celui du fichier de données : les familles
// se présentent toujours dans le même ordre, celui où on les rencontre en
// cours. Une liste qui se réorganise à chaque ajout ne s'apprend pas.
const ORDRE_FAMILLES = programme.familles.map((f) => f.famille)

// Le tableau, une fois pour toutes : les familles entrelacées plutôt
// qu'empilées (voir src/ordre.js). Le numéro d'une réaction est sa place
// dans CET ordre — comme un numéro atomique, il ne bouge pas quand on
// filtre, et il monte régulièrement quand on parcourt la grille.
const TABLEAU = ordreEntrelace(reactions)
const NUMEROS = new Map(TABLEAU.map((r, i) => [r.id, i + 1]))

export default function PageListeReactions() {
  const [recherche, setRecherche] = useState('')
  const [familleChoisie, setFamilleChoisie] = useState('Toutes')

  // Seules les familles qui ont au moins une fiche écrite apparaissent :
  // un filtre qui ne renverrait rien n'a rien à faire là. Elles arrivent
  // au fur et à mesure que les fiches sont rédigées.
  const familles = useMemo(() => {
    const comptes = new Map()
    for (const r of reactions) comptes.set(r.famille, (comptes.get(r.famille) || 0) + 1)

    const presentes = [...comptes.keys()].sort((a, b) => {
      const ia = ORDRE_FAMILLES.indexOf(a)
      const ib = ORDRE_FAMILLES.indexOf(b)
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
    })

    return [
      { nom: 'Toutes', compte: reactions.length },
      ...presentes.map((nom) => ({ nom, compte: comptes.get(nom) }))
    ]
  }, [])

  const reactionsAffichees = useMemo(() => {
    const texte = recherche.trim().toLowerCase()

    return TABLEAU.filter((r) => {
      const bonneFamille =
        familleChoisie === 'Toutes' || r.famille === familleChoisie

      const correspondAuTexte =
        texte === '' ||
        r.nom.toLowerCase().includes(texte) ||
        r.famille.toLowerCase().includes(texte) ||
        (r.symbole || '').toLowerCase().includes(texte) ||
        r.reactifs.join(' ').toLowerCase().includes(texte)

      return bonneFamille && correspondAuTexte
    })
  }, [recherche, familleChoisie])

  return (
    <section className="page-liste">
      <div className="intro">
        <p className="sur-titre">Chimie organique</p>
        <h1>Réactions</h1>
        <p className="accroche">
          Comprendre le <em>pourquoi</em> avant le <em>comment</em>.
          Quand la raison est claire, la réaction devient évidente.
        </p>
      </div>

      {/* L'habitude quotidienne se déclenche ici, avant le tableau : une
          séance courte proposée à l'ouverture se fait, la même séance
          cachée derrière un onglet ne se fait pas. */}
      <AppelRevision />

      <div className="filtres">
        <label className="champ-recherche">
          <span className="lecture-seule-ecran">Rechercher une réaction</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher (nom, famille, réactif…)"
          />
        </label>

        <div className="pastilles" role="group" aria-label="Filtrer par famille">
          {familles.map(({ nom, compte }) => (
            <button
              key={nom}
              type="button"
              className={nom === familleChoisie ? 'pastille active' : 'pastille'}
              aria-pressed={nom === familleChoisie}
              // Chaque famille porte sa couleur jusque dans le filtre.
              style={{ '--couleur': nom === 'Toutes' ? '#16130F' : couleurFamille(nom) }}
              onClick={() => setFamilleChoisie(nom)}
            >
              {nom}
              {/* Le compte évite de se demander pourquoi telle famille
                  n'est pas là : elle n'a simplement pas encore de fiche. */}
              <span className="pastille-compte">{compte}</span>
            </button>
          ))}
        </div>
      </div>

      {reactionsAffichees.length === 0 ? (
        <p className="message-vide">Aucune réaction ne correspond à cette recherche.</p>
      ) : (
        <div className="grille">
          {reactionsAffichees.map((reaction) => (
            <CarteReaction
              key={reaction.id}
              reaction={reaction}
              numero={NUMEROS.get(reaction.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
