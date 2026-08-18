// Une réaction s'affiche comme une case de tableau périodique :
// numéro en haut à gauche, difficulté en haut à droite, symbole en grand,
// puis le nom complet et l'équation en bas.
import { Link } from 'react-router-dom'
import { couleurFamille } from '../couleurs.js'

export default function CarteReaction({ reaction, numero }) {
  return (
    <Link
      to={`/reaction/${reaction.id}`}
      className="tuile"
      // --couleur est une variable CSS lue par la feuille de style :
      // c'est elle qui colore toute la tuile selon la famille.
      style={{ '--couleur': couleurFamille(reaction.famille) }}
    >
      <span className="tuile-numero">{numero}</span>
      <span className="tuile-difficulte" title="Difficulté sur 10">
        {reaction.niveau_difficulte}<span className="sur-dix">/10</span>
      </span>

      <span className="tuile-symbole">{reaction.symbole || reaction.id}</span>

      <span className="tuile-nom">{reaction.nom}</span>
      <span className="tuile-formule">
        {reaction.substrat_SMILES} → {reaction.produit_SMILES}
      </span>
    </Link>
  )
}
