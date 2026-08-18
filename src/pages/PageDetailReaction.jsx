// Fiche complète d'une réaction.
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import reactions from '../data/reactions.json'
import BlocTexte from '../components/BlocTexte.jsx'
import BasculeMode from '../components/BasculeMode.jsx'
import ReferencesReaction from '../components/ReferencesReaction.jsx'
import { couleurFamille } from '../couleurs.js'

// Clé de stockage du mode de lecture choisi, retenu d'une fiche à l'autre.
const CLE_MODE = 'chimierev.mode'

export default function PageDetailReaction() {
  const { id } = useParams()
  const reaction = reactions.find((r) => r.id === id)

  // Mode de lecture : « comprendre » par défaut, c'est l'esprit du projet.
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(CLE_MODE) || 'comprendre'
    } catch {
      // Navigation privée sur certains téléphones : on continue sans mémoire.
      return 'comprendre'
    }
  })

  // Mémorise le choix pour les fiches suivantes.
  useEffect(() => {
    try {
      localStorage.setItem(CLE_MODE, mode)
    } catch {
      /* pas de stockage disponible : sans conséquence */
    }
  }, [mode])

  // On remonte en haut quand on ouvre une autre fiche.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!reaction) {
    return (
      <section>
        <p className="message-vide">Cette réaction n'existe pas (encore).</p>
        <Link to="/" className="lien-retour">← Retour à la liste</Link>
      </section>
    )
  }

  const couleur = couleurFamille(reaction.famille)

  return (
    <article className="fiche" style={{ '--couleur': couleur }}>
      <Link to="/" className="lien-retour">← Toutes les réactions</Link>

      {/* Bandeau coloré : la couleur de la famille, comme sur la tuile. */}
      <header className="bandeau">
        <p className="bandeau-famille">{reaction.famille}</p>
        <p className="bandeau-symbole">{reaction.symbole || reaction.id}</p>
        <h1 className="bandeau-titre">{reaction.nom}</h1>
        <p className="bandeau-difficulte">
          Difficulté <strong>{reaction.niveau_difficulte}</strong>
          <span className="sur-dix">/10</span>
        </p>
      </header>

      <section className="bloc equation">
        <h3>Équation</h3>
        <div className="equation-ligne">
          <code className="molecule">{reaction.substrat_SMILES}</code>
          <div className="fleche-bloc">
            <span className="fleche-conditions">{reaction.reactifs.join(', ')}</span>
            <span className="fleche-trait" aria-hidden="true">⟶</span>
            <span className="fleche-conditions">{reaction.solvant}</span>
          </div>
          <code className="molecule">{reaction.produit_SMILES}</code>
        </div>
        <p className="note">
          Formules en notation SMILES — les structures dessinées arrivent
          à la phase suivante.
        </p>
      </section>

      {/* Le cœur de la fiche : la même chose expliquée de deux façons. */}
      <section className="bloc bloc-explication">
        <BasculeMode mode={mode} onChange={setMode} />
        <div className="texte-explication">
          <BlocTexte
            texte={
              mode === 'comprendre'
                ? reaction.explication_comprendre
                : reaction.explication_reference
            }
          />
        </div>
      </section>

      <section className="bloc">
        <h3>Mécanisme, étape par étape</h3>
        <ol className="liste-etapes">
          {reaction.mecanisme_etapes.map((etape, index) => (
            <li key={index}>
              <span className="numero-etape" aria-hidden="true">{index + 1}</span>
              <span>{etape}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="bloc">
        <h3>Sélectivité</h3>
        <p>{reaction.selectivite}</p>
      </section>

      <section className="bloc bloc-pieges">
        <h3>Pièges classiques</h3>
        <ul className="liste-pieges">
          {reaction.pieges.map((piege, index) => (
            <li key={index}>{piege}</li>
          ))}
        </ul>
      </section>

      <ReferencesReaction id={reaction.id} famille={reaction.famille} />

      <Link to="/" className="lien-retour bas">← Toutes les réactions</Link>
    </article>
  )
}
