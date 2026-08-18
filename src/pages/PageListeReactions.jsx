// Page d'accueil : la liste de toutes les réactions,
// avec une recherche par texte et un filtre par famille.
import { useState, useMemo } from 'react'
import reactions from '../data/reactions.json'
import CarteReaction from '../components/CarteReaction.jsx'

export default function PageListeReactions() {
  // useState = une valeur qui peut changer et qui, quand elle change,
  // redessine automatiquement la page.
  const [recherche, setRecherche] = useState('')
  const [familleChoisie, setFamilleChoisie] = useState('Toutes')

  // Liste des familles présentes dans les données (sans doublon).
  // useMemo évite de refaire ce calcul à chaque frappe au clavier.
  const familles = useMemo(() => {
    const trouvees = reactions.map((r) => r.famille)
    return ['Toutes', ...Array.from(new Set(trouvees))]
  }, [])

  // Réactions réellement affichées = celles qui passent les deux filtres.
  const reactionsAffichees = useMemo(() => {
    const texte = recherche.trim().toLowerCase()

    return reactions.filter((r) => {
      const bonneFamille =
        familleChoisie === 'Toutes' || r.famille === familleChoisie

      const correspondAuTexte =
        texte === '' ||
        r.nom.toLowerCase().includes(texte) ||
        r.famille.toLowerCase().includes(texte) ||
        r.reactifs.join(' ').toLowerCase().includes(texte)

      return bonneFamille && correspondAuTexte
    })
  }, [recherche, familleChoisie])

  return (
    <section>
      <div className="intro">
        <h1>Réactions</h1>
        <p className="accroche">
          Comprendre le <em>pourquoi</em> avant le <em>comment</em> :
          quand la raison est claire, la réaction devient évidente.
        </p>
      </div>

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
          {familles.map((famille) => (
            <button
              key={famille}
              type="button"
              className={famille === familleChoisie ? 'pastille active' : 'pastille'}
              onClick={() => setFamilleChoisie(famille)}
            >
              {famille}
            </button>
          ))}
        </div>
      </div>

      <p className="compteur">
        {reactionsAffichees.length} réaction
        {reactionsAffichees.length > 1 ? 's' : ''} affichée
        {reactionsAffichees.length > 1 ? 's' : ''}
      </p>

      {reactionsAffichees.length === 0 ? (
        <p className="message-vide">Aucune réaction ne correspond à cette recherche.</p>
      ) : (
        <div className="grille">
          {reactionsAffichees.map((reaction) => (
            <CarteReaction key={reaction.id} reaction={reaction} />
          ))}
        </div>
      )}
    </section>
  )
}
