// Page d'accueil : le « tableau » des réactions.
import { useState, useMemo } from 'react'
import reactions from '../data/reactions.json'
import CarteReaction from '../components/CarteReaction.jsx'
import { couleurFamille } from '../couleurs.js'

export default function PageListeReactions() {
  const [recherche, setRecherche] = useState('')
  const [familleChoisie, setFamilleChoisie] = useState('Toutes')

  // Familles présentes dans les données, sans doublon.
  const familles = useMemo(
    () => ['Toutes', ...new Set(reactions.map((r) => r.famille))],
    []
  )

  const reactionsAffichees = useMemo(() => {
    const texte = recherche.trim().toLowerCase()

    return reactions.filter((r) => {
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
    <section>
      <div className="intro">
        <p className="sur-titre">Chimie organique</p>
        <h1>Réactions</h1>
        <p className="accroche">
          Comprendre le <em>pourquoi</em> avant le <em>comment</em>.
          Quand la raison est claire, la réaction devient évidente.
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
              // Chaque famille porte sa couleur jusque dans le filtre.
              style={{
                '--couleur': famille === 'Toutes' ? '#16130F' : couleurFamille(famille)
              }}
              onClick={() => setFamilleChoisie(famille)}
            >
              {famille}
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
              // Le numéro suit l'ordre du fichier de données, comme le
              // numéro atomique suit l'ordre du tableau périodique.
              numero={reactions.indexOf(reaction) + 1}
            />
          ))}
        </div>
      )}
    </section>
  )
}
