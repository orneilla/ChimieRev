// Le fil de retour, collé sous l'en-tête.
//
// Une fiche de réaction fait couramment quinze écrans de haut. Le lien
// « ← Toutes les réactions » existait en haut ET en bas de la fiche —
// autrement dit nulle part : depuis le milieu du mécanisme, il fallait
// choisir dans quel sens parcourir dix écrans pour l'atteindre.
//
// Il reste donc à l'écran en permanence, sous l'en-tête, et il rappelle
// où l'on se trouve : d'où l'on revient à gauche, ce qu'on lit à droite.
import { Link } from 'react-router-dom'

export default function BarreRetour({ vers, libelle, titre }) {
  return (
    <div className="barre-retour">
      <Link to={vers} className="retour-lien">
        <span className="retour-fleche" aria-hidden="true">←</span>
        <span className="retour-libelle">{libelle}</span>
      </Link>
      {titre && <span className="retour-titre" title={titre}>{titre}</span>}
    </div>
  )
}
