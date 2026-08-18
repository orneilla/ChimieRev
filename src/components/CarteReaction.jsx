// Une « carte » = un aperçu cliquable d'une réaction dans la liste.
import { Link } from 'react-router-dom'
import NiveauDifficulte from './NiveauDifficulte.jsx'

export default function CarteReaction({ reaction }) {
  return (
    <Link to={`/reaction/${reaction.id}`} className="carte">
      <span className="etiquette-famille">{reaction.famille}</span>

      <h2 className="carte-titre">{reaction.nom}</h2>

      {/*
        Aperçu de l'équation en texte brut (les SMILES).
        À la Phase 2, RDKit-JS remplacera ce texte par les vraies
        structures dessinées.
      */}
      <p className="carte-equation">
        <code>{reaction.substrat_SMILES}</code>
        <span className="fleche"> → </span>
        <code>{reaction.produit_SMILES}</code>
      </p>

      <p className="carte-reactifs">
        {reaction.reactifs.join(' + ')} · {reaction.solvant}
      </p>

      <NiveauDifficulte niveau={reaction.niveau_difficulte} />
    </Link>
  )
}
