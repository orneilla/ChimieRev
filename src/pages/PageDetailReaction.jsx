// Page détail d'une réaction : tout le contenu de la fiche, en texte.
// (Les structures 2D arriveront en Phase 2, la 3D en Phase 3,
//  et le bascule Référence / Comprendre en Phase 5.)
import { useParams, Link } from 'react-router-dom'
import reactions from '../data/reactions.json'
import BlocTexte from '../components/BlocTexte.jsx'
import NiveauDifficulte from '../components/NiveauDifficulte.jsx'

export default function PageDetailReaction() {
  // useParams lit le ":id" de l'adresse, par exemple "sn2".
  const { id } = useParams()
  const reaction = reactions.find((r) => r.id === id)

  // Sécurité : adresse inconnue ou données manquantes.
  if (!reaction) {
    return (
      <section className="fiche">
        <p className="message-vide">Cette réaction n'existe pas (encore).</p>
        <Link to="/" className="lien-retour">← Retour à la liste</Link>
      </section>
    )
  }

  return (
    <article className="fiche">
      <Link to="/" className="lien-retour">← Toutes les réactions</Link>

      <header className="fiche-entete">
        <span className="etiquette-famille">{reaction.famille}</span>
        <h1>{reaction.nom}</h1>
        <NiveauDifficulte niveau={reaction.niveau_difficulte} />
      </header>

      {/* Équation en texte : sera remplacée par les dessins en Phase 2. */}
      <section className="bloc equation">
        <h3>Équation</h3>
        <div className="equation-ligne">
          <code className="molecule">{reaction.substrat_SMILES}</code>
          <div className="fleche-bloc">
            <span className="fleche-conditions">{reaction.reactifs.join(', ')}</span>
            <span className="fleche-trait">⟶</span>
            <span className="fleche-conditions">{reaction.solvant}</span>
          </div>
          <code className="molecule">{reaction.produit_SMILES}</code>
        </div>
        <p className="note">
          Formules affichées en notation SMILES — les structures dessinées
          arrivent à la phase suivante.
        </p>
      </section>

      <section className="bloc">
        <h3>Mécanisme, étape par étape</h3>
        <ol className="liste-etapes">
          {reaction.mecanisme_etapes.map((etape, index) => (
            <li key={index}>{etape}</li>
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

      <section className="bloc bloc-explication">
        <h3>Explication — Référence</h3>
        <p className="note">Formulation technique, pour réviser vite.</p>
        <BlocTexte texte={reaction.explication_reference} />
      </section>

      <section className="bloc bloc-explication bloc-comprendre">
        <h3>Explication — Comprendre</h3>
        <p className="note">Le même contenu, repris depuis zéro, sans prérequis.</p>
        <BlocTexte texte={reaction.explication_comprendre} />
      </section>

      <Link to="/" className="lien-retour bas">← Toutes les réactions</Link>
    </article>
  )
}
