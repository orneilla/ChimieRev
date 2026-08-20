// Le « magasin » : tous les réactifs et tous les solvants au même endroit.
//
// C'est un INDEX, pas un empilement de fiches : une recherche, puis des
// vignettes. Le détail de chacun vit sur sa propre page — sans quoi, à
// cinquante réactifs, la page ferait quinze écrans de haut et on ne
// retrouverait plus rien.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import reactifs from '../data/reactifs.json'
import solvants from '../data/solvants.json'
import { reactionsUtilisantReactif, reactionsUtilisantSolvant } from '../liens.js'

/** Compare sans se soucier des accents ni des majuscules. */
const normalise = (texte) =>
  (texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function Vignette({ entree, vers, sousTitre, nombre }) {
  return (
    <Link to={vers} className="vignette-outil">
      <span className="vignette-nom">{entree.nom}</span>
      <span className="vignette-complet">{entree.nom_complet}</span>
      <span className="vignette-role">{sousTitre}</span>
      {nombre > 0 && (
        <span className="vignette-compte">
          {nombre} réaction{nombre > 1 ? 's' : ''}
        </span>
      )}
    </Link>
  )
}

export default function PageReactifs() {
  const [onglet, setOnglet] = useState('reactifs')
  const [recherche, setRecherche] = useState('')

  const liste = onglet === 'reactifs' ? reactifs : solvants

  const affichees = useMemo(() => {
    const terme = normalise(recherche.trim())
    if (!terme) return liste

    // On cherche dans tout ce qui identifie le produit : son nom court,
    // son nom complet, son rôle, sa formule. Taper « base », « oxydant »
    // ou « THF » doit fonctionner.
    return liste.filter((e) =>
      [e.nom, e.nom_complet, e.role, e.type, e.usage, e.SMILES]
        .filter(Boolean)
        .some((champ) => normalise(champ).includes(terme))
    )
  }, [liste, recherche])

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">Le magasin</p>
        <h1>Réactifs &amp; solvants</h1>
        <p className="accroche">
          Ce qu'on ajoute dans le ballon, et ce dans quoi tout se passe.
          Chaque fiche dit à quoi il sert, pourquoi il marche, et renvoie
          aux réactions où on le rencontre.
        </p>
      </div>

      <div className="bascule" role="group" aria-label="Choisir la catégorie">
        <button
          type="button"
          className={onglet === 'reactifs' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'reactifs'}
          onClick={() => { setOnglet('reactifs'); setRecherche('') }}
          style={{ '--couleur': '#F59120' }}
        >
          <span className="bascule-libelle">Réactifs</span>
          <span className="bascule-aide">{reactifs.length} fiches</span>
        </button>
        <button
          type="button"
          className={onglet === 'solvants' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'solvants'}
          onClick={() => { setOnglet('solvants'); setRecherche('') }}
          style={{ '--couleur': '#00A3D9' }}
        >
          <span className="bascule-libelle">Solvants</span>
          <span className="bascule-aide">{solvants.length} fiches</span>
        </button>
      </div>

      <label className="champ-recherche">
        <span className="lecture-seule-ecran">Rechercher</span>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={onglet === 'reactifs'
            ? 'Rechercher (nom, rôle : base, oxydant…)'
            : 'Rechercher (nom, type : aprotique…)'}
        />
      </label>

      {affichees.length === 0 ? (
        <p className="message-vide">Rien ne correspond à cette recherche.</p>
      ) : (
        <div className="grille-outils">
          {affichees.map((entree) => (
            <Vignette
              key={entree.id}
              entree={entree}
              vers={`/${onglet === 'reactifs' ? 'reactif' : 'solvant'}/${entree.id}`}
              sousTitre={onglet === 'reactifs' ? entree.role : entree.type}
              nombre={(onglet === 'reactifs'
                ? reactionsUtilisantReactif(entree)
                : reactionsUtilisantSolvant(entree)).length}
            />
          ))}
        </div>
      )}
    </section>
  )
}
