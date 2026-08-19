// En-tête de l'application + bande des couleurs de familles.
import { NavLink } from 'react-router-dom'
import { COULEURS_FAMILLES } from '../couleurs.js'

export default function BarreNavigation() {
  const classeLien = ({ isActive }) => (isActive ? 'lien-nav actif' : 'lien-nav')

  return (
    <header className="entete">
      <div className="entete-interieur">
        <NavLink to="/" className="marque">
          <span className="marque-titre">ChimieRév</span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" className={classeLien} end>Réactions</NavLink>
          <NavLink to="/reactifs" className={classeLien}>Réactifs</NavLink>
          <NavLink to="/programme" className={classeLien}>Programme</NavLink>
          <NavLink to="/a-propos" className={classeLien}>À propos</NavLink>
        </nav>
      </div>

      {/*
        Bande des couleurs : une par famille de réactions. Elle sert de
        légende permanente — l'œil associe la teinte à la famille sans
        avoir à lire quoi que ce soit.
      */}
      <div className="bande-couleurs" aria-hidden="true">
        {Object.entries(COULEURS_FAMILLES).map(([famille, couleur]) => (
          <span key={famille} style={{ background: couleur }} title={famille} />
        ))}
      </div>
    </header>
  )
}
