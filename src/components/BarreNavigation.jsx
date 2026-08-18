// En-tête de l'application, affiché sur toutes les pages.
// Sur téléphone, le menu passe automatiquement sous le titre (voir index.css).
import { NavLink } from 'react-router-dom'

export default function BarreNavigation() {
  // NavLink ajoute tout seul la classe "active" au lien de la page courante :
  // on s'en sert pour le souligner.
  const classeLien = ({ isActive }) => (isActive ? 'lien-nav actif' : 'lien-nav')

  return (
    <header className="entete">
      <div className="entete-interieur">
        <NavLink to="/" className="marque">
          <span className="marque-titre">ChimieRév</span>
          <span className="marque-sous-titre">Chimie organique — révisions</span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" className={classeLien} end>Réactions</NavLink>
          <NavLink to="/a-propos" className={classeLien}>À propos</NavLink>
        </nav>
      </div>
    </header>
  )
}
