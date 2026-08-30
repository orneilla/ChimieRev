// En-tête de l'application + bande des couleurs de familles.
//
// SUR TÉLÉPHONE, le menu est replié derrière un bouton à trois barres :
// l'en-tête est collant (il suit le défilement), et six intitulés
// dépliés lui prenaient 126 px de haut — sur un écran de 844 px, c'est
// un septième de la page perdu en permanence.
//
// SUR TABLETTE ET ORDINATEUR, la place ne manque pas : les six entrées
// restent visibles. Un menu qu'on voit vaut toujours mieux qu'un menu
// qu'il faut deviner ; on ne le replie que lorsqu'on n'a pas le choix.
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { COULEURS_FAMILLES } from '../couleurs.js'

const ENTREES = [
  { to: '/', libelle: 'Réactions', exact: true },
  { to: '/reactifs', libelle: 'Réactifs' },
  { to: '/revision', libelle: 'Du jour' },
  { to: '/quiz', libelle: 'Quiz' },
  { to: '/programme', libelle: 'Programme' },
  { to: '/a-propos', libelle: 'À propos' }
]

export default function BarreNavigation() {
  const [ouvert, setOuvert] = useState(false)
  const emplacement = useLocation()
  const panneau = useRef(null)
  const entete = useRef(null)

  // Le fil de retour se colle SOUS l'en-tête : il lui faut sa hauteur, et
  // cette hauteur n'est pas une constante — la barre passe à la ligne sur
  // un écran étroit, et le menu déplié la double. On la mesure donc, et on
  // la publie en variable CSS plutôt que de la deviner.
  useEffect(() => {
    const cible = entete.current
    if (!cible) return
    const mesurer = () => {
      document.documentElement.style.setProperty(
        '--hauteur-entete', `${Math.round(cible.getBoundingClientRect().height)}px`
      )
    }
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(cible)
    return () => observateur.disconnect()
  }, [])

  // On referme dès qu'on a changé de page : sinon le menu resterait
  // ouvert par-dessus la page qu'on vient de demander.
  useEffect(() => { setOuvert(false) }, [emplacement.pathname])

  // Échap referme, et le focus revient dans le panneau à l'ouverture :
  // au clavier comme au doigt, on ne doit jamais se retrouver coincé.
  useEffect(() => {
    if (!ouvert) return
    const auClavier = (e) => { if (e.key === 'Escape') setOuvert(false) }
    document.addEventListener('keydown', auClavier)
    panneau.current?.querySelector('a')?.focus()
    return () => document.removeEventListener('keydown', auClavier)
  }, [ouvert])

  const classeLien = ({ isActive }) => (isActive ? 'lien-nav actif' : 'lien-nav')

  return (
    <header className="entete" ref={entete}>
      <div className="entete-interieur">
        <NavLink to="/" className="marque">
          <span className="marque-titre">ChimieRév</span>
        </NavLink>

        <button
          type="button"
          className={ouvert ? 'bouton-menu ouvert' : 'bouton-menu'}
          aria-expanded={ouvert}
          aria-controls="menu-principal"
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOuvert((v) => !v)}
        >
          {/* Trois barres qui deviennent une croix : le bouton dit dans
              quel état on se trouve, sans avoir à lire un libellé. */}
          <span className="barres" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="bouton-menu-mot" aria-hidden="true">Menu</span>
        </button>

        <nav
          id="menu-principal"
          className={ouvert ? 'nav nav-ouverte' : 'nav'}
          ref={panneau}
        >
          {ENTREES.map(({ to, libelle, exact }) => (
            <NavLink key={to} to={to} className={classeLien} end={exact}>
              {libelle}
            </NavLink>
          ))}
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
